import io
import logging

from django.contrib.auth import get_user_model
from django.http import FileResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .emailing import send_feedback_published_email
from .gdpr import delete_identity, export_identity, resolve_identity, summarize_identity
from .i18n import get_lang, resolve_locale
from .models import (
    AdminFeedback,
    Diagnostics,
    FeedbackRequest,
    FileBlob,
    Journey,
    Test,
    TestSubmission,
    UserConsent,
)
from .serializers import (
    AdminDiagnosticsStatsSerializer,
    AdminDiagnosticsSummarySerializer,
    AdminFeedbackReadSerializer,
    AdminFeedbackWriteSerializer,
    AdminGrantAccessResultSerializer,
    AdminJourneySummarySerializer,
    AdminUserSummarySerializer,
    ConsentSerializer,
    DiagnosticsDetailSerializer,
    DiagnosticsSummarySerializer,
    FeedbackRequestSerializer,
    JourneyStatusSerializer,
    MyDataExportSerializer,
    TestDetailSerializer,
    TestSubmissionInputSerializer,
    TestSubmissionReadSerializer,
)
from .services import (
    current_diagnostics,
    diagnostics_funnel_counts,
    diagnostics_status,
    diagnostics_step_statuses,
    finalize_draft,
    get_or_create_draft,
    grant_diagnostics_access,
    upsert_draft_answers,
)
from .services import STATUS_COMPLETED

logger = logging.getLogger(__name__)


def _build_diagnostics_detail(diagnostics, request, *, include_unpublished_feedback=False):
    """Shared by the customer-facing DiagnosticsDetailView and the admin
    console's equivalent — same assembly, the only difference is whether a
    draft (unpublished) AdminFeedback is included."""
    lang = get_lang(request)
    steps, all_tests_done = diagnostics_step_statuses(diagnostics, lang)

    submissions = TestSubmission.objects.filter(
        diagnostics=diagnostics, status=TestSubmission.STATUS_SUBMITTED
    ).select_related("test")
    feedback_request = FeedbackRequest.objects.filter(diagnostics=diagnostics).first()
    feedback_qs = (
        AdminFeedback.objects.filter(feedback_request=feedback_request)
        if feedback_request
        else AdminFeedback.objects.none()
    )
    if not include_unpublished_feedback:
        feedback_qs = feedback_qs.filter(is_published=True)
    feedback = feedback_qs.first()

    return {
        "id": diagnostics.id,
        "email": diagnostics.email,
        "journey_slug": diagnostics.journey.slug,
        "opened_at": diagnostics.opened_at,
        "status": diagnostics_status(diagnostics),
        "language": diagnostics.language,
        "all_tests_done": all_tests_done,
        "steps": steps,
        "submissions": TestSubmissionReadSerializer(
            submissions, many=True, context={"request": request}
        ).data,
        "feedback_request": (
            FeedbackRequestSerializer(feedback_request, context={"request": request}).data
            if feedback_request
            else None
        ),
        "feedback": (
            AdminFeedbackReadSerializer(feedback, context={"request": request}).data
            if feedback
            else None
        ),
    }


def _latest_active_test(slug):
    return Test.objects.filter(slug=slug, is_active=True).order_by("-version").first()


class JourneyView(APIView):
    @extend_schema(responses=JourneyStatusSerializer)
    def get(self, request):
        diagnostics = current_diagnostics(request.user)
        if not diagnostics:
            return Response(
                {"journey_slug": None, "diagnostics_id": None, "steps": [], "all_tests_done": False}
            )

        lang = get_lang(request)
        steps, all_tests_done = diagnostics_step_statuses(diagnostics, lang)
        feedback_request_submitted = (
            all_tests_done and FeedbackRequest.objects.filter(diagnostics=diagnostics).exists()
        )

        return Response(
            {
                "journey_slug": diagnostics.journey.slug,
                "diagnostics_id": diagnostics.id,
                "steps": steps,
                "all_tests_done": all_tests_done,
                "feedback_request_submitted": feedback_request_submitted,
            }
        )


class TestDetailView(APIView):
    @extend_schema(responses=TestDetailSerializer)
    def get(self, request, slug):
        test = _latest_active_test(slug)
        if test is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = TestDetailSerializer(test, context={"request": request})
        return Response(serializer.data)


