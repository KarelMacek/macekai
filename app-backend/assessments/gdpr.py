"""Isolated "everything belonging to one identity" logic — the single
traversal shared by the admin GDPR-erasure action/command (which destroys
the graph, see delete_identity) and the self-service export endpoint/
command (which serializes it, see export_identity). See resolve_identity
for why this can't just be "everything FK'd to a User row": Diagnostics is
keyed by email and can exist before the buyer ever logs in."""

import base64
from dataclasses import dataclass

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q, QuerySet
from django.utils import timezone

from .models import AdminFeedback, Diagnostics, FeedbackRequest, FileBlob, TestSubmission, UserConsent

User = get_user_model()


@dataclass
class IdentityGraph:
    user: object | None
    email: str
    diagnostics: QuerySet
    consent: object | None
    file_blob_names: frozenset
    orphan_blobs: QuerySet


def resolve_identity(*, user=None, email: str = "") -> IdentityGraph:
    """Diagnostics matched by user OR email (case-insensitive), deduped —
    covers both a linked account and a purchase that hasn't been logged
    into yet. file_blob_names/orphan_blobs are captured eagerly here,
    before any caller deletes anything, since cv_file/document are string
    keys into FileBlob.name (not real FKs) and FileBlob.uploaded_by is
    SET_NULL — both associations would be lost if captured after a
    cascade or after the user row is gone."""
    if user is None and not email:
        raise ValueError("resolve_identity requires user and/or email.")
    if user is not None and not email:
        email = user.email

    diag_filter = Q(email__iexact=email)
    if user is not None:
        diag_filter |= Q(user=user)
    diagnostics = Diagnostics.objects.filter(diag_filter).distinct()

    feedback_requests = FeedbackRequest.objects.filter(diagnostics__in=diagnostics)
    admin_feedback = AdminFeedback.objects.filter(feedback_request__in=feedback_requests)

    file_blob_names = frozenset(
        list(feedback_requests.exclude(cv_file="").values_list("cv_file", flat=True))
        + list(admin_feedback.exclude(document="").values_list("document", flat=True))
    )

    return IdentityGraph(
        user=user,
        email=email,
        diagnostics=diagnostics,
        consent=UserConsent.objects.filter(user=user).first() if user else None,
        file_blob_names=file_blob_names,
        orphan_blobs=FileBlob.objects.filter(uploaded_by=user) if user else FileBlob.objects.none(),
    )


def summarize_identity(graph: IdentityGraph) -> dict:
    """Counts for the admin confirmation page and CLI output. Must be
    computed before delete_identity() destroys anything it describes."""
    return {
        "user": graph.user,
        "email": graph.email,
        "is_staff": bool(graph.user and graph.user.is_staff),
        "diagnostics_count": graph.diagnostics.count(),
        "submissions_count": TestSubmission.objects.filter(diagnostics__in=graph.diagnostics).count(),
        "feedback_requests_count": FeedbackRequest.objects.filter(diagnostics__in=graph.diagnostics).count(),
        "file_count": len(graph.file_blob_names) + graph.orphan_blobs.count(),
        "has_consent": graph.consent is not None,
    }


@transaction.atomic
def delete_identity(*, user=None, email: str = "") -> dict:
    """Destroys everything belonging to this identity. Idempotent — safe to
    call repeatedly on an already-clean user/email (returns zero counts,
    never raises for "nothing found"), which matters for the test-cleanup
    use case where a tester may run this between every diagnostics purchase."""
    graph = resolve_identity(user=user, email=email)
    summary = summarize_identity(graph)

    # Blobs first: both the name-keyed (cv_file/document) and uploaded_by-
    # keyed associations must be gone before their referencing rows/user
    # row disappear, or the association is unrecoverable (SET_NULL/string key).
    FileBlob.objects.filter(Q(name__in=graph.file_blob_names) | Q(uploaded_by=graph.user)).delete()

    # Cascades to TestSubmission -> Answer and FeedbackRequest -> AdminFeedback.
    graph.diagnostics.delete()

    if graph.user is not None:
        # Cascades UserConsent + any TestSubmission still FK'd directly to
        # the user (there shouldn't be any left — every TestSubmission also
        # has a non-nullable diagnostics FK, already swept above).
        graph.user.delete()

    return summary


