"""Isolated business logic for the Diagnostics lifecycle, decoupled from
views/admin/webhooks/management commands so there's exactly one place each
of these behaviors is implemented, per this codebase's existing convention
(see scoring.py for the same pattern applied to result computation)."""
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from .i18n import resolve_locale
from .models import AdminFeedback, Answer, Diagnostics, FeedbackRequest, TestSubmission, UserConsent

STATUS_TESTS_IN_PROGRESS = "tests_in_progress"
STATUS_AWAITING_FEEDBACK_REQUEST = "awaiting_feedback_request"
STATUS_AWAITING_ADMIN_REVIEW = "awaiting_admin_review"
STATUS_COMPLETED = "completed"


def diagnostics_status(diagnostics: Diagnostics) -> str:
    journey_test_ids = [step.test_id for step in diagnostics.journey.steps.all()]
    completed_test_ids = set(
        TestSubmission.objects.filter(
            diagnostics=diagnostics,
            test_id__in=journey_test_ids,
            status=TestSubmission.STATUS_SUBMITTED,
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
    language: str = "",
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
                "language": language,
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
        language=language,
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
            diagnostics=diagnostics,
            test_id__in=[s.test_id for s in steps],
            status=TestSubmission.STATUS_SUBMITTED,
        ).values_list("test_id", flat=True)
    )
    draft_test_ids = set(
        TestSubmission.objects.filter(
            diagnostics=diagnostics,
            test_id__in=[s.test_id for s in steps],
            status=TestSubmission.STATUS_DRAFT,
        ).values_list("test_id", flat=True)
    )

    result = []
    current_assigned = False
    for step in steps:
        completed = step.test_id in completed_test_ids
        if completed:
            step_status = "completed"
        elif not current_assigned:
            step_status = "in_progress" if step.test_id in draft_test_ids else "current"
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


def has_recorded_consent(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    return UserConsent.objects.filter(user=user).exists()


def get_or_create_draft(*, test, diagnostics, user) -> TestSubmission:
    """The single primitive behind both "resume where I left off" and "edit
    a submitted test": get the live draft for (user, test, diagnostics) if
    one exists, otherwise create one — seeded from the latest *submitted*
    attempt's answers if there is one, so re-opening a completed test for
    editing starts pre-filled rather than blank. A fresh first-time attempt
    has nothing to seed from and simply starts empty."""
    draft = TestSubmission.objects.filter(
        test=test, diagnostics=diagnostics, user=user, status=TestSubmission.STATUS_DRAFT
    ).first()
    if draft:
        return draft

    latest_submitted = (
        TestSubmission.objects.filter(
            test=test, diagnostics=diagnostics, user=user, status=TestSubmission.STATUS_SUBMITTED
        )
        .order_by("-submitted_at")
        .first()
    )

    with transaction.atomic():
        draft = TestSubmission.objects.create(
            test=test, diagnostics=diagnostics, user=user, status=TestSubmission.STATUS_DRAFT
        )
        if latest_submitted:
            Answer.objects.bulk_create(
                [
                    Answer(
                        submission=draft,
                        question_id=answer.question_id,
                        selected_option_id=answer.selected_option_id,
                        text_value=answer.text_value,
                        comment=answer.comment,
                    )
                    for answer in latest_submitted.answers.all()
                ]
            )
    return draft


def upsert_draft_answers(draft: TestSubmission, answers: list[dict]) -> None:
    """Saves each answer immediately as it arrives (autosave) — update_or_
    create per answer is fine at this scale (at most 60 questions per test)."""
    for answer in answers:
        Answer.objects.update_or_create(
            submission=draft,
            question_id=answer["question_id"],
            defaults={
                "selected_option_id": answer.get("option_id"),
                "text_value": answer.get("text_value", ""),
                "comment": answer.get("comment", ""),
            },
        )


def finalize_draft(draft: TestSubmission, test) -> TestSubmission:
    """Flips a draft to submitted and freezes computed_result — the one
    moment scoring runs, exactly as a one-shot submit always worked."""
    from .scoring import compute_result

    answers = list(draft.answers.select_related("question__category", "selected_option"))
    draft.status = TestSubmission.STATUS_SUBMITTED
    draft.submitted_at = timezone.now()
    draft.computed_result = compute_result(test, answers)
    draft.save(update_fields=["status", "submitted_at", "computed_result"])
    return draft
