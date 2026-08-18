import base64
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from assessments.gdpr import delete_identity, export_identity, resolve_identity, summarize_identity
from assessments.models import (
    AdminFeedback,
    Answer,
    Diagnostics,
    FeedbackRequest,
    FileBlob,
    Journey,
    JourneyStep,
    LikertOption,
    Question,
    Test,
    TestSubmission,
    UserConsent,
)
from assessments.services import open_diagnostics


@pytest.fixture(autouse=True)
def mock_send_mail():
    with patch("assessments.emailing.graph_mail.send_mail") as mock:
        yield mock


@pytest.fixture
def journey(db):
    journey = Journey.objects.create(slug="gdpr-journey", is_active=True)
    test = Test.objects.create(slug="gdpr-snap", test_type=Test.TYPE_SNAPSHOT, title={"en": "Snap"})
    question = Question.objects.create(test=test, question_type=Question.QUESTION_TYPE_LIKERT, text={"en": "Q"})
    LikertOption.objects.create(question=question, value=1.0, label={"en": "Yes"})
    JourneyStep.objects.create(journey=journey, test=test, order=0)
    return journey, test, question


@pytest.fixture
def user(db):
    return get_user_model().objects.create(username="alice", email="alice@example.com")


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _full_diagnostics_graph(journey_fixture, *, email, user=None):
    """Builds one Diagnostics with a FeedbackRequest+CV and a published
    AdminFeedback+document — the full graph a real person accumulates.
    Also adds a submitted TestSubmission+Answer when a user is given
    (TestSubmission.user is non-nullable — a test can't be submitted
    before the buyer's first login, unlike the Diagnostics purchase
    itself, which can)."""
    journey, test, question = journey_fixture
    diagnostics = open_diagnostics(email=email, journey=journey)
    if user:
        diagnostics.user = user
        diagnostics.save(update_fields=["user"])

        submission = TestSubmission.objects.create(
            test=test, user=user, diagnostics=diagnostics, status=TestSubmission.STATUS_SUBMITTED
        )
        Answer.objects.create(
            submission=submission, question=question, text_value="my answer", comment="a comment"
        )

    feedback_request = FeedbackRequest.objects.create(
        diagnostics=diagnostics,
        cv_file=SimpleUploadedFile("cv.pdf", b"%PDF-1.4 fake cv bytes"),
        linkedin_url="https://linkedin.com/in/test",
    )
    AdminFeedback.objects.create(
        feedback_request=feedback_request,
        document=SimpleUploadedFile("feedback.pdf", b"%PDF-1.4 fake feedback bytes"),
        video_url="https://example.com/video",
        notes="great job",
        is_published=True,
    )
    return diagnostics


# --- resolve_identity ---------------------------------------------------

def test_resolve_identity_by_user_and_email_agree(journey, user):
    diagnostics = _full_diagnostics_graph(journey, email=user.email, user=user)

    by_user = resolve_identity(user=user)
    by_email = resolve_identity(email=user.email)

    assert list(by_user.diagnostics) == [diagnostics]
    assert list(by_email.diagnostics) == [diagnostics]


def test_resolve_identity_finds_prelogin_purchase_by_email_only(journey):
    diagnostics = _full_diagnostics_graph(journey, email="prelogin@example.com")

    graph = resolve_identity(email="prelogin@example.com")

    assert diagnostics.user_id is None
    assert list(graph.diagnostics) == [diagnostics]


def test_resolve_identity_requires_user_or_email():
    with pytest.raises(ValueError):
        resolve_identity()


# --- delete_identity ------------------------------------------------------

def test_delete_identity_removes_full_graph(journey, user):
    diagnostics = _full_diagnostics_graph(journey, email=user.email, user=user)
    UserConsent.objects.create(user=user, ai_processing_consent=True, research_consent=False)
    cv_name = diagnostics.feedback_request.cv_file.name
    doc_name = diagnostics.feedback_request.feedback.document.name

    summary = delete_identity(user=user)

    assert summary["diagnostics_count"] == 1
    assert not get_user_model().objects.filter(pk=user.pk).exists()
    assert not Diagnostics.objects.filter(pk=diagnostics.pk).exists()
    assert not TestSubmission.objects.filter(diagnostics=diagnostics).exists()
    assert not Answer.objects.exists()
    assert not FeedbackRequest.objects.filter(diagnostics=diagnostics).exists()
    assert not AdminFeedback.objects.exists()
    assert not UserConsent.objects.filter(user_id=user.pk).exists()
    assert not FileBlob.objects.filter(name=cv_name).exists()
    assert not FileBlob.objects.filter(name=doc_name).exists()


