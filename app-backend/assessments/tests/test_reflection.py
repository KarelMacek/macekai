"""SCARF Relationship Reflection (issue #24): scoring, answer states, the
reflection-text endpoint, journey lifecycle and the seeded content. The seed
migration runs in the test DB, so these tests use the real seeded instrument."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from assessments.models import Answer, Journey, Question, Test, TestSubmission
from assessments.scoring import compute_result
from assessments.services import diagnostics_status, finalize_draft, get_or_create_draft, open_diagnostics

NA, SKIP = "na", "skip"


@pytest.fixture
def test(db):
    return Test.objects.get(slug="scarf-reflection")


@pytest.fixture
def user(db):
    return get_user_model().objects.create(username="alice", email="alice@example.com")


@pytest.fixture
def other_user(db):
    return get_user_model().objects.create(username="bob", email="bob@example.com")


@pytest.fixture
def diagnostics(user):
    return open_diagnostics(email=user.email, journey=Journey.objects.get(slug="scarf-reflection"))


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _answers(test, domain, role, values):
    """In-memory Answers for one domain/perspective's three items; each value
    is a 1-7 int, NA or SKIP."""
    questions = [q for q in test.questions.all() if q.config["domain"] == domain and q.config["role"] == role]
    assert len(questions) == 3
    out = []
    for question, value in zip(questions, values):
        if value == NA:
            out.append(Answer(question=question, response_state=Answer.STATE_NOT_APPLICABLE))
        elif value == SKIP:
            out.append(Answer(question=question, response_state=Answer.STATE_SKIPPED))
        else:
            option = question.options.get(value=value)
            out.append(Answer(question=question, selected_option=option))
    return out


def _cell(test, values, role="experience"):
    result = compute_result(test, _answers(test, "S", role, values))
    return result["reflection"]["S"][role]


@pytest.mark.parametrize(
    "values, mean, rated",
    [
        ([1, 4, 7], 4.0, 3),
        ([2, NA, 5], 3.5, 2),
        ([7, SKIP, NA], None, 1),
        ([NA, SKIP, NA], None, 0),
        ([1, 2, 2], 1.7, 3),
    ],
)
def test_scoring_checks_from_issue(test, values, mean, rated):
    cell = _cell(test, values)
    assert cell["mean"] == mean
    assert cell["rated"] == rated
    assert cell["total"] == 3


def test_contribution_stays_valid_when_experience_insufficient(test):
    answers = _answers(test, "S", "experience", [7, SKIP, NA]) + _answers(test, "S", "contribution", [3, 5, 4])
    result = compute_result(test, answers)["reflection"]["S"]
    assert result["experience"]["mean"] is None
    assert result["contribution"] == {"mean": 4.0, "rated": 3, "total": 3}


def test_changing_one_answer_only_changes_its_cell(test):
    base = _answers(test, "S", "experience", [1, 4, 7]) + _answers(test, "C", "experience", [2, 2, 2])
    changed = _answers(test, "S", "experience", [1, 4, 1]) + _answers(test, "C", "experience", [2, 2, 2])
    before = compute_result(test, base)["reflection"]
    after = compute_result(test, changed)["reflection"]
    assert before["S"]["experience"] != after["S"]["experience"]
    assert before["C"] == after["C"]
    assert before["S"]["contribution"] == after["S"]["contribution"]


def test_result_has_ten_cells_and_no_aggregate(test):
    result = compute_result(test, [])
    assert list(result) == ["reflection"]
    assert list(result["reflection"]) == ["S", "C", "A", "R", "F"]
    for roles in result["reflection"].values():
        assert set(roles) == {"experience", "contribution"}
        assert all(cell["mean"] is None and cell["rated"] == 0 for cell in roles.values())


def test_seeded_content(test):
    questions = list(test.questions.all())
    assert len(questions) == 30
    assert test.test_type == Test.TYPE_REFLECTION
    assert [c.key for c in test.categories.all()] == ["S", "C", "A", "R", "F"]
    item_ids = [q.config["item_id"] for q in questions]
    assert len(set(item_ids)) == 30
    assert "S1_experience" in item_ids and "F3_contribution" in item_ids
    for q in questions:
        assert q.text["en"].strip() and q.text["cs"].strip()
        assert [o.value for o in q.options.all()] == [1, 2, 3, 4, 5, 6, 7]
        assert all(o.label["en"] and o.label["cs"] for o in q.options.all())
    assert test.title["en"] == "SCARF Relationship Reflection"
    assert test.title["cs"]



def test_items_are_interleaved_not_grouped(test):
    items = [(q.config["domain"], q.config["role"], q.config["pair"]) for q in test.questions.all()]
    assert items[0] == ("S", "experience", "S1")
    for i in range(len(items)):
        assert items[i][0] not in {d for d, _, _ in items[max(0, i - 2) : i]}
        if i >= 2:
            assert len({r for _, r, _ in items[i - 2 : i + 1]}) == 2
    positions = {(p, r): i for i, (_, r, p) in enumerate(items)}
    for pair in {p for _, _, p in items}:
        assert abs(positions[(pair, "experience")] - positions[(pair, "contribution")]) >= 8


def test_answer_states_are_distinct_and_validated(api_client, diagnostics, test):
    q1, q2, q3 = list(test.questions.all())[:3]
    option = q1.options.get(value=5)

    def patch(answers):
        return api_client.patch(f"/api/assessments/tests/{test.slug}/draft/", {"answers": answers}, format="json")

    resp = patch(
        [
            {"question_id": q1.id, "option_id": option.id},
            {"question_id": q2.id, "response_state": "not_applicable"},
            {"question_id": q3.id, "response_state": "skipped"},
        ]
    )
    assert resp.status_code == 200
    states = {a["question_id"]: a["response_state"] for a in resp.json()["answers"]}
    assert states == {q1.id: "answered", q2.id: "not_applicable", q3.id: "skipped"}

    # An option cannot accompany N/A or skipped; an answered Likert needs one.
    assert patch([{"question_id": q1.id, "option_id": option.id, "response_state": "skipped"}]).status_code == 400
    assert patch([{"question_id": q1.id}]).status_code == 400



def _all_answered(test, value=5, overrides=None):
    """Every question answered with `value`; overrides maps question_id ->
    extra/replacement fields for that answer."""
    overrides = overrides or {}
    return [
        {"question_id": q.id, "option_id": q.options.get(value=value).id, **overrides.get(q.id, {})}
        for q in test.questions.all()
    ]


def test_every_item_takes_an_optional_comment(api_client, diagnostics, test):
    assert all(q.allow_comment for q in test.questions.all())
    q1, q2 = list(test.questions.all())[:2]
    answers = _all_answered(test, overrides={q1.id: {"comment": "Mostly at work."}, q2.id: {"comment": "Hard to say."}})
    resp = api_client.post(f"/api/assessments/tests/{test.slug}/submit/", {"answers": answers}, format="json")
    assert resp.status_code == 201
    comments = {a["question_id"]: a["comment"] for a in resp.json()["answers"] if a["comment"]}
    assert comments == {q1.id: "Mostly at work.", q2.id: "Hard to say."}


def test_submit_requires_every_item_answered(api_client, diagnostics, test):
    url = f"/api/assessments/tests/{test.slug}/submit/"
    q1 = test.questions.first()
    resp = api_client.post(url, {"answers": [{"question_id": q1.id, "option_id": q1.options.get(value=6).id}]}, format="json")
    assert resp.status_code == 400
    assert len(resp.json()["missing_question_ids"]) == 29

    # A comment saved before choosing a value (a "skipped" row) is not an answer.
    answers = _all_answered(test, overrides={q1.id: {"option_id": None, "response_state": "skipped", "comment": "x"}})
    resp = api_client.post(url, {"answers": answers}, format="json")
    assert resp.status_code == 400
    assert resp.json()["missing_question_ids"] == [q1.id]

    assert api_client.post(url, {"answers": _all_answered(test)}, format="json").status_code == 201


def test_reflection_journey_goes_through_feedback_without_a_cv(api_client, diagnostics, test, user):
    submit = f"/api/assessments/tests/{test.slug}/submit/"
    assert diagnostics_status(diagnostics) != "completed"
    assert api_client.post(submit, {"answers": _all_answered(test)}, format="json").status_code == 201
    assert diagnostics_status(diagnostics) == "awaiting_feedback_request"

    journey = api_client.get("/api/assessments/journey/").json()
    assert journey["all_tests_done"] is True
    assert journey["requires_feedback"] is True and journey["feedback_needs_cv"] is False

    # Sending the answers is one empty request - no CV / LinkedIn needed.
    url = "/api/assessments/feedback-request/"
    assert api_client.post(url, {}, format="multipart").status_code == 201
    assert diagnostics_status(diagnostics) == "awaiting_admin_review"
    assert api_client.get("/api/assessments/journey/").json()["feedback_request_submitted"] is True
    # Answers stay editable until the feedback is published.
    assert api_client.get(f"/api/assessments/tests/{test.slug}/draft/").status_code == 200


def test_edit_draft_is_seeded_with_response_states(diagnostics, test, user):
    draft = get_or_create_draft(test=test, diagnostics=diagnostics, user=user)
    q = test.questions.first()
    Answer.objects.create(submission=draft, question=q, response_state=Answer.STATE_NOT_APPLICABLE)
    finalize_draft(draft, test)
    new_draft = get_or_create_draft(test=test, diagnostics=diagnostics, user=user)
    assert new_draft.answers.get(question=q).response_state == Answer.STATE_NOT_APPLICABLE


def test_standard_journeys_still_require_a_cv_for_feedback(db):
    default = Journey.objects.get(slug="default")
    assert default.requires_feedback is True and default.feedback_needs_cv is True
    scarf = Journey.objects.get(slug="scarf-reflection")
    assert scarf.requires_feedback is True and scarf.feedback_needs_cv is False


def test_empty_feedback_request_still_rejected_when_a_cv_is_needed(db, user):
    from assessments.serializers import FeedbackRequestSerializer

    diagnostics = open_diagnostics(email=user.email, journey=Journey.objects.get(slug="default"))
    serializer = FeedbackRequestSerializer(data={}, context={"diagnostics": diagnostics})
    assert not serializer.is_valid()
    assert FeedbackRequestSerializer(data={}, context={}).is_valid() is False


def test_scarf_stays_out_of_the_entry_diagnostic_funnel(api_client, diagnostics, test):
    from assessments.services import diagnostics_funnel_counts

    api_client.post(f"/api/assessments/tests/{test.slug}/submit/", {"answers": _all_answered(test)}, format="json")
    assert diagnostics_funnel_counts() == {"paid_count": 0, "started_count": 0, "completed_count": 0}


def test_admin_sees_area_comments_only_after_the_answers_are_sent(api_client, diagnostics, test, user):
    sid = _submitted(api_client, test)
    api_client.put(f"/api/assessments/submissions/{sid}/reflection/", {"S": {"comment": "Mostly calm."}}, format="json")

    admin = get_user_model().objects.create(username="karel", email="karel@example.com", is_staff=True)
    staff = APIClient()
    staff.force_authenticate(user=admin)
    url = f"/api/assessments/admin/diagnostics/{diagnostics.id}/"
    assert "reflection" not in staff.get(url).json()["submissions"][0]

    assert api_client.post("/api/assessments/feedback-request/", {}, format="multipart").status_code == 201
    assert staff.get(url).json()["submissions"][0]["reflection"]["S"]["comment"] == "Mostly calm."


def _submitted(api_client, test):
    resp = api_client.post(f"/api/assessments/tests/{test.slug}/submit/", {"answers": _all_answered(test)}, format="json")
    return resp.json()["id"]


def test_written_reflection_roundtrip_and_validation(api_client, diagnostics, test):
    sid = _submitted(api_client, test)
    url = f"/api/assessments/submissions/{sid}/reflection/"
    assert api_client.get(url).json() == {}

    body = {"S": {"situation": "We argued about plans.", "exception": "", "missing": "Tone."}}
    resp = api_client.put(url, body, format="json")
    assert resp.status_code == 200
    assert api_client.get(url).json() == {
        "S": {"comment": "", "situation": "We argued about plans.", "exception": "", "missing": "Tone."}
    }

    # The results page's single per-domain comment.
    api_client.put(url, {"A": {"comment": "Mostly about weekends."}}, format="json")
    assert api_client.get(url).json() == {
        "A": {"comment": "Mostly about weekends.", "situation": "", "exception": "", "missing": ""}
    }

    # Empty entries are dropped; unknown domains are rejected.
    api_client.put(url, {"S": {"situation": " ", "exception": "", "missing": ""}}, format="json")
    assert api_client.get(url).json() == {}
    assert api_client.put(url, {"Z": {"situation": "x"}}, format="json").status_code == 400


def test_written_reflection_is_owner_only(api_client, diagnostics, test, other_user):
    sid = _submitted(api_client, test)
    other = APIClient()
    other.force_authenticate(user=other_user)
    url = f"/api/assessments/submissions/{sid}/reflection/"
    assert other.get(url).status_code == 404
    assert other.put(url, {"S": {"situation": "x"}}, format="json").status_code == 404


def test_written_reflection_included_in_data_export(api_client, diagnostics, test, user):
    from assessments.gdpr import export_identity

    sid = _submitted(api_client, test)
    api_client.put(
        f"/api/assessments/submissions/{sid}/reflection/", {"F": {"situation": "dishes"}}, format="json"
    )
    exported = export_identity(user=user)
    submission = exported["diagnostics"][0]["submissions"][0]
    assert submission["reflection"]["F"]["situation"] == "dishes"
    assert {a["response_state"] for a in submission["answers"]} == {"answered"}
