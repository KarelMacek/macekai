import io

from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .i18n import get_lang
from .models import (
    AdminFeedback,
    Diagnostics,
    FeedbackRequest,
    FileBlob,
    Test,
    TestSubmission,
    UserConsent,
)
from .serializers import (
    AdminDiagnosticsSummarySerializer,
    AdminFeedbackReadSerializer,
    AdminFeedbackWriteSerializer,
    ConsentSerializer,
    DiagnosticsDetailSerializer,
    DiagnosticsSummarySerializer,
    FeedbackRequestSerializer,
    JourneyStatusSerializer,
    TestDetailSerializer,
    TestSubmissionInputSerializer,
    TestSubmissionReadSerializer,
)
from .services import (
    current_diagnostics,
    diagnostics_status,
    diagnostics_step_statuses,
    finalize_draft,
    get_or_create_draft,
    upsert_draft_answers,
)
from .services import STATUS_COMPLETED


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

        serializer = AdminFeedbackWriteSerializer(instance=instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        feedback = serializer.save(feedback_request=feedback_request)

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