def test_delete_identity_cleans_up_orphan_uploaded_blobs(journey, user):
    blob_name = FileBlob.objects.create(
        name="orphan-key", original_filename="orphan.txt", data=b"x", size=1, uploaded_by=user
    ).name

    delete_identity(user=user)

    assert not FileBlob.objects.filter(name=blob_name).exists()


def test_delete_identity_by_email_only_needs_no_user_row(journey):
    diagnostics = _full_diagnostics_graph(journey, email="testcleanup@example.com")
    cv_name = diagnostics.feedback_request.cv_file.name

    summary = delete_identity(email="testcleanup@example.com")

    assert summary["user"] is None
    assert not Diagnostics.objects.filter(pk=diagnostics.pk).exists()
    assert not FileBlob.objects.filter(name=cv_name).exists()


def test_delete_identity_is_idempotent(journey, user):
    _full_diagnostics_graph(journey, email=user.email, user=user)
    delete_identity(user=user)

    summary = delete_identity(email=user.email)

    assert summary["diagnostics_count"] == 0
    assert summary["submissions_count"] == 0


def test_delete_identity_does_not_touch_other_people(journey, user):
    keep = _full_diagnostics_graph(journey, email="other@example.com")
    _full_diagnostics_graph(journey, email=user.email, user=user)

    delete_identity(user=user)

    assert Diagnostics.objects.filter(pk=keep.pk).exists()


def test_delete_identity_leaves_content_data_alone(journey, user):
    journey_obj, test, question = journey
    _full_diagnostics_graph(journey, email=user.email, user=user)

    delete_identity(user=user)

    assert Test.objects.filter(pk=test.pk).exists()
    assert Journey.objects.filter(pk=journey_obj.pk).exists()
    assert Question.objects.filter(pk=question.pk).exists()


# --- export_identity --------------------------------------------------

def test_export_identity_includes_profile_consent_and_diagnostics(journey, user):
    UserConsent.objects.create(user=user, ai_processing_consent=True, research_consent=True)
    _full_diagnostics_graph(journey, email=user.email, user=user)

    payload = export_identity(user=user)

    assert payload["profile"]["email"] == user.email
    assert payload["consent"]["ai_processing_consent"] is True
    assert len(payload["diagnostics"]) == 1
    assert payload["diagnostics"][0]["journey_slug"] == journey[0].slug


def test_export_identity_includes_draft_submissions(journey, user):
    journey_obj, test, question = journey
    diagnostics = open_diagnostics(email=user.email, journey=journey_obj)
    diagnostics.user = user
    diagnostics.save(update_fields=["user"])
    TestSubmission.objects.create(
        test=test, user=user, diagnostics=diagnostics, status=TestSubmission.STATUS_DRAFT
    )

    payload = export_identity(user=user)

    assert payload["diagnostics"][0]["submissions"][0]["status"] == TestSubmission.STATUS_DRAFT


def test_export_identity_embeds_files_as_base64_roundtrip(journey, user):
    diagnostics = _full_diagnostics_graph(journey, email=user.email, user=user)

    payload = export_identity(user=user)

    cv_export = payload["diagnostics"][0]["feedback_request"]["cv_file"]
    assert base64.b64decode(cv_export["base64"]) == b"%PDF-1.4 fake cv bytes"
    doc_export = payload["diagnostics"][0]["feedback"]["document"]
    assert base64.b64decode(doc_export["base64"]) == b"%PDF-1.4 fake feedback bytes"


def test_export_identity_includes_unpublished_feedback(journey, user):
    diagnostics = _full_diagnostics_graph(journey, email=user.email, user=user)
    diagnostics.feedback_request.feedback.is_published = False
    diagnostics.feedback_request.feedback.save(update_fields=["is_published"])

    payload = export_identity(user=user)

    assert payload["diagnostics"][0]["feedback"]["is_published"] is False
    assert payload["diagnostics"][0]["feedback"]["notes"] == "great job"


def test_export_identity_well_formed_for_user_with_no_diagnostics(user):
    payload = export_identity(user=user)

    assert payload["diagnostics"] == []
    assert payload["profile"]["email"] == user.email
    assert payload["consent"] is None


# --- self-service export endpoint --------------------------------------

