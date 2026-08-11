import io

from django.db import transaction
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .i18n import get_lang
from .models import (
    AdminFeedback,
    Answer,
    Diagnostics,
    FeedbackRequest,
    FileBlob,
    Test,
    TestSubmission,
)
from .scoring import compute_result
from .serializers import (
    AdminFeedbackReadSerializer,
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
)
from .services import STATUS_COMPLETED


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


class TestSubmitView(APIView):
    @extend_schema(request=TestSubmissionInputSerializer, responses=TestSubmissionReadSerializer)
    def post(self, request, slug):
        test = _latest_active_test(slug)
        if test is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        diagnostics = current_diagnostics(request.user)
        if diagnostics is None:
            return Response({"detail": "No open diagnostics."}, status=status.HTTP_403_FORBIDDEN)
        if diagnostics_status(diagnostics) == STATUS_COMPLETED:
            return Response(
                {"detail": "This diagnostics is already completed."}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = TestSubmissionInputSerializer(data=request.data, context={"test": test})
        serializer.is_valid(raise_exception=True)

        questions = {q.id: q for q in test.questions.all()}

        with transaction.atomic():
            submission = TestSubmission.objects.create(
                test=test, user=request.user, diagnostics=diagnostics
            )
            Answer.objects.bulk_create(
                [
                    Answer(
                        submission=submission,
                        question=questions[answer["question_id"]],
                        selected_option_id=answer.get("option_id"),
                        text_value=answer.get("text_value", ""),
                        comment=answer.get("comment", ""),
                    )
                    for answer in serializer.validated_data["answers"]
                ]
            )

            answers = list(
                submission.answers.select_related("question__category", "selected_option")
            )
            submission.computed_result = compute_result(test, answers)
            submission.save(update_fields=["computed_result"])

        read_serializer = TestSubmissionReadSerializer(submission, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class SubmissionListView(APIView):
    @extend_schema(responses=TestSubmissionReadSerializer(many=True))
    def get(self, request):
        submissions = TestSubmission.objects.filter(user=request.user).select_related("test")
        serializer = TestSubmissionReadSerializer(submissions, many=True, context={"request": request})
        return Response(serializer.data)


class SubmissionDetailView(APIView):
    @extend_schema(responses=TestSubmissionReadSerializer)
    def get(self, request, pk):
        submission = get_object_or_404(TestSubmission, pk=pk, user=request.user)
        serializer = TestSubmissionReadSerializer(submission, context={"request": request})
        return Response(serializer.data)


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
            }
            for d in diagnostics_qs
        ]
        return Response(DiagnosticsSummarySerializer(data, many=True).data)


class DiagnosticsDetailView(APIView):
    @extend_schema(responses=DiagnosticsDetailSerializer)
    def get(self, request, pk):
        diagnostics = get_object_or_404(Diagnostics, pk=pk, user=request.user)
        lang = get_lang(request)
        steps, all_tests_done = diagnostics_step_statuses(diagnostics, lang)

        submissions = TestSubmission.objects.filter(diagnostics=diagnostics).select_related("test")
        feedback_request = FeedbackRequest.objects.filter(diagnostics=diagnostics).first()
        feedback = (
            AdminFeedback.objects.filter(feedback_request=feedback_request, is_published=True).first()
            if feedback_request
            else None
        )

        data = {
            "id": diagnostics.id,
            "journey_slug": diagnostics.journey.slug,
            "opened_at": diagnostics.opened_at,
            "status": diagnostics_status(diagnostics),
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
        return Response(DiagnosticsDetailSerializer(data).data)


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
