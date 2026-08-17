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
    """A draft is a real row from the moment the user answers their first
    question — it just isn't "done" yet. status distinguishes the two;
    diagnostics_status()/diagnostics_step_statuses() and every listing
    endpoint must filter on status=submitted so an in-progress draft is
    never mistaken for a finished attempt. Editing a submitted test never
    mutates it — see services.get_or_create_draft — a new row is created
    instead, seeded from the latest submitted one, so computed_result stays
    frozen and the full answer history is preserved."""

    __test__ = False  # tell pytest this isn't a test class despite the name

    STATUS_DRAFT = "draft"
    STATUS_SUBMITTED = "submitted"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_SUBMITTED, "Submitted"),
    ]

    test = models.ForeignKey(Test, on_delete=models.PROTECT, related_name="submissions")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="test_submissions"
    )
    diagnostics = models.ForeignKey(
        "Diagnostics", on_delete=models.CASCADE, related_name="submissions"
    )
    # default=STATUS_SUBMITTED is the safe backfill value for pre-existing
    # rows (all implicitly submitted) and the safe fallback for any future
    # creation path that forgets to pass status= explicitly.
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_SUBMITTED)
    created_at = models.DateTimeField(auto_now_add=True)
    # Null while status=draft; set once, explicitly, at the draft->submitted
    # transition. No longer auto_now_add — a draft's creation moment and its
    # real submit moment are now two different things.
    submitted_at = models.DateTimeField(null=True, blank=True)
    # Computed once at submission time by assessments.scoring.compute_result()
    # and never recomputed on read, so changing scoring logic later doesn't
    # silently rewrite historical results. Empty for mapping-type tests and
    # for any row still in draft status.
    computed_result = models.JSONField(default=dict, blank=True)

    class Meta:
        # created_at, not submitted_at: a live draft has submitted_at=None,
        # and Postgres sorts NULLs first on DESC — ordering by submitted_at
        # would float unfinished drafts above real history.
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "test", "status", "-created_at"]),
            models.Index(fields=["diagnostics", "test", "status"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["diagnostics", "test", "user"],
                condition=models.Q(status="draft"),
                name="unique_draft_per_test_per_diagnostics_per_user",
            )
        ]

    def __str__(self):
        when = f"{self.submitted_at:%Y-%m-%d}" if self.submitted_at else "draft"
        return f"{self.user} / {self.test.slug} @ {when}"


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
    code change. Doubles as "the diagnostics type/product": each purchasable
    diagnostics maps to a Journey via simpleshop_product_id_{cs,en} — one
    per checkout language, since SimpleShop needs a separate product/form
    per language but the underlying Journey/JourneySteps content is already
    bilingual and shared. A genuinely different diagnostics product later is
    still a new Journey + JourneySteps in admin, not a code change."""

    slug = models.SlugField(unique=True)
    name = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    simpleshop_product_id_cs = models.CharField(max_length=64, blank=True, default="")
    simpleshop_product_id_en = models.CharField(max_length=64, blank=True, default="")

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


class Diagnostics(models.Model):
    """One full attempt at a Journey — the "instance" to Journey's
    "template," the same relationship TestSubmission already has to Test,
    one level up. Groups together the TestSubmissions, FeedbackRequest, and
    AdminFeedback that make up a single run-through, so a user who buys
    twice gets two separate, independently-trackable results instead of one
    singleton that gets silently overwritten.

    Opened either by the SimpleShop webhook (a real purchase) or manually by
    an admin (support cases, local testing). email is the durable identity —
    a purchase can arrive before the buyer ever logs into the app — user is
    linked immediately if it already exists, or opportunistically later (see
    services.link_unlinked_diagnostics, called from the auth middleware).

    Deliberately has no stored status field — see services.diagnostics_status,
    consistent with how journey-step completion is derived elsewhere rather
    than stored."""

    OPENED_VIA_WEBHOOK = "simpleshop_webhook"
    OPENED_VIA_ADMIN = "admin"
    OPENED_VIA_CHOICES = [
        (OPENED_VIA_WEBHOOK, "SimpleShop webhook"),
        (OPENED_VIA_ADMIN, "Manually opened (admin)"),
    ]

    email = models.EmailField(db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="diagnostics",
    )
    journey = models.ForeignKey(Journey, on_delete=models.PROTECT, related_name="diagnostics")
    # Audit trail + idempotency against SimpleShop retrying the same webhook call.
    # Nullable+unique: Postgres/SQLite both treat multiple NULLs as distinct, so
    # admin-opened diagnostics (no order) never collide with each other.
    source_order_id = models.CharField(max_length=64, null=True, blank=True, unique=True)
    source_order_number = models.CharField(max_length=64, blank=True, default="")
    source_product_id = models.CharField(max_length=64, blank=True, default="")
    raw_payload = models.JSONField(default=dict, blank=True)
    opened_via = models.CharField(max_length=32, choices=OPENED_VIA_CHOICES, default=OPENED_VIA_ADMIN)
    opened_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default="")
    # Which SimpleShop product language this was bought under (derived from
    # which of Journey.simpleshop_product_id_{cs,en} matched the webhook's
    # id_product) — lets the frontend default to the purchased language
    # instead of only guessing from the browser. Blank for admin-opened rows.
    language = models.CharField(max_length=8, blank=True, default="")

    class Meta:
        ordering = ["-opened_at"]
        verbose_name_plural = "diagnostics"

    def __str__(self):
        return f"{self.email} / {self.journey.slug} (#{self.pk})"


class FeedbackRequest(models.Model):
    """The CV/LinkedIn submission that triggers the admin review, once every
    JourneyStep's test has a submission under this Diagnostics."""

    diagnostics = models.OneToOneField(
        Diagnostics, on_delete=models.CASCADE, related_name="feedback_request"
    )
    cv_file = models.FileField(upload_to="cv/", storage=file_storage, null=True, blank=True)
    linkedin_url = models.URLField(blank=True, default="")
    requested_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-requested_at"]

    def __str__(self):
        return f"Feedback request for {self.diagnostics}"


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
        return f"Feedback for {self.feedback_request.diagnostics}"


class UserConsent(models.Model):
    """Account-level, asked exactly once, before first dashboard/test access
    (see ConsentGate on the frontend). Row existence *is* "has this user been
    asked" — see services.has_recorded_consent — so there's no third
    nullable tri-state to model; both booleans are only ever written once,
    together, atomically, from ConsentView.post()."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consent"
    )
    ai_processing_consent = models.BooleanField()
    research_consent = models.BooleanField()
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} consent @ {self.recorded_at:%Y-%m-%d}"


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
