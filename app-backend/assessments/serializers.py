from rest_framework import serializers

from .i18n import get_lang, resolve_locale
from .models import (
    AdminFeedback,
    Answer,
    Category,
    FeedbackRequest,
    LikertOption,
    Question,
    ResultThreshold,
    Test,
    TestSubmission,
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_CV_CONTENT_TYPES = {"application/pdf"}


class LocaleResolvingMixin:
    def get_lang(self):
        request = self.context.get("request")
        return get_lang(request) if request is not None else "en"


class LikertOptionSerializer(LocaleResolvingMixin, serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = LikertOption
        fields = ["id", "value", "label", "order"]

    def get_label(self, obj) -> str:
        return resolve_locale(obj.label, self.get_lang())


class QuestionSerializer(LocaleResolvingMixin, serializers.ModelSerializer):
    text = serializers.SerializerMethodField()
    help_text = serializers.SerializerMethodField()
    options = LikertOptionSerializer(many=True, read_only=True)
    category_key = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id",
            "question_type",
            "text",
            "help_text",
            "order",
            "allow_comment",
            "category_key",
            "options",
        ]

    def get_text(self, obj) -> str:
        return resolve_locale(obj.text, self.get_lang())

    def get_help_text(self, obj) -> str:
        return resolve_locale(obj.help_text, self.get_lang())

    def get_category_key(self, obj) -> str | None:
        return obj.category.key if obj.category_id else None


class ResultThresholdSerializer(LocaleResolvingMixin, serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = ResultThreshold
        fields = ["id", "min_score", "max_score", "title", "description"]

    def get_title(self, obj) -> str:
        return resolve_locale(obj.title, self.get_lang())

    def get_description(self, obj) -> str:
        return resolve_locale(obj.description, self.get_lang())


class CategorySerializer(LocaleResolvingMixin, serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    thresholds = ResultThresholdSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "key", "name", "order", "thresholds"]

    def get_name(self, obj) -> str:
        return resolve_locale(obj.name, self.get_lang())


class TestDetailSerializer(LocaleResolvingMixin, serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    instructions = serializers.SerializerMethodField()
    questions = QuestionSerializer(many=True, read_only=True)
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Test
        fields = [
            "id",
            "slug",
            "test_type",
            "version",
            "title",
            "description",
            "instructions",
            "questions",
            "categories",
        ]

    def get_title(self, obj) -> str:
        return resolve_locale(obj.title, self.get_lang())

    def get_description(self, obj) -> str:
        return resolve_locale(obj.description, self.get_lang())

    def get_instructions(self, obj) -> str:
        return resolve_locale(obj.instructions, self.get_lang())


class AnswerInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    option_id = serializers.IntegerField(required=False, allow_null=True)
    text_value = serializers.CharField(required=False, allow_blank=True, default="")
    comment = serializers.CharField(required=False, allow_blank=True, default="")


class TestSubmissionInputSerializer(serializers.Serializer):
    """Validates the whole answer set's shape against the test being
    submitted: exactly one answer per question, each shaped correctly for
    its question_type. The DRF equivalent of a Pydantic
    min_items=max_items=N, unique_items=True constraint."""

    answers = AnswerInputSerializer(many=True)

    def validate(self, data):
        test = self.context["test"]
        questions = {q.id: q for q in test.questions.all()}
        submitted_ids = [a["question_id"] for a in data["answers"]]

        if len(submitted_ids) != len(set(submitted_ids)):
            raise serializers.ValidationError("Duplicate question_id in answers.")
        if set(submitted_ids) != set(questions):
            raise serializers.ValidationError("Must answer every question in this test exactly once.")

        for answer in data["answers"]:
            question = questions[answer["question_id"]]
            if question.question_type == Question.QUESTION_TYPE_LIKERT:
                option_ids = {o.id for o in question.options.all()}
                if answer.get("option_id") not in option_ids:
                    raise serializers.ValidationError(
                        f"Question {question.id} requires a valid option_id."
                    )
            elif question.question_type == Question.QUESTION_TYPE_OPEN_TEXT:
                if not answer.get("text_value", "").strip():
                    raise serializers.ValidationError(
                        f"Question {question.id} requires a non-empty text_value."
                    )
        return data


class AnswerReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ["question_id", "selected_option_id", "text_value", "comment"]


class TestSubmissionReadSerializer(serializers.ModelSerializer):
    answers = AnswerReadSerializer(many=True, read_only=True)
    test_slug = serializers.CharField(source="test.slug", read_only=True)
    test_type = serializers.CharField(source="test.test_type", read_only=True)

    class Meta:
        model = TestSubmission
        fields = ["id", "test_slug", "test_type", "submitted_at", "computed_result", "answers"]


class FeedbackRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackRequest
        fields = ["id", "cv_file", "linkedin_url", "requested_at"]
        read_only_fields = ["id", "requested_at"]

    def validate_cv_file(self, value):
        if value is None:
            return value
        if value.size > MAX_UPLOAD_BYTES:
            raise serializers.ValidationError("File too large (max 10MB).")
        content_type = getattr(value, "content_type", "")
        if content_type and content_type not in ALLOWED_CV_CONTENT_TYPES:
            raise serializers.ValidationError("CV must be a PDF.")
        return value

    def validate(self, data):
        cv_file = data.get("cv_file") or getattr(self.instance, "cv_file", None)
        linkedin_url = data.get("linkedin_url") or getattr(self.instance, "linkedin_url", "")
        if not cv_file and not linkedin_url:
            raise serializers.ValidationError("Provide a CV file and/or a LinkedIn URL.")
        return data


class AdminFeedbackReadSerializer(serializers.ModelSerializer):
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = AdminFeedback
        fields = ["document_url", "video_url", "notes", "published_at"]

    def get_document_url(self, obj) -> str | None:
        return obj.document.url if obj.document else None


class JourneyStepStatusSerializer(serializers.Serializer):
    order = serializers.IntegerField()
    test_slug = serializers.SlugField()
    test_type = serializers.CharField()
    title = serializers.CharField()
    status = serializers.ChoiceField(choices=["completed", "current", "upcoming"])


class JourneyStatusSerializer(serializers.Serializer):
    """Shape of JourneyView's response — fully derived (no model instance
    backs it directly), so this exists purely to give drf-spectacular/the
    generated TS client a concrete response type."""

    journey_slug = serializers.CharField(allow_null=True)
    diagnostics_id = serializers.IntegerField(allow_null=True, required=False)
    steps = JourneyStepStatusSerializer(many=True)
    all_tests_done = serializers.BooleanField()
    feedback_request_submitted = serializers.BooleanField(required=False)


class DiagnosticsSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    journey_slug = serializers.CharField()
    opened_at = serializers.DateTimeField()
    status = serializers.CharField()


class DiagnosticsDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    journey_slug = serializers.CharField()
    opened_at = serializers.DateTimeField()
    status = serializers.CharField()
    all_tests_done = serializers.BooleanField()
    steps = JourneyStepStatusSerializer(many=True)
    submissions = TestSubmissionReadSerializer(many=True)
    feedback_request = FeedbackRequestSerializer(allow_null=True)
    feedback = AdminFeedbackReadSerializer(allow_null=True)
