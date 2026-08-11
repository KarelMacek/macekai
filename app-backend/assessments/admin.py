import json

from django.contrib import admin
from django.contrib.auth import get_user_model

from .i18n import resolve_locale
from .models import (
    AdminFeedback,
    Answer,
    Category,
    Diagnostics,
    FeedbackRequest,
    FileBlob,
    Journey,
    JourneyStep,
    LikertOption,
    Question,
    ResultThreshold,
    Test,
    TestSubmission,
)
from .services import diagnostics_status, open_diagnostics


class CategoryInline(admin.TabularInline):
    model = Category
    extra = 0
    fields = ("key", "name", "order")
    show_change_link = True


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    fields = ("order", "question_type", "category", "text", "allow_comment")
    show_change_link = True


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ("slug", "version", "test_type", "is_active", "created_at")
    list_filter = ("test_type", "is_active")
    search_fields = ("slug",)
    inlines = [CategoryInline, QuestionInline]


class ResultThresholdInline(admin.TabularInline):
    model = ResultThreshold
    extra = 0
    fields = ("min_score", "max_score", "title", "description", "order")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("test", "key", "order")
    list_filter = ("test",)
    inlines = [ResultThresholdInline]


class LikertOptionInline(admin.TabularInline):
    model = LikertOption
    extra = 0
    fields = ("value", "label", "order")


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("test", "order", "question_type", "category", "short_text")
    list_filter = ("test", "question_type")
    inlines = [LikertOptionInline]
    actions = ["copy_options_to_sibling_questions"]

    @admin.display(description="Text")
    def short_text(self, obj):
        return resolve_locale(obj.text, "en")[:60]

    @admin.action(description="Copy Likert options to every other Likert question in the same test")
    def copy_options_to_sibling_questions(self, request, queryset):
        copied_to = 0
        for question in queryset:
            if question.question_type != Question.QUESTION_TYPE_LIKERT:
                continue
            source_options = list(question.options.all())
            if not source_options:
                continue
            siblings = Question.objects.filter(
                test=question.test, question_type=Question.QUESTION_TYPE_LIKERT
            ).exclude(pk=question.pk)
            for sibling in siblings:
                sibling.options.all().delete()
                LikertOption.objects.bulk_create(
                    [
                        LikertOption(question=sibling, value=o.value, label=o.label, order=o.order)
                        for o in source_options
                    ]
                )
                copied_to += 1
        self.message_user(request, f"Copied options to {copied_to} question(s).")


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    fields = ("question", "selected_option", "text_value", "comment")
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(TestSubmission)
class TestSubmissionAdmin(admin.ModelAdmin):
    list_display = ("user", "test", "diagnostics", "submitted_at")
    list_filter = ("test", "diagnostics__journey")
    readonly_fields = ("test", "user", "diagnostics", "submitted_at", "formatted_result")
    fields = ("test", "user", "diagnostics", "submitted_at", "formatted_result")
    inlines = [AnswerInline]

    @admin.display(description="Computed result")
    def formatted_result(self, obj):
        return json.dumps(obj.computed_result, indent=2, ensure_ascii=False)

    def has_add_permission(self, request):
        return False


class JourneyStepInline(admin.TabularInline):
    model = JourneyStep
    extra = 0
    fields = ("order", "test")


@admin.register(Journey)
class JourneyAdmin(admin.ModelAdmin):
    list_display = ("slug", "is_active", "simpleshop_product_id")
    inlines = [JourneyStepInline]


class AdminFeedbackInline(admin.StackedInline):
    model = AdminFeedback
    extra = 0
    max_num = 1


@admin.register(FeedbackRequest)
class FeedbackRequestAdmin(admin.ModelAdmin):
    list_display = ("diagnostics", "linkedin_url", "has_cv", "requested_at", "published")
    list_filter = ("diagnostics__journey",)
    inlines = [AdminFeedbackInline]

    @admin.display(description="CV uploaded", boolean=True)
    def has_cv(self, obj):
        return bool(obj.cv_file)

    @admin.display(description="Published", boolean=True)
    def published(self, obj):
        return getattr(obj, "feedback", None) is not None and obj.feedback.is_published


@admin.register(Diagnostics)
class DiagnosticsAdmin(admin.ModelAdmin):
    list_display = (
        "email", "user", "journey", "status_display", "opened_via", "opened_at", "source_order_id",
    )
    list_filter = ("journey", "opened_via")
    search_fields = ("email", "user__username", "user__email", "source_order_id", "source_order_number")
    readonly_fields = (
        "source_order_id", "source_order_number", "source_product_id", "raw_payload", "opened_at",
    )
    actions = ["open_new_cycle_for_same_email"]

    @admin.display(description="Status")
    def status_display(self, obj):
        return diagnostics_status(obj)

    def save_model(self, request, obj, form, change):
        if not change:
            if not obj.user_id:
                obj.user = get_user_model().objects.filter(email__iexact=obj.email).first()
        super().save_model(request, obj, form, change)

    @admin.action(description="Open a new diagnostics cycle for the same email")
    def open_new_cycle_for_same_email(self, request, queryset):
        for diagnostics in queryset:
            open_diagnostics(email=diagnostics.email, journey=diagnostics.journey)
        self.message_user(request, f"Opened {queryset.count()} new cycle(s).")


@admin.register(FileBlob)
class FileBlobAdmin(admin.ModelAdmin):
    list_display = ("name", "original_filename", "content_type", "size", "uploaded_by", "created_at")
    readonly_fields = [f.name for f in FileBlob._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