def test_export_endpoint_returns_downloadable_json(api_client, journey, user):
    _full_diagnostics_graph(journey, email=user.email, user=user)

    resp = api_client.get("/api/assessments/export/")

    assert resp.status_code == 200
    assert resp["Content-Disposition"].startswith("attachment;")
    body = resp.json()
    assert body["email"] == user.email
    assert len(body["diagnostics"]) == 1


def test_export_endpoint_requires_auth():
    resp = APIClient().get("/api/assessments/export/")
    assert resp.status_code in (401, 403)


# --- admin action: erase_gdpr_data (User admin) -------------------------

def test_user_admin_action_shows_confirmation_without_deleting(admin_client, journey, user):
    _full_diagnostics_graph(journey, email=user.email, user=user)

    resp = admin_client.post(
        "/admin/auth/user/",
        {"action": "erase_gdpr_data", "_selected_action": [user.pk]},
    )

    assert resp.status_code == 200
    assert b"diagnostics" in resp.content
    assert get_user_model().objects.filter(pk=user.pk).exists()


def test_user_admin_action_rejects_wrong_typed_email(admin_client, journey, user):
    _full_diagnostics_graph(journey, email=user.email, user=user)

    resp = admin_client.post(
        "/admin/auth/user/",
        {
            "action": "erase_gdpr_data",
            "_selected_action": [user.pk],
            "confirm_erasure": "1",
            "typed_email": "wrong@example.com",
        },
    )

    assert get_user_model().objects.filter(pk=user.pk).exists()


def test_user_admin_action_deletes_on_correct_typed_email(admin_client, journey, user):
    _full_diagnostics_graph(journey, email=user.email, user=user)

    resp = admin_client.post(
        "/admin/auth/user/",
        {
            "action": "erase_gdpr_data",
            "_selected_action": [user.pk],
            "confirm_erasure": "1",
            "typed_email": user.email,
        },
        follow=True,
    )

    assert resp.status_code == 200
    assert not get_user_model().objects.filter(pk=user.pk).exists()


def test_user_admin_action_rejects_multi_select(admin_client, journey, user):
    other = get_user_model().objects.create(username="bob", email="bob@example.com")

    resp = admin_client.post(
        "/admin/auth/user/",
        {
            "action": "erase_gdpr_data",
            "_selected_action": [user.pk, other.pk],
            "confirm_erasure": "1",
            "typed_email": user.email,
        },
        follow=True,
    )

    assert get_user_model().objects.filter(pk=user.pk).exists()
    assert get_user_model().objects.filter(pk=other.pk).exists()


def test_user_admin_has_no_ordinary_delete_permission(admin_client, user):
    resp = admin_client.get(f"/admin/auth/user/{user.pk}/delete/")
    assert resp.status_code == 403

    changelist = admin_client.get("/admin/auth/user/")
    assert b"delete_selected" not in changelist.content


# --- admin action: erase_gdpr_data_for_email (Diagnostics admin) --------

def test_diagnostics_admin_email_erasure_requires_confirmation(admin_client, journey):
    diagnostics = _full_diagnostics_graph(journey, email="cleanup@example.com")

    resp = admin_client.post(
        "/admin/assessments/diagnostics/",
        {"action": "erase_gdpr_data_for_email", "_selected_action": [diagnostics.pk]},
    )

    assert resp.status_code == 200
    assert Diagnostics.objects.filter(pk=diagnostics.pk).exists()


def test_diagnostics_admin_email_erasure_deletes_on_correct_email(admin_client, journey):
    diagnostics = _full_diagnostics_graph(journey, email="cleanup@example.com")

    admin_client.post(
        "/admin/assessments/diagnostics/",
        {
            "action": "erase_gdpr_data_for_email",
            "_selected_action": [diagnostics.pk],
            "confirm_erasure": "1",
            "typed_email": "cleanup@example.com",
        },
        follow=True,
    )

    assert not Diagnostics.objects.filter(pk=diagnostics.pk).exists()


def test_diagnostics_admin_email_erasure_rejects_mixed_emails(admin_client, journey):
    journey_obj, test, question = journey
    d1 = open_diagnostics(email="a@example.com", journey=journey_obj)
    d2 = open_diagnostics(email="b@example.com", journey=journey_obj)

    admin_client.post(
        "/admin/assessments/diagnostics/",
        {
            "action": "erase_gdpr_data_for_email",
            "_selected_action": [d1.pk, d2.pk],
            "confirm_erasure": "1",
            "typed_email": "a@example.com",
        },
        follow=True,
    )

    assert Diagnostics.objects.filter(pk=d1.pk).exists()
    assert Diagnostics.objects.filter(pk=d2.pk).exists()
