import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from assessments.models import (
    AdminFeedback,
    Category,
    Diagnostics,
    FeedbackRequest,
    Journey,
    JourneyStep,
    LikertOption,
    Question,
    Test,
)


@pytest.fixture
def user(db):
    return get_user_model().objects.create(username="alice", email="alice@example.com")


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def snapshot_test(db):
    test = Test.objects.create(
        slug="snap", test_type=Test.TYPE_SNAPSHOT, title={"en": "Snapshot", "cs": "Snimek"}
    )
    category = Category.objects.create(
        test=test, key="growth", name={"en": "Growth", "cs": "Rust"}
    )
    question = Question.objects.create(
        test=test,
        category=category,
        question_type=Question.QUESTION_TYPE_LIKERT,
        text={"en": "How do you grow?", "cs": "Jak rostes?"},
    )
    LikertOption.objects.create(question=question, value=0.2, label={"en": "Never", "cs": "Nikdy"})
    LikertOption.objects.create(question=question, value=1.0, label={"en": "Always", "cs": "Vzdy"})
    return test


def test_test_detail_resolves_requested_locale(api_client, snapshot_test):
    resp = api_client.get(f"/api/assessments/tests/{snapshot_test.slug}/?lang=cs")

    assert resp.status_code == 200
    assert resp.data["title"] == "Snimek"
    assert resp.data["categories"][0]["name"] == "Rust"
    assert resp.data["questions"][0]["text"] == "Jak rostes?"


def test_test_detail_falls_back_to_english(api_client, snapshot_test):
    resp = api_client.get(f"/api/assessments/tests/{snapshot_test.slug}/")

    assert resp.status_code == 200
    assert resp.data["title"] == "Snapshot"


@pytest.fixture
def journey(snapshot_test):
    journey = Journey.objects.create(slug="test-journey", is_active=True)
    JourneyStep.objects.create(journey=journey, test=snapshot_test, order=0)
    return journey


@pytest.fixture
def diagnostics(user, journey):
    return Diagnostics.objects.create(email=user.email, user=user, journey=journey)


def test_submit_missing_answers_returns_400(api_client, snapshot_test, diagnostics):
    resp = api_client.post(
        f"/api/assessments/tests/{snapshot_test.slug}/submit/", {"answers": []}, format="json"
    )

    assert resp.status_code == 400


def test_submit_valid_answer_freezes_computed_result(api_client, snapshot_test, diagnostics):
    question = snapshot_test.questions.first()
    option = question.options.get(value=1.0)

    resp = api_client.post(
        f"/api/assessments/tests/{snapshot_test.slug}/submit/",
        {"answers": [{"question_id": question.id, "option_id": option.id}]},
        format="json",
    )

    assert resp.status_code == 201
    assert resp.data["computed_result"]["categories"]["growth"] == 1.0


def test_submit_without_open_diagnostics_returns_403(api_client, snapshot_test):
    resp = api_client.post(
        f"/api/assessments/tests/{snapshot_test.slug}/submit/", {"answers": []}, format="json"
    )
    assert resp.status_code == 403


def test_submit_requires_authentication(snapshot_test):
    client = APIClient()
    resp = client.get(f"/api/assessments/tests/{snapshot_test.slug}/")
    assert resp.status_code in (401, 403)


def test_feedback_hidden_until_published(api_client, diagnostics):
    feedback_request = FeedbackRequest.objects.create(
        diagnostics=diagnostics, linkedin_url="https://linkedin.com/in/alice"
    )

    resp = api_client.get("/api/assessments/feedback/")
    assert resp.status_code == 404

    feedback = AdminFeedback.objects.create(
        feedback_request=feedback_request,
        video_url="https://example.com/video",
        is_published=False,
    )
    resp = api_client.get("/api/assessments/feedback/")
    assert resp.status_code == 404

    feedback.is_published = True
    feedback.save()
    resp = api_client.get("/api/assessments/feedback/")
    assert resp.status_code == 200
    assert resp.data["video_url"] == "https://example.com/video"


def test_journey_reports_current_step(api_client, diagnostics):
    resp = api_client.get("/api/assessments/journey/")

    assert resp.status_code == 200
    assert resp.data["steps"][0]["status"] == "current"
    assert resp.data["all_tests_done"] is False
