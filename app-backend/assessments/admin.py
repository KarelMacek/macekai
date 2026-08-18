import json

from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.template.response import TemplateResponse
from django.urls import NoReverseMatch, reverse
from django.utils.html import format_html

from .gdpr import delete_identity, resolve_identity, summarize_identity
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
    UserConsent,
)
from .services import diagnostics_status, open_diagnostics

User = get_user_model()


def _render_gdpr_confirmation(modeladmin, request, identities, *, action_name, queryset):
    context = {
        **modeladmin.admin_site.each_context(request),
        "title": "Confirm GDPR erasure",
        "identities": identities,
        "queryset": queryset,
        "action_checkbox_name": admin.helpers.ACTION_CHECKBOX_NAME,
        "action_name": action_name,
        "opts": modeladmin.model._meta,
    }
    return TemplateResponse(request, "assessments/admin/gdpr_confirm_erasure.html", context)


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
    list_display = ("user", "test", "diagnostics", "status", "created_at", "submitted_at")
    list_filter = ("status", "test", "diagnostics__journey")
    readonly_fields = (
        "test", "user", "diagnostics", "status", "created_at", "submitted_at", "formatted_result",
    )
    fields = ("test", "user", "diagnostics", "status", "created_at", "submitted_at", "formatted_result")
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
    list_display = ("slug", "is_active", "simpleshop_product_id_cs", "simpleshop_product_id_en")
    inlines = [JourneyStepInline]


class AdminFeedbackInline(admin.StackedInline):
    model = AdminFeedback
    extra = 0
    max_num = 1


class NeedsReviewFilter(admin.SimpleListFilter):
    """A FeedbackRequest only exists once both tests are done, so the only
    real statuses here are "waiting on me" vs "already published" — this
    is the one filter that matters for triage."""

    title = "review status"
    parameter_name = "review_status"

    def lookups(self, request, model_admin):
        return [("awaiting", "Awaiting my review"), ("published", "Published")]

    def queryset(self, request, queryset):
        if self.value() == "awaiting":
            return queryset.filter(feedback__isnull=True) | queryset.filter(feedback__is_published=False)
        if self.value() == "published":
            return queryset.filter(feedback__is_published=True)
        return queryset


@admin.register(FeedbackRequest)
class FeedbackRequestAdmin(admin.ModelAdmin):
    list_display = ("diagnostics", "linkedin_url", "has_cv", "requested_at", "published")
    list_filter = (NeedsReviewFilter, "diagnostics__journey")
    search_fields = ("diagnostics__email", "diagnostics__user__email", "diagnostics__user__username")
    readonly_fields = ("diagnostics", "requested_at", "diagnostics_answers_link")
    fields = ("diagnostics", "diagnostics_answers_link", "cv_file", "linkedin_url", "requested_at")
    inlines = [AdminFeedbackInline]

    @admin.display(description="CV uploaded", boolean=True)
    def has_cv(self, obj):
        return bool(obj.cv_file)

    @admin.display(description="Published", boolean=True)
    def published(self, obj):
        return getattr(obj, "feedback", None) is not None and obj.feedback.is_published

    @admin.display(description="Test answers")
    def diagnostics_answers_link(self, obj):
        if not obj.diagnostics_id:
            return "—"
        try:
            url = reverse("admin:assessments_diagnostics_change", args=[obj.diagnostics_id])
        except NoReverseMatch:
            return "—"
        return format_html('<a href="{}">View this person\'s test submissions and answers →</a>', url)


class TestSubmissionSummaryInline(admin.TabularInline):
    """Read-only, compact — the point is seeing at a glance what someone
    answered/scored without leaving the Diagnostics page. Full per-question
    answers are one click away via show_change_link (TestSubmissionAdmin's
    own AnswerInline)."""

    model = TestSubmission
    extra = 0
    fields = ("test", "status", "submitted_at", "formatted_result_short")
    readonly_fields = fields
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False

    @admin.display(description="Result")
    def formatted_result_short(self, obj):
        if obj.status == TestSubmission.STATUS_DRAFT:
            return "(in progress — not yet submitted)"
        if not obj.computed_result:
            return "(open-ended — see answers)"
        return json.dumps(obj.computed_result.get("categories", obj.computed_result), ensure_ascii=False)


