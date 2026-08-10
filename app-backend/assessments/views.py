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

from .i18n import get_lang, resolve_locale
from .models import (
    AdminFeedback,
    Answer,
    FeedbackRequest,
    FileBlob,
    Journey,
    Test,
    TestSubmission,
)
from .scoring import compute_result
from .serializers import (
    AdminFeedbackReadSerializer,
    FeedbackRequestSerializer,
    JourneyStatusSerializer,
    TestDetailSerializer,
    TestSubmissionInputSerializer,
    TestSubmissionReadSerializer,
)


def _active_journey():
    return Journey.objects.filter(is_active=True).prefetch_related("steps__test").first()


def _latest_active_test(slug):
    return Test.objects.filter(slug=slug, is_active=True).order_by("-version").first()


class JourneyView(APIView):
    @extend_schema(responses=JourneyStatusSerializer)
    def get(self, request):
        journey = _active_journey()
        if not journey:
            return Response({"journey_slug": None, "steps": [], "all_tests_done": False})

        lang = get_lang(request)
        journey_test_ids = [step.test_id for step in journey.steps.all()]
        completed_test_ids = set(
            TestSubmission.objects.filter(
                user=request.user, test_id__in=journey_test_ids
            ).values_list("test_id", flat=True)
        )

        steps = []
        current_assigned = False
        for step in journey.steps.all():
            completed = step.test_id in completed_test_ids
            if completed:
                step_status = "completed"
            elif not current_assigned:
                step_status = "current"
                current_assigned = True
            else:
                step_status = "upcoming"
            steps.append(
                {
                    "order": step.order,
                    "test_slug": step.test.slug,
                    "test_type": step.test.test_type,
                    "title": resolve_locale(step.test.title, lang),
                    "status": step_status,
                }
            )

        all_tests_done = not current_assigned
        feedback_request_submitted = (
            all_tests_done
            and FeedbackRequest.objects.filter(user=request.user, journey=journey).exists()
        )

        return Response(
            {
                "journey_slug": journey.slug,
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

        serializer = TestSubmissionInputSerializer(data=request.data, context={"test": test})
        serializer.is_valid(raise_exception=True)

        questions = {q.id: q for q in test.questions.all()}

        with transaction.atomic():
            submission = TestSubmission.objects.create(test=test, user=request.user)
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
        journey = _active_journey()
        feedback_request = (
            FeedbackRequest.objects.filter(user=request.user, journey=journey).first()
            if journey
            else None
        )
        if not feedback_request:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(FeedbackRequestSerializer(feedback_request, context={"request": request}).data)

    @extend_schema(request=FeedbackRequestSerializer, responses=FeedbackRequestSerializer)
    def post(self, request):
        journey = _active_journey()
        if not journey:
            return Response({"detail": "No active journey."}, status=status.HTTP_400_BAD_REQUEST)

        instance = FeedbackRequest.objects.filter(user=request.user, journey=journey).first()
        serializer = FeedbackRequestSerializer(
            instance=instance, data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, journey=journey)
        response_status = status.HTTP_200_OK if instance else status.HTTP_201_CREATED
        return Response(serializer.data, status=response_status)


class FeedbackView(APIView):
    @extend_schema(responses=AdminFeedbackReadSerializer)
    def get(self, request):
        journey = _active_journey()
        feedback_request = (
            FeedbackRequest.objects.filter(user=request.user, journey=journey).first()
            if journey
            else None
        )
        feedback = (
            AdminFeedback.objects.filter(feedback_request=feedback_request, is_published=True).first()
            if feedback_request
            else None
        )
        if not feedback:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(AdminFeedbackReadSerializer(feedback, context={"request": request}).data)


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
        if FeedbackRequest.objects.filter(user=request.user, cv_file=blob.name).exists():
            return True
        if AdminFeedback.objects.filter(
            feedback_request__user=request.user, document=blob.name, is_published=True
        ).exists():
            return True
        return False