def _guard_open_diagnostics(request):
    """Shared by TestSubmitView and TestDraftView: both need an open,
    not-yet-completed diagnostics before touching any answers. Returns
    (diagnostics, error_response) — error_response is None on success."""
    diagnostics = current_diagnostics(request.user)
    if diagnostics is None:
        return None, Response({"detail": "No open diagnostics."}, status=status.HTTP_403_FORBIDDEN)
    if diagnostics_status(diagnostics) == STATUS_COMPLETED:
        return None, Response(
            {"detail": "This diagnostics is already completed."}, status=status.HTTP_403_FORBIDDEN
        )
    return diagnostics, None


class TestDraftView(APIView):
    """GET fetches (and lazily creates/seeds) the current in-progress
    attempt — the same primitive used for both "resume where I left off"
    and "edit a submitted test" (seeded from the latest submitted one).
    PATCH autosaves one or more answers into it. Neither ever freezes
    computed_result or flips status to submitted — that only happens via
    TestSubmitView.post, once every question is answered."""

    @extend_schema(responses=TestSubmissionReadSerializer)
    def get(self, request, slug):
        test = _latest_active_test(slug)
        if test is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        diagnostics, error = _guard_open_diagnostics(request)
        if error:
            return error

        draft = get_or_create_draft(test=test, diagnostics=diagnostics, user=request.user)
        return Response(TestSubmissionReadSerializer(draft, context={"request": request}).data)

    @extend_schema(request=TestSubmissionInputSerializer, responses=TestSubmissionReadSerializer)
    def patch(self, request, slug):
        test = _latest_active_test(slug)
        if test is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        diagnostics, error = _guard_open_diagnostics(request)
        if error:
            return error

        serializer = TestSubmissionInputSerializer(data=request.data, context={"test": test})
        serializer.is_valid(raise_exception=True)

        draft = get_or_create_draft(test=test, diagnostics=diagnostics, user=request.user)
        upsert_draft_answers(draft, serializer.validated_data["answers"])

        return Response(TestSubmissionReadSerializer(draft, context={"request": request}).data)


