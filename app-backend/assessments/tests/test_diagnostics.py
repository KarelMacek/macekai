import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from assessments.models import (
    Diagnostics,
    FeedbackRequest,
    Journey,
    JourneyStep,
    LikertOption,
    Question,
    Test,
)
from assessments.services import (
    current_diagnostics,
    diagnostics_status,
    link_unlinked_diagnostics,
    open_diagnostics,
)


@pytest.fixture
def journey(db):
    journey = Journey.objects.create(slug="test-journey", is_active=True, simpleshop_product_id="PROD1")
    test = Test.objects.create(slug="snap", test_type=Test.TYPE_SNAPSHOT, title={"en": "Snap"})
    question = Question.objects.create(test=test, question_type=Question.QUESTION_TYPE_LIKERT, text={"en": "Q"})
    LikertOption.objects.create(question=question, value=1.0, label={"en": "Yes"})
    JourneyStep.objects.create(journey=journey, test=test, order=0)
    return journey


@pytest.fixture
def user(db):
    return get_user_model().objects.create(username="alice", email="alice@example.com")


# --- open_diagnostics() idempotency -----------------------------------------

def test_open_diagnostics_dedupes_by_order_id(journey):
    first = open_diagnostics(email="a@example.com", journey=journey, source_order_id="ORDER1")
    second = open_diagnostics(email="a@example.com", journey=journey, source_order_id="ORDER1")

    assert first.id == second.id
    assert Diagnostics.objects.count() == 1


def test_open_diagnostics_without_order_id_always_creates(journey):
    open_diagnostics(email="a@example.com", journey=journey)
    open_diagnostics(email="a@example.com", journey=journey)

    assert Diagnostics.objects.count() == 2


def test_open_diagnostics_links_existing_user(journey, user):
    diagnostics = open_diagnostics(email="alice@example.com", journey=journey)
    assert diagnostics.user_id == user.id


def test_open_diagnostics_leaves_user_null_when_unknown(journey):
    diagnostics = open_diagnostics(email="unknown@example.com", journey=journey)
    assert diagnostics.user_id is None


# --- current_diagnostics() "latest wins" ------------------------------------

def test_current_diagnostics_is_latest(journey, user):
    open_diagnostics(email=user.email, journey=journey, source_order_id="A")
    second = open_diagnostics(email=user.email, journey=journey, source_order_id="B")

    assert current_diagnostics(user).id == second.id


def test_current_diagnostics_none_when_none_open(user):
    assert current_diagnostics(user) is None


# --- link_unlinked_diagnostics() backfill -----------------------------------

def test_link_unlinked_diagnostics_backfills_by_email(journey):
    diagnostics = open_diagnostics(email="late@example.com", journey=journey)
    assert diagnostics.user_id is None

    new_user = get_user_model().objects.create(username="late", email="late@example.com")
    link_unlinked_diagnostics(new_user)

    diagnostics.refresh_from_db()
    assert diagnostics.user_id == new_user.id


# --- completed-diagnostics write guard --------------------------------------

@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_submit_rejected_once_diagnostics_completed(api_client, journey, user):
    diagnostics = open_diagnostics(email=user.email, journey=journey)
    test = journey.steps.first().test
    question = test.questions.first()
    option = question.options.first()

    resp = api_client.post(
        f"/api/assessments/tests/{test.slug}/submit/",
        {"answers": [{"question_id": question.id, "option_id": option.id}]},
        format="json",
    )
    assert resp.status_code == 201
    assert diagnostics_status(diagnostics) == "awaiting_feedback_request"

    feedback_request = FeedbackRequest.objects.create(diagnostics=diagnostics)
    from assessments.models import AdminFeedback

    AdminFeedback.objects.create(feedback_request=feedback_request, is_published=True, video_url="https://x")
    assert diagnostics_status(diagnostics) == "completed"

    resp = api_client.post(
        f"/api/assessments/tests/{test.slug}/submit/",
        {"answers": [{"question_id": question.id, "option_id": option.id}]},
        format="json",
    )
    assert resp.status_code == 403


