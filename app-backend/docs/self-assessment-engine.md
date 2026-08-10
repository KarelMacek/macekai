# Self-assessment test engine — how it works

This documents the actual implementation on the `self-assessment-test-engine`
branch (`app-backend/assessments/` + the corresponding `app-frontend/`
screens). For the original design rationale drawn from a sibling project,
see [`self-assessment-design-notes.md`](self-assessment-design-notes.md) —
this file describes what was actually built, which extends that in a few
places (open-question tests, the journey concept, file uploads, admin
feedback).

## The core idea

Nothing about a test's content is hardcoded. A "test" — its questions,
scoring categories, Likert scale labels, result copy — is all data, authored
through Django admin. The Python code only knows about two **test types**:

- **`snapshot`** — Likert-scale questions (optionally with a free-text
  comment per question). Answers get aggregated into per-category scores at
  the end.
- **`mapping`** — open-ended text questions. No aggregation; the admin just
  reads the raw answers.

A **journey** is an ordered sequence of tests a user works through, followed
by a feedback-request step (upload a CV and/or paste a LinkedIn URL), after
which the admin (Karel) reviews everything and publishes feedback — a
document plus a link to an external video (Loom/YouTube/etc.).

Everything is bilingual (English/Czech). Test content and static UI copy are
translated separately (see [Bilingual content](#bilingual-content) below).

## Data model

All models live in `app-backend/assessments/models.py`.

```
Test ──┬── Category ──── ResultThreshold
       └── Question ──── LikertOption
```

- **`Test`** — `slug`, `test_type` (`snapshot`/`mapping`), `version`
  (bumped when content changes meaningfully — never edit a version's
  questions once real submissions exist against it; make a new version
  instead), translatable `title`/`description`/`instructions`, `is_active`.
- **`Category`** — a scoring dimension within a snapshot test (e.g.
  "Growth Mindset"). Unused by mapping tests.
- **`Question`** — belongs to a `Test`, optionally to a `Category`.
  `question_type` is `likert` or `open_text`. `allow_comment` lets a Likert
  question also collect free text. `config` is a JSON escape hatch for
  future question types that need extra per-question settings.
- **`LikertOption`** — one point on a question's scale (e.g. "Never" = 0.2,
  "Always" = 1.0). Modeled per-question rather than as a shared reusable
  scale — the Django admin has a bulk "copy options to every other Likert
  question in this test" action so a 5-point scale doesn't need re-typing
  per question.
- **`ResultThreshold`** — admin-authored result copy for a category score
  band (e.g. score in `[0.6, 0.8)` → this title/description). Snapshot-only.

```
TestSubmission ──── Answer
Journey ──── JourneyStep ──── Test
```

- **`TestSubmission`** — one row per completed test attempt (`test`, `user`,
  `submitted_at`). `computed_result` is a JSON blob **frozen at submission
  time** by the scoring engine and never recomputed on read — so changing
  scoring logic later can't silently rewrite historical results. Retaking a
  test just inserts a new row; "your current result" is simply the latest
  row for `(user, test)` — there's no separate "in progress"/"retake" state
  to manage.
- **`Answer`** — one row per question answered in a submission. Either
  `selected_option` (Likert) or `text_value` (open text) is populated,
  plus an optional `comment`.
- **`Journey`** / **`JourneyStep`** — a named, ordered list of required
  tests. A user's progress through it is **derived, not stored**: for each
  step in order, does a `TestSubmission` exist for `(user, step.test)`? The
  first one without a submission is "current"; once all have one, the
  journey is done and the feedback-request step unlocks.

```
FeedbackRequest ──── AdminFeedback
FileBlob (backing store for both cv_file and document fields)
```

- **`FeedbackRequest`** — the CV/LinkedIn submission that unlocks once a
  journey is complete. `cv_file` is a real uploaded file; `linkedin_url` is
  just a URL string.
- **`AdminFeedback`** — one-to-one with a `FeedbackRequest`. `document` is
  an uploaded file, `video_url` is an external link (never an uploaded
  video), `notes`, and `is_published` — the one genuinely mutable "state"
  in this whole system, since "has Karel published this yet" is a real
  one-way admin action that can't be derived from anything else.
- **`FileBlob`** — see [File storage](#file-storage-in-postgres) below.

## Editing a live test — what's frozen and what isn't

This is a real gap worth understanding before editing a test that's already
been answered.

**What's frozen and safe:** the *numeric score*. `TestSubmission.computed_result`
is calculated once at submission time and stored as plain numbers — it is
never recalculated, so it can't drift even if the test changes later.

**What's *not* frozen:** everything else. `Answer` rows store a foreign key
to the `Question`/`LikertOption` that was picked, not a copy of its text. So
if you edit a question's wording, an option's label, or a threshold's result
copy **in place** — on the same rows — that change is retroactive: anyone
viewing an old submission afterward (in `/admin/` or via the API) sees the
*current* wording, not what the client actually saw. Editing an option's
numeric `value` after the fact doesn't rewrite past scores (those stayed
frozen), but it does mean the option now displays inconsistently with what
it was worth when someone picked it.

Django does stop you from *deleting* a question or option that already has
real answers against it (`on_delete=PROTECT`) — but that only guards against
deletion, not editing.

**The intended pattern:** `Test.version` exists for exactly this. A real
content change should create a **new** `Test` row with a bumped `version`
(and its own fresh `Category`/`Question`/`LikertOption`/`ResultThreshold`
rows), leaving the old version's rows completely untouched. Old submissions
keep pointing at the old version, so they stay historically accurate; new
submissions go against the new version.

This isn't enforced anywhere yet — there's no "duplicate as v2" admin
action, and nothing warns you if you edit a question that already has
answers. Small typo fixes are low-risk to edit in place; any real content or
wording change should go through a new version instead.

## Bilingual content

Every translatable text field (`Test.title`, `Question.text`,
`LikertOption.label`, `ResultThreshold.description`, etc.) is a plain
`JSONField` storing `{"en": "...", "cs": "..."}` — not a translation
library or extra DB tables. `assessments/i18n.py` has two small helpers:

- `resolve_locale(value, lang)` — picks the right language out of one of
  those JSON blobs, falling back to English if the requested language is
  missing.
- `get_lang(request)` — resolves the request's language from `?lang=`,
  then `Accept-Language`, then falls back to English.

API serializers use these to return already-resolved plain strings — the
frontend never sees the `{en, cs}` shape, just whichever language was
requested. This is why switching the language toggle re-fetches from the
API rather than swapping strings client-side: the source of truth for test
content lives on the server.

Static UI chrome (button labels, page titles, "Submit", journey step
labels) is a separate, much smaller concern — a hand-written dictionary in
`app-frontend/src/lib/i18n.ts` with a `useTranslation()` hook, not a full
i18n framework (two fixed languages, no runtime-loaded translation files,
nothing here needs more than that).

## Scoring engine

`assessments/scoring.py` is a small, isolated, unit-testable module with no
Django request/view involvement:

```python
def compute_result(test, answers):
    if test.test_type == Test.TYPE_SNAPSHOT:
        return compute_snapshot_result(test, answers)
    if test.test_type == Test.TYPE_MAPPING:
        return {}
    raise ValueError(...)
```

`compute_snapshot_result` groups a submission's answers by their question's
category, averages the selected option's numeric `value` per category, then
matches each category's score against its `ResultThreshold` rows to find
which one applies. The result — `{"categories": {...}, "matched_thresholds":
{...}}` — is what gets frozen into `TestSubmission.computed_result`.

Adding a third test type later means adding one function and one branch in
`compute_result` — nothing about `TestSubmission`, `Answer`, or the
submission view needs to change, since answers are already handled
generically per `question_type` and `computed_result` is an untyped JSON
field.

## File storage (in Postgres)

Azure App Service's local disk isn't reliably persistent across restarts,
so instead of local `FileSystemStorage` or provisioning Azure Blob Storage
(which would've meant a new dependency, a Terraform apply, and container
setup for what's currently a handful of small PDFs), uploaded files are
stored as bytes in Postgres.

`assessments/storage.py` defines `PostgresFileStorage`, a real
`django.core.files.storage.Storage` subclass backed by the `FileBlob`
model (`name`, `data` as `BinaryField`, `content_type`, `size`,
`uploaded_by`). Because it's a genuine `Storage` subclass, ordinary
`FileField`s, DRF serializers, and Django admin's file widgets all work
completely normally — the fact that bytes live in Postgres instead of on
disk is invisible above the storage layer. If this ever needs to move to
Azure Blob at scale, only `storage.py` changes — no model or migration
changes.

Since there's no public URL for a Postgres-backed file the way Blob storage
would give you, downloads go through an authenticated view:
`GET /api/assessments/files/<blob_id>/`, which checks the requester is
either the file's owner or an admin before streaming the bytes back.

## API surface

DRF + `drf-spectacular` (mounted at `/api/schema/` and `/api/docs/` in
`DEBUG`). All endpoints require a logged-in session (Easy Auth already
populates it):

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/assessments/journey/` | Current user's journey + derived step statuses |
| `GET` | `/api/assessments/tests/<slug>/` | Full test definition (questions/options/categories), locale-resolved |
| `POST` | `/api/assessments/tests/<slug>/submit/` | Submit all answers for a test in one request |
| `GET` | `/api/assessments/submissions/` | Current user's submission history |
| `GET` | `/api/assessments/submissions/<id>/` | One submission, including its frozen `computed_result` |
| `GET`/`POST` | `/api/assessments/feedback-request/` | Read/create the CV + LinkedIn feedback request |
| `GET` | `/api/assessments/feedback/` | Published admin feedback (404 until it exists and is published) |
| `GET` | `/api/assessments/files/<blob_id>/` | Authenticated file download (CV, feedback document) |

The submit endpoint validates the whole answer set's shape declaratively in
a serializer — exactly one answer per question, shaped correctly for that
question's type — before any scoring runs, so malformed submissions never
reach the scoring engine at all.

## Django admin workflow

`/admin/` is mounted and gated by `is_staff`, which the Easy Auth
middleware sets automatically for whichever email matches the
`ADMIN_EMAIL` environment variable (locally, `DEBUG`'s dev-login already
grants a staff "dev" user without needing this set).

To author a test: create a `Test`, add `Category` rows (for snapshot
tests), add `Question` rows under it (each with a `category` if it's a
Likert question feeding aggregation), then add `LikertOption` rows on each
question — or answer one question's options and use the "copy options to
every other Likert question in this test" bulk action to avoid retyping a
5-point scale repeatedly. Add `ResultThreshold` rows per category to give
each score band its own title/description. Finally, wire the test into a
`Journey` via `JourneyStep` rows in the order they should appear.

To review and respond to a user: open their `FeedbackRequest` in admin —
it shows their CV/LinkedIn, and (via the submissions inline) every test
submission with its answers and, for snapshot tests, the frozen computed
scores. Attach a feedback document and an external video URL in the inline
`AdminFeedback` form, and tick "published" when ready — the user can't see
any of it until that flag is set.

## Frontend

`app-frontend` is TypeScript + `wouter` (routing) + a small set of
Radix/shadcn UI primitives + Tailwind, mirroring `landing/`'s already-proven
stack rather than inventing a new one.

- **`DashboardPage`** — fetches `/api/assessments/journey/`, shows each
  step's status (completed/current/upcoming) and links into the current
  test or, once everything's done, into the feedback-request form.
- **`TestPage`** — fetches the test definition and renders either
  `SnapshotTest` or `MappingTest` depending on `test_type`, then
  `SnapshotResult` (for snapshot tests) once submitted.
- **`SnapshotTest`** (`features/assessments/SnapshotTest.tsx`) — adapts
  `landing/src/components/QuickReflectionModal.tsx`'s
  question → calculating → result phase machine and auto-advance timing,
  but driven by API-fetched questions/options instead of a hardcoded array,
  and submitting to the real backend instead of scoring locally (the
  backend's `compute_result` is authoritative).
- **`MappingTest`** — a single `react-hook-form` + `zod` form with one
  textarea per open question, submitted as a batch (no per-question
  auto-advance — open reflection benefits from being able to review earlier
  answers before submitting).
- **`FeedbackRequestPage`** — CV file input + LinkedIn URL field,
  submitted as `multipart/form-data`.
- **`FeedbackViewPage`** — shows a "pending" message until
  `/api/assessments/feedback/` returns something (i.e. until it's
  published), then the document download link and video link.

## Walking through a full journey

1. Admin creates two tests in `/admin/` (one `snapshot`, one `mapping`),
   each with bilingual content, and wires both into the default `Journey`.
2. User logs in, sees the dashboard with step 1 marked "current".
3. User takes the snapshot test — one question per screen, auto-advancing
   on each answer — and sees a result screen with per-category score bars
   and the matched threshold's title/description.
4. User takes the mapping test — a single page of open-text questions.
5. Dashboard now shows "all tests done" and a "request feedback" card.
6. User uploads a CV and/or pastes a LinkedIn URL.
7. Admin opens the user's `FeedbackRequest` in `/admin/`, reads both
   submissions (including the snapshot's computed scores and the mapping's
   raw answers), downloads the CV, attaches a feedback document + video
   link, and publishes.
8. User visits the feedback page and sees the document/video links.

## Seeding default content

`app-backend/assessments/fixtures/default_journey.json` contains two real
tests wired into a default `Journey`, bilingual (en/cs):

- **"Personal Wellbeing Snapshot"** (`personal-snapshot`, `snapshot` type) —
  60 real statements across 6 life areas (Relationships, Personal, Home
  Environment, Health and Body, Work, Finances), 10 each, answered Yes/No.
  Category score is simply the % of statements marked Yes. The per-category
  result copy (the low/mid/high threshold titles/descriptions) is a first
  draft, not reviewed final copy — worth a pass before this goes in front of
  real clients.
- **"Personal Operating Map"** (`operating-map`, `mapping` type) — 20 real
  open reflection questions covering motivation, self-sabotage, energy,
  stress response, strengths/weaknesses, and environment.

Load it with:

```
python manage.py loaddata default_journey
```

This is a one-time, deliberate action (not run automatically on deploy) —
running it twice against a DB that already has this content will fail on
the unique `(slug, version)` constraint.

## Known gaps / natural next steps

- No CI test gate yet — the `pytest` suite in `assessments/tests/` runs
  locally only.
- No admin-authored content editor beyond Django admin itself (acceptable
  for a single admin; would need a real CMS UI if that ever changes).
- Azure OpenAI is provisioned in infra but not wired into this feature —
  the most natural extension would be AI-assisted interpretation of a
  user's results or draft feedback, layered on top of `compute_result`'s
  output rather than replacing it.
- The generated-TypeScript-client idea from the design notes was scoped
  down to hand-written types in `app-frontend/src/types/api.ts`, matching
  the serializers by hand rather than via `openapi-typescript` codegen —
  fine at this size, worth automating if the API surface grows a lot.
