import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from assessments.models import (
    AdminFeedback,
    Answer,
    Category,
    Diagnostics,
    FeedbackRequest,
    Journey,
    JourneyStep,
    LikertOption,
    Question,
    Test,
    TestSubmission,
)
from assessments.services import diagnostics_status, get_or_create_draft, open_diagnostics


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
    test = Test.objects.create(slug="snap", test_type=Test.TYPE_SNAPSHOT, title={"en": "Snapshot"})
    category = Category.objects.create(test=test, key="growth", name={"en": "Growth"})
    q1 = Question.objects.create(
        test=test, category=category, question_type=Question.QUESTION_TYPE_LIKERT, text={"en": "Q1"}, order=0
    )
    q2 = Question.objects.create(
        test=test, category=category, question_type=Question.QUESTION_TYPE_LIKERT, text={"en": "Q2"}, order=1
    )
    for q in (q1, q2):
        LikertOption.objects.create(question=q, value=0.0, label={"en": "No"}, order=0)
        LikertOption.objects.create(question=q, value=1.0, label={"en": "Yes"}, order=1)
    return test


@pytest.fixture
def journey(snapshot_test):
    journey = Journey.objects.create(slug="test-journey", is_active=True)
    JourneyStep.objects.create(journey=journey, test=snapshot_test, order=0)
    return journey


@pytest.fixture
def diagnostics(user, journey):
    return open_diagnostics(email=user.email, journey=journey)


def _answer(question, value=1.0):
    option = question.options.get(value=value)
    return {"question_id": question.id, "option_id": option.id}


# --- GET /draft/ ---------------------------------------------------------

def test_get_draft_creates_empty_draft_on_first_visit(api_client, snapshot_test, diagnostics):
    resp = api_client.get(f"/api/assessments/tests/{snapshot_test.slug}/draft/")

    assert resp.status_code == 200
    assert resp.data["status"] == "draft"
    assert resp.data["submitted_at"] is None
    assert resp.data["answers"] == []
    assert TestSubmission.objects.filter(status=TestSubmission.STATUS_DRAFT).count() == 1


def test_get_draft_is_idempotent(api_client, snapshot_test, diagnostics):
    first = api_client.get(f"/api/assessments/tests/{snapshot_test.slug}/draft/")
    second = api_client.get(f"/api/assessments/tests/{snapshot_test.slug}/draft/")

    assert first.data["id"] == second.data["id"]
    assert TestSubmission.objects.filter(status=TestSubmission.STATUS_DRAFT).count() == 1


def test_get_draft_without_open_diagnostics_returns_403(api_client, snapshot_test):
    resp = api_client.get(f"/api/assessments/tests/{snapshot_test.slug}/draft/")
    assert resp.status_code == 403


# --- PATCH /draft/ (autosave) ---------------------------------------------

def test_patch_draft_upserts_answer(api_client, snapshot_test, diagnostics):
    question = snapshot_test.questions.first()

    resp = api_client.patch(
        f"/api/assessments/tests/{snapshot_test.slug}/draft/",
        {"answers": [_answer(question)]},
        format="json",
    )

    assert resp.status_code == 200
    assert resp.data["status"] == "draft"
    assert len(resp.data["answers"]) == 1

    draft = TestSubmission.objects.get(status=TestSubmission.STATUS_DRAFT)
    assert draft.computed_result == {}
    assert draft.submitted_at is None


def test_patch_draft_changing_an_answer_updates_in_place(api_client, snapshot_test, diagnostics):
    question = snapshot_test.questions.first()

    api_client.patch(
        f"/api/assessments/tests/{snapshot_test.slug}/draft/",
        {"answers": [_answer(question, value=0.0)]},
        format="json",
    )
    api_client.patch(
        f"/api/assessments/tests/{snapshot_test.slug}/draft/",
        {"answers": [_answer(question, value=1.0)]},
        format="json",
    )

    draft = TestSubmission.objects.get(status=TestSubmission.STATUS_DRAFT)
    assert draft.answers.count() == 1
    assert draft.answers.get().selected_option.value == 1.0


def test_draft_never_flips_diagnostics_status(api_client, snapshot_test, diagnostics):
    question = snapshot_test.questions.first()
    api_client.patch(
        f"/api/assessments/tests/{snapshot_test.slug}/draft/",
        {"answers": [_answer(question)]},
        format="json",
    )

    assert diagnostics_status(diagnostics) == "tests_in_progress"


# --- POST /submit/ partial-progress + resume ------------------------------

def test_partial_submit_keeps_answers_and_reports_missing(api_client, snapshot_test, diagnostics):
    q1, q2 = snapshot_test.questions.all()

    resp = api_client.post(
        f"/api/assessments/tests/{snapshot_test.slug}/submit/",
        {"answers": [_answer(q1)]},
        format="json",
    )

    assert resp.status_code == 400
    assert resp.data["missing_question_ids"] == [q2.id]
    # The answered question wasn't discarded by the failed submit.
    draft = TestSubmission.objects.get(status=TestSubmission.STATUS_DRAFT)
    assert draft.answers.count() == 1