def export_identity(*, user=None, email: str = "") -> dict:
    """Full JSON-able export payload for this identity. user=request.user
    for the self-service endpoint; email (with or without a matching user)
    for the admin-assisted CLI export."""
    graph = resolve_identity(user=user, email=email)
    diagnostics_qs = graph.diagnostics.select_related("journey").order_by("-opened_at")

    profile = None
    if graph.user is not None:
        u = graph.user
        profile = {
            "email": u.email,
            "username": u.username,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "date_joined": u.date_joined.isoformat() if u.date_joined else None,
            "last_login": u.last_login.isoformat() if u.last_login else None,
        }

    return {
        "exported_at": timezone.now().isoformat(),
        "email": graph.email,
        "profile": profile,
        "consent": _export_consent(graph.consent),
        "diagnostics": [_export_diagnostics(d) for d in diagnostics_qs],
    }


def _export_consent(consent):
    if not consent:
        return None
    return {
        "ai_processing_consent": consent.ai_processing_consent,
        "research_consent": consent.research_consent,
        "recorded_at": consent.recorded_at.isoformat(),
    }


def _export_diagnostics(diagnostics) -> dict:
    # ALL statuses, not just submitted — a draft is still real personal
    # data. views.py's _build_diagnostics_detail excludes drafts, but that's
    # a product-UI choice ("what's worth showing"), not a completeness
    # guarantee, so it isn't reused here.
    submissions = (
        TestSubmission.objects.filter(diagnostics=diagnostics)
        .select_related("test")
        .prefetch_related("answers__question", "answers__selected_option")
        .order_by("-created_at")
    )
    feedback_request = FeedbackRequest.objects.filter(diagnostics=diagnostics).first()
    feedback = (
        AdminFeedback.objects.filter(feedback_request=feedback_request).first()
        if feedback_request
        else None
    )
    return {
        "id": diagnostics.id,
        "email": diagnostics.email,
        "journey_slug": diagnostics.journey.slug,
        "opened_via": diagnostics.opened_via,
        "opened_at": diagnostics.opened_at.isoformat(),
        "language": diagnostics.language,
        "notes": diagnostics.notes,
        "source_order_id": diagnostics.source_order_id,
        "source_order_number": diagnostics.source_order_number,
        "raw_payload": diagnostics.raw_payload,
        "submissions": [_export_submission(s) for s in submissions],
        "feedback_request": _export_feedback_request(feedback_request) if feedback_request else None,
        "feedback": _export_admin_feedback(feedback) if feedback else None,
    }


def _export_submission(s) -> dict:
    return {
        "id": s.id,
        "test_slug": s.test.slug,
        "test_type": s.test.test_type,
        "status": s.status,
        "created_at": s.created_at.isoformat(),
        "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
        "computed_result": s.computed_result,
        "answers": [
            {
                "question_id": a.question_id,
                "selected_option_id": a.selected_option_id,
                "text_value": a.text_value,
                "comment": a.comment,
            }
            for a in s.answers.all()
        ],
    }


def _export_feedback_request(fr) -> dict:
    return {
        "id": fr.id,
        "linkedin_url": fr.linkedin_url,
        "requested_at": fr.requested_at.isoformat(),
        "cv_file": _embed_file(fr.cv_file.name if fr.cv_file else ""),
    }


def _export_admin_feedback(f) -> dict:
    return {
        # Included regardless of is_published — this is the person's own
        # data, unlike the customer-facing FeedbackView which only shows
        # published feedback.
        "video_url": f.video_url,
        "notes": f.notes,
        "is_published": f.is_published,
        "published_at": f.published_at.isoformat() if f.published_at else None,
        "created_at": f.created_at.isoformat(),
        "document": _embed_file(f.document.name if f.document else ""),
    }


def _embed_file(name: str):
    if not name:
        return None
    blob = FileBlob.objects.filter(name=name).first()
    if not blob:
        return None
    return {
        "filename": blob.original_filename or blob.name,
        "content_type": blob.content_type,
        "size": blob.size,
        "base64": base64.b64encode(bytes(blob.data)).decode("ascii"),
    }
