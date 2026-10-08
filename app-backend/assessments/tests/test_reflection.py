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



def test_every_item_takes_a_comment_in_any_state(api_client, diagnostics, test):
    assert all(q.allow_comment for q in test.questions.all())
    q1, q2, q3 = list(test.questions.all())[:3]
    answers = [
        {"question_id": q1.id, "option_id": q1.options.get(value=3).id, "comment": "Mostly at work."},
        {"question_id": q2.id, "response_state": "not_applicable", "comment": "We live apart."},
        {"question_id": q3.id, "response_state": "skipped", "comment": "Not sure yet."},
    ]
    resp = api_client.post(f"/api/assessments/tests/{test.slug}/submit/", {"answers": answers}, format="json")
    assert resp.status_code == 201
    comments = {a["question_id"]: a["comment"] for a in resp.json()["answers"] if a["comment"]}
    assert comments == {q1.id: "Mostly at work.", q2.id: "We live apart.", q3.id: "Not sure yet."}


def test_submit_with_partial_answers_marks_rest_skipped(api_client, diagnostics, test):
    q1 = test.questions.first()
    resp = api_client.post(
        f"/api/assessments/tests/{test.slug}/submit/",
        {"answers": [{"question_id": q1.id, "option_id": q1.options.get(value=6).id}]},
        format="json",
    )
    assert resp.status_code == 201
    answers = resp.json()["answers"]
    assert len(answers) == 30
    assert sum(a["response_state"] == "skipped" for a in answers) == 29
    cells = resp.json()["computed_result"]["reflection"]
    assert cells["S"]["experience"] == {"mean": None, "rated": 1, "total": 3}


def test_reflection_journey_is_complete_and_editable_after_submit(api_client, diagnostics, test, user):
    assert diagnostics_status(diagnostics) != "completed"
    submit = f"/api/assessments/tests/{test.slug}/submit/"
    assert api_client.post(submit, {"answers": []}, format="json").status_code == 201
    assert diagnostics_status(diagnostics) == "completed"
    # No coach-feedback stage, so the answers stay editable.
    assert api_client.get(f"/api/assessments/tests/{test.slug}/draft/").status_code == 200
    # ...and the UI is told not to offer a feedback request, which the API
    # would refuse anyway.
    journey = api_client.get("/api/assessments/journey/").json()
    assert journey["all_tests_done"] is True and journey["requires_feedback"] is False
    assert api_client.post("/api/assessments/feedback-request/", {"linkedin_url": "https://x.example"}).status_code == 403


def test_edit_draft_is_seeded_with_response_states(diagnostics, test, user):
    draft = get_or_create_draft(test=test, diagnostics=diagnostics, user=user)
    q = test.questions.first()
    Answer.objects.create(submission=draft, question=q, response_state=Answer.STATE_NOT_APPLICABLE)
    finalize_draft(draft, test)
    new_draft = get_or_create_draft(test=test, diagnostics=diagnostics, user=user)
    assert new_draft.answers.get(question=q).response_state == Answer.STATE_NOT_APPLICABLE


def test_standard_journeys_still_require_feedback(db):
    assert Journey.objects.get(slug="default").requires_feedback is True
    assert Journey.objects.get(slug="scarf-reflection").requires_feedback is False


def _submitted(api_client, test):
    resp = api_client.post(f"/api/assessments/tests/{test.slug}/submit/", {"answers": []}, format="json")
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
    assert {a["response_state"] for a in submission["answers"]} == {"skipped"}