@admin.register(Diagnostics)
class DiagnosticsAdmin(admin.ModelAdmin):
    list_display = (
        "email", "user", "journey", "language", "status_display", "opened_via", "opened_at",
        "source_order_id",
    )
    list_filter = ("journey", "opened_via", "language")
    search_fields = ("email", "user__username", "user__email", "source_order_id", "source_order_number")
    readonly_fields = (
        "source_order_id", "source_order_number", "source_product_id", "raw_payload", "opened_at",
        "feedback_request_link",
    )
    fields = (
        "email", "user", "journey", "language", "opened_via", "opened_at",
        "source_order_id", "source_order_number", "source_product_id", "raw_payload",
        "notes", "feedback_request_link",
    )
    inlines = [TestSubmissionSummaryInline]
    actions = ["open_new_cycle_for_same_email", "erase_gdpr_data_for_email"]

    @admin.display(description="Status")
    def status_display(self, obj):
        return diagnostics_status(obj)

    @admin.display(description="Feedback")
    def feedback_request_link(self, obj):
        feedback_request = getattr(obj, "feedback_request", None)
        if not feedback_request:
            return "Not requested yet"
        url = reverse("admin:assessments_feedbackrequest_change", args=[feedback_request.id])
        label = "Review & publish feedback →" if not (
            getattr(feedback_request, "feedback", None) and feedback_request.feedback.is_published
        ) else "View published feedback →"
        return format_html('<a href="{}">{}</a>', url, label)

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

    @admin.action(description="Erase ALL GDPR data for this email (irreversible)")
    def erase_gdpr_data_for_email(self, request, queryset):
        emails = sorted(set(queryset.values_list("email", flat=True)))
        if len(emails) != 1:
            self.message_user(
                request,
                "Select diagnostics belonging to exactly one email to erase at a time.",
                level=messages.ERROR,
            )
            return None

        email = emails[0]
        if request.POST.get("confirm_erasure"):
            typed_email = request.POST.get("typed_email", "").strip()
            if typed_email.lower() != email.lower():
                self.message_user(
                    request, "Typed email did not match — nothing was deleted.", level=messages.ERROR
                )
                return _render_gdpr_confirmation(
                    self,
                    request,
                    [summarize_identity(resolve_identity(email=email))],
                    action_name="erase_gdpr_data_for_email",
                    queryset=queryset,
                )
            summary = delete_identity(email=email)
            self.message_user(
                request,
                f"Erased {summary['email']}: {summary['diagnostics_count']} diagnostics, "
                f"{summary['submissions_count']} submission(s), {summary['file_count']} file(s).",
            )
            return None

        return _render_gdpr_confirmation(
            self,
            request,
            [summarize_identity(resolve_identity(email=email))],
            action_name="erase_gdpr_data_for_email",
            queryset=queryset,
        )


@admin.register(UserConsent)
class UserConsentAdmin(admin.ModelAdmin):
    list_display = ("user", "ai_processing_consent", "research_consent", "recorded_at")
    list_filter = ("ai_processing_consent", "research_consent")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("user", "ai_processing_consent", "research_consent", "recorded_at")

    def has_add_permission(self, request):
        return False


@admin.register(FileBlob)
class FileBlobAdmin(admin.ModelAdmin):
    list_display = ("name", "original_filename", "content_type", "size", "uploaded_by", "created_at")
    readonly_fields = [f.name for f in FileBlob._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


admin.site.unregister(User)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Ordinary deletion is disabled on purpose (has_delete_permission
    below, and delete_selected dropped from actions): Django's built-in
    delete only cascades what User's own FKs CASCADE (TestSubmission,
    UserConsent), silently leaving this person's Diagnostics/
    FeedbackRequest/AdminFeedback/FileBlob rows behind with user set to
    NULL by SET_NULL — a partial, GDPR-incomplete erasure. The only way to
    delete a user here is erase_gdpr_data, which requires typing the exact
    account email into a confirmation page before anything is destroyed."""

    actions = ["erase_gdpr_data"]

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Erase all GDPR data for this user (irreversible)")
    def erase_gdpr_data(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(
                request,
                "Select exactly one user to erase at a time — email confirmation is per-account.",
                level=messages.ERROR,
            )
            return None

        user = queryset.first()
        if request.POST.get("confirm_erasure"):
            typed_email = request.POST.get("typed_email", "").strip()
            if typed_email.lower() != user.email.lower():
                self.message_user(
                    request, "Typed email did not match — nothing was deleted.", level=messages.ERROR
                )
                return _render_gdpr_confirmation(
                    self,
                    request,
                    [summarize_identity(resolve_identity(user=user))],
                    action_name="erase_gdpr_data",
                    queryset=queryset,
                )
            summary = delete_identity(user=user)
            self.message_user(
                request,
                f"Erased {summary['email']}: {summary['diagnostics_count']} diagnostics, "
                f"{summary['submissions_count']} submission(s), {summary['file_count']} file(s), "
                f"consent removed: {summary['has_consent']}.",
            )
            return None

        return _render_gdpr_confirmation(
            self,
            request,
            [summarize_identity(resolve_identity(user=user))],
            action_name="erase_gdpr_data",
            queryset=queryset,
        )