class TestSubmitView(APIView):
    @extend_schema(request=TestSubmissionInputSerializer, responses=TestSubmissionReadSerializer)
    def post(self, request, slug):
        test = _latest_active_test(slug)
        if test is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        diagnostics, error = _guard_open_diagnostics(request)
        if error:
            return error

        serializer = TestSubmissionInputSerializer(data=request.data, context={"test": test})
        serializer.is_valid(raise_exception=True)

        draft = get_or_create_draft(test=test, diagnostics=diagnostics, user=request.user)
        upsert_draft_answers(draft, serializer.validated_data["answers"])

        answered_ids = set(draft.answers.values_list("question_id", flat=True))
        all_ids = set(test.questions.values_list("id", flat=True))
        if answered_ids != all_ids:
            return Response(
                {
                    "detail": "Must answer every question before submitting.",
                    "missing_question_ids": sorted(all_ids - answered_ids),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission = finalize_draft(draft, test)
        read_serializer = TestSubmissionReadSerializer(submission, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class SubmissionListView(APIView):
    @extend_schema(responses=TestSubmissionReadSerializer(many=True))
    def get(self, request):
        submissions = TestSubmission.objects.filter(
            user=request.user, status=TestSubmission.STATUS_SUBMITTED
        ).select_related("test")
        serializer = TestSubmissionReadSerializer(submissions, many=True, context={"request": request})
        return Response(serializer.data)


class SubmissionDetailView(APIView):
    @extend_schema(responses=TestSubmissionReadSerializer)
    def get(self, request, pk):
        submission = get_object_or_404(TestSubmission, pk=pk, user=request.user)
        serializer = TestSubmissionReadSerializer(submission, context={"request": request})
        return Response(serializer.data)


class ConsentView(APIView):
    """One-time write: records the account-level AI-processing/research
    consent answers asked by ConsentGate on the frontend before a user ever
    reaches the dashboard. Both booleans are required and written together —
    see UserConsent's docstring for why there's no PATCH/GET here."""

    @extend_schema(request=ConsentSerializer, responses=ConsentSerializer)
    def post(self, request):
        if UserConsent.objects.filter(user=request.user).exists():
            return Response({"detail": "Consent already recorded."}, status=status.HTTP_409_CONFLICT)
        serializer = ConsentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FeedbackRequestView(APIView):
    @extend_schema(responses=FeedbackRequestSerializer)
    def get(self, request):
        diagnostics = current_diagnostics(request.user)
        feedback_request = (
            FeedbackRequest.objects.filter(diagnostics=diagnostics).first() if diagnostics else None
        )
        if not feedback_request:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(FeedbackRequestSerializer(feedback_request, context={"request": request}).data)

    @extend_schema(request=FeedbackRequestSerializer, responses=FeedbackRequestSerializer)
    def post(self, request):
        diagnostics = current_diagnostics(request.user)
        if diagnostics is None:
            return Response({"detail": "No open diagnostics."}, status=status.HTTP_403_FORBIDDEN)
        if diagnostics_status(diagnostics) == STATUS_COMPLETED:
            return Response(
                {"detail": "This diagnostics is already completed."}, status=status.HTTP_403_FORBIDDEN
            )

        instance = FeedbackRequest.objects.filter(diagnostics=diagnostics).first()
        serializer = FeedbackRequestSerializer(
            instance=instance, data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(diagnostics=diagnostics)
        response_status = status.HTTP_200_OK if instance else status.HTTP_201_CREATED
        return Response(serializer.data, status=response_status)


class FeedbackView(APIView):
    @extend_schema(responses=AdminFeedbackReadSerializer)
    def get(self, request):
        diagnostics = current_diagnostics(request.user)
        feedback_request = (
            FeedbackRequest.objects.filter(diagnostics=diagnostics).first() if diagnostics else None
        )
        feedback = (
            AdminFeedback.objects.filter(feedback_request=feedback_request, is_published=True).first()
            if feedback_request
            else None
        )
        if not feedback:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(AdminFeedbackReadSerializer(feedback, context={"request": request}).data)


class DiagnosticsListView(APIView):
    @extend_schema(responses=DiagnosticsSummarySerializer(many=True))
    def get(self, request):
        diagnostics_qs = Diagnostics.objects.filter(user=request.user).select_related("journey")
        data = [
            {
                "id": d.id,
                "journey_slug": d.journey.slug,
                "opened_at": d.opened_at,
                "status": diagnostics_status(d),
                "language": d.language,
            }
            for d in diagnostics_qs
        ]
        return Response(DiagnosticsSummarySerializer(data, many=True).data)


class DiagnosticsDetailView(APIView):
    @extend_schema(responses=DiagnosticsDetailSerializer)
    def get(self, request, pk):
        diagnostics = get_object_or_404(Diagnostics, pk=pk, user=request.user)
        data = _build_diagnostics_detail(diagnostics, request)
        # data is already fully assembled/serialized by _build_diagnostics_detail
        # (submissions/feedback_request/feedback are pre-rendered dicts) —
        # DiagnosticsDetailSerializer exists only for the @extend_schema type
        # declaration above, not to re-serialize this at runtime (doing so
        # double-serializes the nested dicts and breaks the nested
        # ModelSerializer fields, which expect model instances, not dicts).
        return Response(data)


class AdminDiagnosticsListView(APIView):
    """The admin console's queue — every diagnostics, not just the
    requester's own. permission_classes overrides the default
    IsAuthenticated with IsAdminUser (checks request.user.is_staff, the same
    flag that gates Django admin)."""

    permission_classes = [IsAdminUser]

    @extend_schema(responses=AdminDiagnosticsSummarySerializer(many=True))
    def get(self, request):
        diagnostics_qs = Diagnostics.objects.select_related("journey").order_by("-opened_at")

        status_filter = request.query_params.get("status")
        query = request.query_params.get("q")
        if query:
            diagnostics_qs = diagnostics_qs.filter(email__icontains=query)

        data = []
        for d in diagnostics_qs:
            row_status = diagnostics_status(d)
            if status_filter and row_status != status_filter:
                continue
            data.append(
                {
                    "id": d.id,
                    "email": d.email,
                    "journey_slug": d.journey.slug,
                    "opened_at": d.opened_at,
                    "status": row_status,
                    "language": d.language,
                }
            )
        return Response(AdminDiagnosticsSummarySerializer(data, many=True).data)


class AdminDiagnosticsStatsView(APIView):
    """Funnel summary for the entry-diagnostic pricing decision: paid vs.
    started the questionnaire vs. actually finished. All-time by default;
    ?from=YYYY-MM-DD&to=YYYY-MM-DD narrows the paid cohort by opened_at."""

    permission_classes = [IsAdminUser]

    @extend_schema(responses=AdminDiagnosticsStatsSerializer)
    def get(self, request):
        diagnostics_qs = Diagnostics.objects.all()
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        if date_from:
            diagnostics_qs = diagnostics_qs.filter(opened_at__date__gte=date_from)
        if date_to:
            diagnostics_qs = diagnostics_qs.filter(opened_at__date__lte=date_to)

        return Response(AdminDiagnosticsStatsSerializer(diagnostics_funnel_counts(diagnostics_qs)).data)


class AdminDiagnosticsDetailView(APIView):
    """Same shape as DiagnosticsDetailView, minus the ownership filter and
    including unpublished (draft) feedback so the admin can see/edit what
    they've written before publishing it."""

    permission_classes = [IsAdminUser]

    @extend_schema(responses=DiagnosticsDetailSerializer)
    def get(self, request, pk):
        diagnostics = get_object_or_404(Diagnostics, pk=pk)
        data = _build_diagnostics_detail(diagnostics, request, include_unpublished_feedback=True)
        # data is already fully assembled/serialized by _build_diagnostics_detail
        # (submissions/feedback_request/feedback are pre-rendered dicts) —
        # DiagnosticsDetailSerializer exists only for the @extend_schema type
        # declaration above, not to re-serialize this at runtime (doing so
        # double-serializes the nested dicts and breaks the nested
        # ModelSerializer fields, which expect model instances, not dicts).
        return Response(data)


class AdminFeedbackWriteView(APIView):
    """Create-or-update the AdminFeedback for a given FeedbackRequest.
    document is optional per request — omit it to edit notes/video_url/
    is_published without re-uploading."""

    permission_classes = [IsAdminUser]

    @extend_schema(request=AdminFeedbackWriteSerializer, responses=AdminFeedbackReadSerializer)
    def post(self, request, pk):
        feedback_request = get_object_or_404(FeedbackRequest, pk=pk)
        instance = AdminFeedback.objects.filter(feedback_request=feedback_request).first()
        was_published = instance.is_published if instance else False

        serializer = AdminFeedbackWriteSerializer(instance=instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        feedback = serializer.save(feedback_request=feedback_request)

        if feedback.is_published and not was_published:
            try:
                send_feedback_published_email(feedback_request.diagnostics, feedback)
            except Exception:
                # The AdminFeedback row is the important side effect and it's
                # already saved — don't fail the publish action just because
                # the notification email failed to send.
                logger.exception(
                    "Failed to send feedback published email for feedback_request %s",
                    feedback_request.pk,
                )

        return Response(
            AdminFeedbackReadSerializer(feedback, context={"request": request}).data,
            status=status.HTTP_200_OK if instance else status.HTTP_201_CREATED,
        )


class FileDownloadView(APIView):
    @extend_schema(responses={200: OpenApiTypes.BINARY})
    def get(self, request, blob_id):
        blob = get_object_or_404(FileBlob, pk=blob_id)
        if not self._can_access(request, blob):
            raise PermissionDenied()
        return FileResponse(
            io.BytesIO(bytes(blob.data)),
            content_type=blob.content_type or "application/octet-stream",
            filename=blob.original_filename or blob.name,
        )

    def _can_access(self, request, blob):
        if request.user.is_staff:
            return True
        if FeedbackRequest.objects.filter(diagnostics__user=request.user, cv_file=blob.name).exists():
            return True
        if AdminFeedback.objects.filter(
            feedback_request__diagnostics__user=request.user, document=blob.name, is_published=True
        ).exists():
            return True
        return False


class MyDataExportView(APIView):
    """GDPR self-service export: everything belonging to the logged-in user,
    as a browser-downloadable JSON file. Returns a plain JsonResponse (not a
    DRF Response) so Content-Disposition can be set directly — the same
    escape hatch FileDownloadView above uses for FileResponse."""

    @extend_schema(responses=MyDataExportSerializer)
    def get(self, request):
        payload = export_identity(user=request.user)
        response = JsonResponse(payload, json_dumps_params={"indent": 2, "ensure_ascii": False})
        filename = f"my-data-export-{timezone.now():%Y%m%d}.json"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class AdminUserListView(APIView):
    """The admin console's people list — every registered user, each with
    the same GDPR-graph counts the Django admin confirmation page shows
    (assessments.gdpr.summarize_identity), so "who has how much data" is
    visible before deciding to erase someone. ?q= filters by email/username
    substring."""

    permission_classes = [IsAdminUser]

    @extend_schema(responses=AdminUserSummarySerializer(many=True))
    def get(self, request):
        users = get_user_model().objects.all().order_by("-date_joined")
        query = request.query_params.get("q")
        if query:
            users = users.filter(email__icontains=query)

        data = []
        for u in users:
            summary = summarize_identity(resolve_identity(user=u))
            data.append(
                {
                    "id": u.id,
                    "email": summary["email"],
                    "is_staff": summary["is_staff"],
                    "date_joined": u.date_joined,
                    "diagnostics_count": summary["diagnostics_count"],
                    "submissions_count": summary["submissions_count"],
                    "feedback_requests_count": summary["feedback_requests_count"],
                    "file_count": summary["file_count"],
                    "has_consent": summary["has_consent"],
                }
            )
        return Response(AdminUserSummarySerializer(data, many=True).data)


class AdminEraseIdentityView(APIView):
    """Erases a person's User row (if any) and every related record —
    assessments.gdpr.delete_identity, the same primitive the Django admin
    action and `erase_gdpr_data` management command use. Targeted either by
    user_id (a row from AdminUserListView) or by a bare email (the "no
    account yet" case — a pre-login purchase). typed_email must match the
    resolved email exactly (case-insensitive) or nothing is deleted — the
    same confirm-by-typing requirement as the Django admin action."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        user = None
        user_id = request.data.get("user_id")
        email = (request.data.get("email") or "").strip()
        typed_email = (request.data.get("typed_email") or "").strip()

        if user_id:
            user = get_object_or_404(get_user_model(), pk=user_id)
            email = user.email
        if not email:
            return Response({"detail": "email or user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if typed_email.lower() != email.lower():
            return Response(
                {"detail": "Typed email did not match — nothing was deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        summary = delete_identity(user=user, email=email)
        return Response(
            {
                "email": summary["email"],
                "diagnostics_count": summary["diagnostics_count"],
                "submissions_count": summary["submissions_count"],
                "file_count": summary["file_count"],
            }
        )


class AdminJourneyListView(APIView):
    """Active journeys, for the "grant access" form's picker — same locale
    resolution the customer-facing journey/test copy uses."""

    permission_classes = [IsAdminUser]

    @extend_schema(responses=AdminJourneySummarySerializer(many=True))
    def get(self, request):
        lang = get_lang(request)
        journeys = Journey.objects.filter(is_active=True).order_by("slug")
        data = [{"slug": j.slug, "name": resolve_locale(j.name, lang)} for j in journeys]
        return Response(AdminJourneySummarySerializer(data, many=True).data)


class AdminGrantAccessView(APIView):
    """Manually grants diagnostics access — the "webhook runner": opens a
    diagnostics and sends the real purchase-instructions email, exactly
    like a genuine SimpleShop purchase, without one. See
    services.grant_diagnostics_access. Used for dev/staging testing without
    paying, and for granting an existing prod client access without asking
    them to buy again."""

    permission_classes = [IsAdminUser]

    @extend_schema(responses=AdminGrantAccessResultSerializer)
    def post(self, request):
        email = (request.data.get("email") or "").strip()
        journey_slug = request.data.get("journey_slug")
        language = request.data.get("language", "")
        if not email or not journey_slug:
            return Response(
                {"detail": "email and journey_slug are required."}, status=status.HTTP_400_BAD_REQUEST
            )

        journey = Journey.objects.filter(slug=journey_slug, is_active=True).first()
        if not journey:
            return Response({"detail": "Unknown or inactive journey."}, status=status.HTTP_400_BAD_REQUEST)

        diagnostics = grant_diagnostics_access(email=email, journey=journey, language=language)
        return Response(
            {"diagnostics_id": diagnostics.id, "email": diagnostics.email, "journey_slug": journey.slug},
            status=status.HTTP_201_CREATED,
        )