# --- diagnostics list/detail endpoints --------------------------------------

def test_diagnostics_list_scoped_to_owner(api_client, journey, user):
    open_diagnostics(email=user.email, journey=journey)
    other = get_user_model().objects.create(username="bob", email="bob@example.com")
    open_diagnostics(email=other.email, journey=journey)

    resp = api_client.get("/api/assessments/diagnostics/")
    assert resp.status_code == 200
    assert len(resp.data) == 1


def test_diagnostics_detail_404_for_non_owner(api_client, journey):
    other = get_user_model().objects.create(username="bob", email="bob@example.com")
    diagnostics = open_diagnostics(email=other.email, journey=journey)

    resp = api_client.get(f"/api/assessments/diagnostics/{diagnostics.id}/")
    assert resp.status_code == 404


# --- whoami gating ------------------------------------------------------------

def test_whoami_has_diagnostics_false_without_purchase(user):
    # /api/whoami/ is a plain Django view, not a DRF APIView — DRF's
    # force_authenticate() only patches DRF's own request handling, so a
    # real session login is needed here instead.
    client = APIClient()
    client.force_login(user)
    resp = client.get("/api/whoami/")
    assert resp.json()["has_diagnostics"] is False


def test_whoami_has_diagnostics_true_after_open(journey, user):
    open_diagnostics(email=user.email, journey=journey)
    client = APIClient()
    client.force_login(user)
    resp = client.get("/api/whoami/")
    assert resp.json()["has_diagnostics"] is True


# --- SimpleShop webhook -------------------------------------------------------

@pytest.fixture(autouse=True)
def webhook_secret(settings):
    settings.SIMPLESHOP_WEBHOOK_SECRET = "test-secret"


def _webhook_url(token="test-secret"):
    return f"/api/webhooks/simpleshop/{token}/"


def test_webhook_wrong_secret_returns_404(journey):
    resp = APIClient().get(_webhook_url("wrong-token"), {"mail": "x@example.com", "id": "1", "id_product": "PROD1"})
    assert resp.status_code == 404
    assert Diagnostics.objects.count() == 0


def test_webhook_opens_diagnostics_on_matching_product(journey):
    resp = APIClient().get(
        _webhook_url(), {"mail": "buyer@example.com", "id": "ORDER1", "number": "2026-01", "id_product": "PROD1"}
    )
    assert resp.status_code == 200
    diagnostics = Diagnostics.objects.get()
    assert diagnostics.email == "buyer@example.com"
    assert diagnostics.source_order_id == "ORDER1"
    assert diagnostics.user_id is None
    assert diagnostics.journey_id == journey.id


def test_webhook_idempotent_on_repeat_order(journey):
    params = {"mail": "buyer@example.com", "id": "ORDER1", "id_product": "PROD1"}
    APIClient().get(_webhook_url(), params)
    APIClient().get(_webhook_url(), params)
    assert Diagnostics.objects.count() == 1


def test_webhook_wrong_product_id_noops(journey):
    resp = APIClient().get(
        _webhook_url(), {"mail": "buyer@example.com", "id": "ORDER1", "id_product": "SOME-OTHER-PRODUCT"}
    )
    assert resp.status_code == 200
    assert Diagnostics.objects.count() == 0


def test_webhook_missing_mail_noops(journey):
    resp = APIClient().get(_webhook_url(), {"id": "ORDER1", "id_product": "PROD1"})
    assert resp.status_code == 200
    assert Diagnostics.objects.count() == 0


def test_webhook_accepts_post(journey):
    resp = APIClient().post(
        _webhook_url(), {"mail": "buyer@example.com", "id": "ORDER2", "id_product": "PROD1"}
    )
    assert resp.status_code == 200
    assert Diagnostics.objects.filter(source_order_id="ORDER2").exists()
