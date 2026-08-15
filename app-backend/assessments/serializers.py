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
    """Validates one batch of answers against the test being submitted:
    each question_id must belong to the test, no duplicates within this
    request, and each answer must be shaped correctly for its
    question_type. Does NOT require every question in the test to be
    present — a request may be a partial autosave batch. Completeness (all
    questions answered) is a DB-truth check the view makes separately
    against the full persisted draft, since that has to account for
    answers saved by earlier requests too, not just this one."""

    answers = AnswerInputSerializer(many=True)

    def validate(self, data):
        test = self.context["test"]
        questions = {q.id: q for q in test.questions.all()}
        submitted_ids = [a["question_id"] for a in data["answers"]]

        if len(submitted_ids) != len(set(submitted_ids)):
            raise serializers.ValidationError("Duplicate question_id in answers.")
        if not set(submitted_ids) <= set(questions):
            raise serializers.ValidationError("One or more question_id values don't belong to this test.")

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


class AnswerReadSerializer(LocaleResolvingMixin, serializers.ModelSerializer):
    question_text = serializers.SerializerMethodField()
    selected_option_label = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = [
            "question_id",
            "question_text",
            "selected_option_id",
            "selected_option_label",
            "text_value",
            "comment",
        ]

    def get_question_text(self, obj) -> str:
        return resolve_locale(obj.question.text, self.get_lang())

    def get_selected_option_label(self, obj) -> str | None:
        return resolve_locale(obj.selected_option.label, self.get_lang()) if obj.selected_option_id else None


class TestSubmissionReadSerializer(serializers.ModelSerializer):
    answers = serializers.SerializerMethodField()
    test_slug = serializers.CharField(source="test.slug", read_only=True)
    test_type = serializers.CharField(source="test.test_type", read_only=True)

    class Meta:
        model = TestSubmission
        fields = ["id", "test_slug", "test_type", "status", "submitted_at", "computed_result", "answers"]

    def get_answers(self, obj):
        # Ordered to match the test's question order rather than insertion
        # order, so the UI can list them straight through without a lookup.
        answers = obj.answers.select_related("question", "selected_option").order_by("question__order")
        return AnswerReadSerializer(answers, many=True, context=self.context).data


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
    status = serializers.ChoiceField(choices=["completed", "current", "in_progress", "upcoming"])


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
    email = serializers.CharField()
    journey_slug = serializers.CharField()
    opened_at = serializers.DateTimeField()
    status = serializers.CharField()
    all_tests_done = serializers.BooleanField()
    steps = JourneyStepStatusSerializer(many=True)
    submissions = TestSubmissionReadSerializer(many=True)
    feedback_request = FeedbackRequestSerializer(allow_null=True)
    feedback = AdminFeedbackReadSerializer(allow_null=True)


class AdminDiagnosticsSummarySerializer(DiagnosticsSummarySerializer):
    """Same shape as the customer-facing summary, plus who it belongs to —
    admin is browsing everyone's, not just their own."""

    email = serializers.CharField()


class AdminFeedbackWriteSerializer(serializers.ModelSerializer):
    """Used by the admin console to create-or-update the AdminFeedback for a
    FeedbackRequest. document is optional per-request (omit to leave the
    existing one in place when just editing notes/video_url/publishing)."""

    class Meta:
        model = AdminFeedback
        fields = ["document", "video_url", "notes", "is_published"]
