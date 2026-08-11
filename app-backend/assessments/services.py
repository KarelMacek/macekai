"""Isolated business logic for the Diagnostics lifecycle, decoupled from
views/admin/webhooks/management commands so there's exactly one place each
of these behaviors is implemented, per this codebase's existing convention
(see scoring.py for the same pattern applied to result computation)."""
from django.contrib.auth import get_user_model

from .i18n import resolve_locale
from .models import AdminFeedback, Diagnostics, FeedbackRequest, TestSubmission

STATUS_TESTS_IN_PROGRESS = "tests_in_progress"
STATUS_AWAITING_FEEDBACK_REQUEST = "awaiting_feedback_request"
STATUS_AWAITING_ADMIN_REVIEW = "awaiting_admin_review"
STATUS_COMPLETED = "completed"


def diagnostics_status(diagnostics: Diagnostics) -> str:
    journey_test_ids = [step.test_id for step in diagnostics.journey.steps.all()]
    completed_test_ids = set(
        TestSubmission.objects.filter(
            diagnostics=diagnostics, test_id__in=journey_test_ids
        ).values_list("test_id", flat=True)
    )
    if set(journey_test_ids) - completed_test_ids:
        return STATUS_TESTS_IN_PROGRESS

    feedback_request = FeedbackRequest.objects.filter(diagnostics=diagnostics).first()
    if not feedback_request:
        return STATUS_AWAITING_FEEDBACK_REQUEST

    feedback = AdminFeedback.objects.filter(feedback_request=feedback_request).first()
    if feedback and feedback.is_published:
        return STATUS_COMPLETED
    return STATUS_AWAITING_ADMIN_REVIEW


def current_diagnostics(user) -> Diagnostics | None:
    """The diagnostics new activity (submissions, feedback requests) attaches
    to: the latest one opened for this user. No separate "active" flag —
    matches the rest of this codebase's "retake via insert, current via
    latest query" pattern, one level up."""
    if not user or not user.is_authenticated:
        return None
    return Diagnostics.objects.filter(user=user).order_by("-opened_at").first()


def open_diagnostics(
    *,
    email: str,
    journey,
    source_order_id: str | None = None,
    source_order_number: str = "",
    source_product_id: str = "",
    opened_via: str = Diagnostics.OPENED_VIA_ADMIN,
    raw_payload: dict | None = None,
) -> Diagnostics:
    """Single entry point for "a diagnostics gets opened" — called by the
    SimpleShop webhook, the admin action, and the management command alike.
    Idempotent on source_order_id: a repeat webhook call for the same order
    finds the existing row instead of creating a duplicate."""
    if source_order_id:
        diagnostics, _ = Diagnostics.objects.get_or_create(
            source_order_id=source_order_id,
            defaults={
                "email": email,
                "journey": journey,
                "source_order_number": source_order_number,
                "source_product_id": source_product_id,
                "opened_via": opened_via,
                "raw_payload": raw_payload or {},
                "user": get_user_model().objects.filter(email__iexact=email).first(),
            },
        )
        return diagnostics

    return Diagnostics.objects.create(
        email=email,
        journey=journey,
        source_order_number=source_order_number,
        source_product_id=source_product_id,
        opened_via=opened_via,
        raw_payload=raw_payload or {},
        user=get_user_model().objects.filter(email__iexact=email).first(),
    )


def link_unlinked_diagnostics(user) -> None:
    """Self-healing backfill for "purchase happened before the buyer ever
    logged in": called once per request from AzureEasyAuthMiddleware right
    after a User is resolved. A single indexed UPDATE, not a per-query OR-by
    -email fallback scattered across the codebase."""
    if not user or not user.email:
        return
    Diagnostics.objects.filter(user__isnull=True, email__iexact=user.email).update(user=user)


def diagnostics_step_statuses(diagnostics: Diagnostics, lang: str) -> tuple[list[dict], bool]:
    """Shared by JourneyView (for "current") and DiagnosticsDetailView (for
    any past diagnostics) so the step-status derivation lives in one place."""
    journey = diagnostics.journey
    steps = list(journey.steps.select_related("test"))
    completed_test_ids = set(
        TestSubmission.objects.filter(
            diagnostics=diagnostics, test_id__in=[s.test_id for s in steps]
        ).values_list("test_id", flat=True)
    )

    result = []
    current_assigned = False
    for step in steps:
        completed = step.test_id in completed_test_ids
        if completed:
            step_status = "completed"
        elif not current_assigned:
            step_status = "current"
            current_assigned = True
        else:
            step_status = "upcoming"
        result.append(
            {
                "order": step.order,
                "test_slug": step.test.slug,
                "test_type": step.test.test_type,
                "title": resolve_locale(step.test.title, lang),
                "status": step_status,
            }
        )

    all_tests_done = not current_assigned
    return result, all_tests_done


def has_any_diagnostics(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    return Diagnostics.objects.filter(user=user).exists()
