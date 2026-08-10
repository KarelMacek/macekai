from django.conf import settings
from django.db import models

from .storage import PostgresFileStorage

file_storage = PostgresFileStorage()


class Test(models.Model):
    __test__ = False  # tell pytest this isn't a test class despite the name

    TYPE_SNAPSHOT = "snapshot"
    TYPE_MAPPING = "mapping"
    TYPE_CHOICES = [
        (TYPE_SNAPSHOT, "Snapshot (Likert scale, aggregated)"),
        (TYPE_MAPPING, "Mapping (open-ended, no aggregation)"),
    ]

    slug = models.SlugField()
    test_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    # Frozen-version pattern: bump when a test's content changes meaningfully,
    # so past TestSubmissions stay interpretable against the version they were
    # actually answered under. Never mutate a version's questions after
    # submissions exist against it — make a new version instead.
    version = models.PositiveIntegerField(default=1)
    title = models.JSONField(default=dict, blank=True)
    description = models.JSONField(default=dict, blank=True)
    instructions = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["slug", "version"], name="unique_test_slug_version")
        ]
        ordering = ["slug", "version"]

    def __str__(self):
        return f"{self.slug} v{self.version} ({self.test_type})"


class Category(models.Model):
    """A scoring dimension within a snapshot-type test (e.g. "Growth Mindset").
    Unused by mapping-type tests, which have no aggregation."""

    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="categories")
    key = models.SlugField()
    name = models.JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["test", "key"], name="unique_category_key_per_test")
        ]
        ordering = ["order"]
        verbose_name_plural = "categories"

    def __str__(self):
        return f"{self.test.slug} / {self.key}"


class Question(models.Model):
    QUESTION_TYPE_LIKERT = "likert"
    QUESTION_TYPE_OPEN_TEXT = "open_text"
    QUESTION_TYPE_CHOICES = [
        (QUESTION_TYPE_LIKERT, "Likert scale"),
        (QUESTION_TYPE_OPEN_TEXT, "Open text"),
    ]

    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="questions")
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="questions"
    )
    question_type = models.CharField(max_length=32, choices=QUESTION_TYPE_CHOICES)
    text = models.JSONField(default=dict, blank=True)
    help_text = models.JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0)
    # Snapshot-only: lets a Likert question also collect a free-text comment.
    allow_comment = models.BooleanField(default=False)
    # Escape hatch for future question types' type-specific config, without a
    # schema migration for every new type's quirks.
    config = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.test.slug} #{self.order}"


class LikertOption(models.Model):
    """One point on a Likert question's scale. Modeled per-question (not a
    shared reusable scale) for v1 simplicity; the admin has a bulk "copy
    options to sibling questions" action to avoid re-typing a 5-point scale's
    labels on every question."""

    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="options")
    value = models.FloatField()
    label = models.JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.question_id}: {self.value}"


class ResultThreshold(models.Model):
    """Admin-authored result copy for a category score band, e.g. a score in
    [0.6, 0.8) maps to this title/description. Snapshot-type only."""

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="thresholds")
    min_score = models.FloatField()
    max_score = models.FloatField()
    title = models.JSONField(default=dict, blank=True)
    description = models.JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.category}: [{self.min_score}, {self.max_score}]"


class TestSubmission(models.Model):
    test = models.ForeignKey(Test, on_delete=models.PROTECT, related_name="submissions")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="test_submissions"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    # Computed once at submission time by assessments.scoring.compute_result()
    # and never recomputed on read, so changing scoring logic later doesn't
    # silently rewrite historical results. Empty for mapping-type tests.
    computed_result = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-submitted_at"]
        indexes = [models.Index(fields=["user", "test", "-submitted_at"])]

    def __str__(self):
        return f"{self.user} / {self.test.slug} @ {self.submitted_at:%Y-%m-%d}"


class Answer(models.Model):
    submission = models.ForeignKey(TestSubmission, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.PROTECT, related_name="answers")
    # Exactly one of selected_option/text_value is meaningfully populated,
    # depending on question.question_type. One table for both rather than a
    # base/subclass split, since it's just two nullable columns.
    selected_option = models.ForeignKey(
        LikertOption, on_delete=models.PROTECT, null=True, blank=True, related_name="answers"
    )
    text_value = models.TextField(blank=True, default="")
    comment = models.TextField(blank=True, default="")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["submission", "question"], name="unique_answer_per_question")
        ]

    def __str__(self):
        return f"{self.submission_id} / Q{self.question_id}"


class Journey(models.Model):
    """A named, ordered sequence of required tests. Modeled as data (not a
    hardcoded list) so a second journey variant is a content change, not a
    code change."""

    slug = models.SlugField(unique=True)
    name = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.slug


class JourneyStep(models.Model):
    journey = models.ForeignKey(Journey, on_delete=models.CASCADE, related_name="steps")
    test = models.ForeignKey(Test, on_delete=models.PROTECT, related_name="journey_steps")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(fields=["journey", "order"], name="unique_journey_step_order")
        ]

    def __str__(self):
        return f"{self.journey.slug} #{self.order}: {self.test.slug}"


class FeedbackRequest(models.Model):
    """The CV/LinkedIn submission that triggers the admin review, once a user
    has completed every JourneyStep's test."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedback_requests"
    )
    journey = models.ForeignKey(Journey, on_delete=models.PROTECT, related_name="feedback_requests")
    cv_file = models.FileField(upload_to="cv/", storage=file_storage, null=True, blank=True)
    linkedin_url = models.URLField(blank=True, default="")
    requested_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-requested_at"]

    def __str__(self):
        return f"{self.user} / {self.journey.slug}"


class AdminFeedback(models.Model):
    """The admin's (Karel's) response to a FeedbackRequest: a document plus an
    external video link (never an uploaded video file)."""

    feedback_request = models.OneToOneField(
        FeedbackRequest, on_delete=models.CASCADE, related_name="feedback"
    )
    document = models.FileField(
        upload_to="feedback-docs/", storage=file_storage, null=True, blank=True
    )
    video_url = models.URLField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.is_published and not self.published_at:
            from django.utils import timezone

            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Feedback for {self.feedback_request.user}"


class FileBlob(models.Model):
    """Backing store for PostgresFileStorage. One row per uploaded file."""

    name = models.CharField(max_length=255, unique=True)
    original_filename = models.CharField(max_length=255, blank=True, default="")
    content_type = models.CharField(max_length=255, blank=True, default="")
    data = models.BinaryField()
    size = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_filename or self.name