def test_submit_after_resuming_a_draft_finalizes(api_client, snapshot_test, diagnostics):
    q1, q2 = snapshot_test.questions.all()
    api_client.patch(
        f"/api/assessments/tests/{snapshot_test.slug}/draft/",
        {"answers": [_answer(q1)]},
        format="json",
    )

    resp = api_client.post(
        f"/api/assessments/tests/{snapshot_test.slug}/submit/",
        {"answers": [_answer(q2)]},
        format="json",
    )

    assert resp.status_code == 201
    assert resp.data["status"] == "submitted"
    assert resp.data["submitted_at"] is not None
    assert TestSubmission.objects.filter(status=TestSubmission.STATUS_DRAFT).count() == 0
    assert TestSubmission.objects.filter(status=TestSubmission.STATUS_SUBMITTED).count() == 1


# --- Editing a submitted test ----------------------------------------------

def test_get_or_create_draft_seeds_from_latest_submission(api_client, snapshot_test, diagnostics):
    q1, q2 = snapshot_test.questions.all()
    api_client.post(
        f"/api/assessments/tests/{snapshot_test.slug}/submit/",
        {"answers": [_answer(q1, 1.0), _answer(q2, 0.0)]},
        format="json",
    )
    original = TestSubmission.objects.get(status=TestSubmission.STATUS_SUBMITTED)

    edit_draft = get_or_create_draft(test=snapshot_test, diagnostics=diagnostics, user=original.user)

    assert edit_draft.id != original.id
    assert edit_draft.status == TestSubmission.STATUS_DRAFT
    seeded = {a.question_id: a.selected_option.value for a in edit_draft.answers.all()}
    assert seeded == {q1.id: 1.0, q2.id: 0.0}
    # The original submitted row is untouched — history is preserved, not mutated.
    original.refresh_from_db()
    assert original.status == TestSubmission.STATUS_SUBMITTED
    assert original.answers.count() == 2


def test_editing_and_resubmitting_creates_new_submission_preserving_history(
    api_client, snapshot_test, diagnostics
):
    q1, q2 = snapshot_test.questions.all()
    api_client.post(
        f"/api/assessments/tests/{snapshot_test.slug}/submit/",
        {"answers": [_answer(q1, 0.0), _answer(q2, 0.0)]},
        format="json",
    )

    # Re-open for edit (GET /draft/ seeds from the submitted answers)...
    api_client.get(f"/api/assessments/tests/{snapshot_test.slug}/draft/")
    # ...change one answer...
    api_client.patch(
        f"/api/assessments/tests/{snapshot_test.slug}/draft/",
        {"answers": [_answer(q1, 1.0)]},
        format="json",
    )
    # ...and finalize the edit.
    resp = api_client.post(
        f"/api/assessments/tests/{snapshot_test.slug}/submit/",
        {"answers": []},
        format="json",
    )

    assert resp.status_code == 201
    assert TestSubmission.objects.filter(status=TestSubmission.STATUS_SUBMITTED).count() == 2
    latest = TestSubmission.objects.filter(status=TestSubmission.STATUS_SUBMITTED).order_by(
        "-submitted_at"
    ).first()
    assert latest.answers.get(question=q1).selected_option.value == 1.0
    assert latest.answers.get(question=q2).selected_option.value == 0.0


def test_editing_blocked_once_diagnostics_completed(api_client, snapshot_test, diagnostics):
    q1, q2 = snapshot_test.questions.all()
    api_client.post(
        f"/api/assessments/tests/{snapshot_test.slug}/submit/",
        {"answers": [_answer(q1), _answer(q2)]},
        format="json",
    )
    feedback_request = FeedbackRequest.objects.create(diagnostics=diagnostics)
    AdminFeedback.objects.create(feedback_request=feedback_request, is_published=True, video_url="https://x")

    resp = api_client.get(f"/api/assessments/tests/{snapshot_test.slug}/draft/")
    assert resp.status_code == 403


# --- Drafts stay invisible to listings -------------------------------------

def test_submission_list_excludes_drafts(api_client, snapshot_test, diagnostics):
    question = snapshot_test.questions.first()
    api_client.patch(
        f"/api/assessments/tests/{snapshot_test.slug}/draft/",
        {"answers": [_answer(question)]},
        format="json",
    )

    resp = api_client.get("/api/assessments/submissions/")
    assert resp.status_code == 200
    assert resp.data == []


def test_diagnostics_detail_excludes_drafts(api_client, snapshot_test, diagnostics):
    question = snapshot_test.questions.first()
    api_client.patch(
        f"/api/assessments/tests/{snapshot_test.slug}/draft/",
        {"answers": [_answer(question)]},
        format="json",
    )

    resp = api_client.get(f"/api/assessments/diagnostics/{diagnostics.id}/")
    assert resp.status_code == 200
    assert resp.data["submissions"] == []


# --- Unique-draft constraint -------------------------------------------------

def test_only_one_live_draft_per_user_test_diagnostics(snapshot_test, diagnostics, user):
    get_or_create_draft(test=snapshot_test, diagnostics=diagnostics, user=user)
    get_or_create_draft(test=snapshot_test, diagnostics=diagnostics, user=user)

    assert TestSubmission.objects.filter(status=TestSubmission.STATUS_DRAFT).count() == 1


# --- Journey step status reflects an in-progress draft ----------------------

def test_journey_step_is_in_progress_once_a_draft_exists(api_client, snapshot_test, diagnostics):
    resp = api_client.get("/api/assessments/journey/")
    assert resp.data["steps"][0]["status"] == "current"

    question = snapshot_test.questions.first()
    api_client.patch(
        f"/api/assessments/tests/{snapshot_test.slug}/draft/",
        {"answers": [_answer(question)]},
        format="json",
    )

    resp = api_client.get("/api/assessments/journey/")
    assert resp.data["steps"][0]["status"] == "in_progress"
