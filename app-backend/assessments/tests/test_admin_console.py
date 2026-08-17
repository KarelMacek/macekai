import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from assessments.models import AdminFeedback, Diagnostics, FeedbackRequest, Journey, JourneyStep, Test, TestSubmission
from assessments.services import open_diagnostics


@pytest.fixture
def journey(db):
    journey = Journey.objects.create(slug="admin-test-journey", is_active=True)
    test = Test.objects.create(slug="admin-snap", test_type=Test.TYPE_SNAPSHOT, title={"en": "Snap"})
    JourneyStep.objects.create(journey=journey, test=test, order=0)
    return journey


@pytest.fixture
def customer(db):
    return get_user_model().objects.create(username="customer", email="customer@example.com")


@pytest.fixture
def staff_user(db):
    return get_user_model().objects.create(
        username="admin", email="admin@example.com", is_staff=True, is_superuser=True
    )


@pytest.fixture
def customer_client(customer):
    client = APIClient()
    client.force_authenticate(user=customer)
    return client


@pytest.fixture
def staff_client(staff_user):
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client


@pytest.fixture
def diagnostics(journey, customer):
    return open_diagnostics(email=customer.email, journey=journey)


# --- permission enforcement ---------------------------------------------

def test_admin_list_rejects_non_staff(customer_client):
    resp = customer_client.get("/api/assessments/admin/diagnostics/")
    assert resp.status_code == 403


def test_admin_detail_rejects_non_staff(customer_client, diagnostics):
    resp = customer_client.get(f"/api/assessments/admin/diagnostics/{diagnostics.id}/")
    assert resp.status_code == 403


def test_admin_feedback_write_rejects_non_staff(customer_client, diagnostics):
    resp = customer_client.post(
        f"/api/assessments/admin/feedback-requests/1/feedback/", {"notes": "x"}
    )
    assert resp.status_code == 403


# --- list ------------------------------------------------------------------

def test_admin_list_sees_other_users_diagnostics(staff_client, diagnostics):
    resp = staff_client.get("/api/assessments/admin/diagnostics/")
    assert resp.status_code == 200
    emails = [row["email"] for row in resp.data]
    assert "customer@example.com" in emails


def test_admin_list_filters_by_email_query(staff_client, journey, diagnostics):
    open_diagnostics(email="someone-else@example.com", journey=journey)

    resp = staff_client.get("/api/assessments/admin/diagnostics/?q=customer")
    assert resp.status_code == 200
    assert len(resp.data) == 1
    assert resp.data[0]["email"] == "customer@example.com"


def test_admin_list_filters_by_status(staff_client, diagnostics):
    resp = staff_client.get("/api/assessments/admin/diagnostics/?status=tests_in_progress")
    assert resp.status_code == 200
    assert len(resp.data) == 1

    resp = staff_client.get("/api/assessments/admin/diagnostics/?status=completed")
    assert resp.status_code == 200
    assert len(resp.data) == 0


# --- stats -------------------------------------------------------------------

def test_admin_stats_rejects_non_staff(customer_client):
    resp = customer_client.get("/api/assessments/admin/diagnostics/stats/")
    assert resp.status_code == 403


def test_admin_stats_counts_paid_started_completed(staff_client, journey):
    test = journey.steps.first().test

    open_diagnostics(email="paid-only@example.com", journey=journey)

    started_user = get_user_model().objects.create(username="started", email="started@example.com")
    started_diagnostics = open_diagnostics(email=started_user.email, journey=journey)
    TestSubmission.objects.create(
        test=test, diagnostics=started_diagnostics, user=started_user, status=TestSubmission.STATUS_DRAFT
    )

    done_user = get_user_model().objects.create(username="done", email="done@example.com")
    done_diagnostics = open_diagnostics(email=done_user.email, journey=journey)
    TestSubmission.objects.create(
        test=test, diagnostics=done_diagnostics, user=done_user, status=TestSubmission.STATUS_SUBMITTED
    )
    feedback_request = FeedbackRequest.objects.create(diagnostics=done_diagnostics)
    AdminFeedback.objects.create(feedback_request=feedback_request, is_published=True)

    resp = staff_client.get("/api/assessments/admin/diagnostics/stats/")
    assert resp.status_code == 200
    assert resp.data["paid_count"] == 3
    assert resp.data["started_count"] == 2
    assert resp.data["completed_count"] == 1


def test_admin_stats_filters_by_date_range(staff_client, journey):
    from datetime import date, timedelta

    from django.utils import timezone

    old = open_diagnostics(email="old@example.com", journey=journey)
    Diagnostics.objects.filter(pk=old.pk).update(opened_at=timezone.now() - timedelta(days=10))

    open_diagnostics(email="recent@example.com", journey=journey)

    today = date.today().isoformat()
    resp = staff_client.get(f"/api/assessments/admin/diagnostics/stats/?from={today}")
    assert resp.status_code == 200
    assert resp.data["paid_count"] == 1


# --- detail ------------------------------------------------------------------

def test_admin_detail_not_scoped_to_requester(staff_client, diagnostics):
    resp = staff_client.get(f"/api/assessments/admin/diagnostics/{diagnostics.id}/")
    assert resp.status_code == 200
    assert resp.data["id"] == diagnostics.id


def test_admin_detail_includes_unpublished_feedback(staff_client, diagnostics):
    feedback_request = FeedbackRequest.objects.create(diagnostics=diagnostics, linkedin_url="https://x")
    AdminFeedback.objects.create(feedback_request=feedback_request, notes="draft", is_published=False)

    resp = staff_client.get(f"/api/assessments/admin/diagnostics/{diagnostics.id}/")
    assert resp.status_code == 200
    assert resp.data["feedback"]["notes"] == "draft"


# --- feedback write ------------------------------------------------------------------

def test_admin_can_create_then_update_feedback(staff_client, diagnostics):
    feedback_request = FeedbackRequest.objects.create(diagnostics=diagnostics, linkedin_url="https://x")

    resp = staff_client.post(
        f"/api/assessments/admin/feedback-requests/{feedback_request.id}/feedback/",
        {"video_url": "https://example.com/v1", "notes": "first pass"},
    )
    assert resp.status_code == 201
    assert AdminFeedback.objects.filter(feedback_request=feedback_request).count() == 1

    resp = staff_client.post(
        f"/api/assessments/admin/feedback-requests/{feedback_request.id}/feedback/",
        {"video_url": "https://example.com/v2", "notes": "revised", "is_published": "true"},
    )
    assert resp.status_code == 200
    assert AdminFeedback.objects.filter(feedback_request=feedback_request).count() == 1
    feedback = AdminFeedback.objects.get(feedback_request=feedback_request)
    assert feedback.video_url == "https://example.com/v2"
    assert feedback.is_published is True


def test_admin_published_feedback_visible_to_customer(staff_client, customer_client, diagnostics):
    feedback_request = FeedbackRequest.objects.create(diagnostics=diagnostics, linkedin_url="https://x")
    staff_client.post(
        f"/api/assessments/admin/feedback-requests/{feedback_request.id}/feedback/",
        {"video_url": "https://example.com/v1", "is_published": "true"},
    )

    resp = customer_client.get("/api/assessments/feedback/")
    assert resp.status_code == 200
    assert resp.data["video_url"] == "https://example.com/v1"


def test_whoami_reports_is_staff(staff_user, customer):
    staff_c = APIClient()
    staff_c.force_login(staff_user)
    assert staff_c.get("/api/whoami/").json()["is_staff"] is True

    customer_c = APIClient()
    customer_c.force_login(customer)
    assert customer_c.get("/api/whoami/").json()["is_staff"] is False
