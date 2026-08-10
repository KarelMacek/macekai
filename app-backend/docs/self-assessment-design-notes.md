# Self-assessment / self-reflection test — design notes from elifeplatform

Source: `/home/karel/projects/elifeplatform`, feature called **"5DEC"** (Five Digital Economy
Capabilities) — a fixed 60-question Likert-scale self-assessment scoring a learner across five
categories (Growth Mindset, Career Intelligence, Cultural Intelligence, Digital Intelligence,
Influence). Their stack is FastAPI + MongoDB + Pydantic v1, not Django/DRF — patterns below
translate directly, they just need a relational re-expression.

Not yet built here — this doc is inspiration/reference for a future `app-backend` feature, no code
written yet.

## What's worth copying

**Validate the shape at the schema layer, not in view code.** Their submission model
(`InSurveyAnswersModel`) declares `answers: list[AnswerModel] = Field(min_items=60, max_items=60,
unique_items=True)` and constrains each answer `ge=0, le=1`. "Exactly N unique answers, each in
range" is enforced for free by Pydantic before any handler code runs. In DRF this is a serializer
with matching `validators=[...]` / field constraints rather than manual `if len(answers) != 60`
checks.

**Freeze the computed result into the stored record at submission time.** The persisted document
stores raw answers *and* the computed per-category scores together, plus `survey_type` /
`survey_version` constants. Scoring isn't recomputed on read. This means: cheap reads, and —
important — changing the scoring algorithm later doesn't silently rewrite historical results out
from under users. The `survey_version` field exists but is only ever `1` right now; it's a
deliberate no-cost placeholder for "we will eventually have a v2 question set" rather than
something they needed yet.

**Scoring as a join + groupby, not hand-rolled loops.** `compute_dec_profile()` merges
questions-with-categories against submitted answers on `question_id`, then does
`groupby("category")["answer"].mean()`. Flat category-mean, no weighting or reverse-scored items
in this version, but the shape (join then aggregate) makes "add a `weight` column, use a weighted
mean" a small change later rather than a rewrite. Worth keeping scoring logic in one function/service
with a single clear entry point (`compute_*_profile(answers) -> result`), independent of the
view/request layer, so it's unit-testable without spinning up the API.

**Retake via insert, "current result" via query — no explicit state machine.** There's no
"retake" endpoint and no mutable "in progress" record. Every submission just inserts a new result
row; "get my result" is "get my newest row for this user." Old attempts stay around for free
(future trend analysis) without anyone having designed for it up front. Cheap to build, and it's
the kind of default that's easy to retrofit "show me my history over time" onto later, unlike a
design that overwrites in place.

**One-question-per-screen, no back navigation, auto-advance, auto-submit on last question.**
The intro page sets the expectation explicitly ("you cannot revisit the previous question") so the
UX constraint reads as intentional, not broken. Selecting an answer auto-advances after a short
delay; there's no "Submit" button — finishing the last question submits automatically. Removes an
entire class of "what if answers and current step disagree" bugs, at the cost of not being able to
mock this as accessible-first with GUI-explicit prev/next controls without changing that stated
UX contract.

**The Likert enum values are the scoring contract.** Frontend maps
`Never=0.2, Rarely=0.4, Sometimes=0.6, Often=0.8, Always=1` directly onto the `[0,1]` scale the
backend scores against — no separate translation layer between "what the user picked" and "what
gets scored." Simple, but means the frontend enum and backend scale have to be kept in lockstep by
convention, not by a shared source of truth (see gap below).

**A cheap boolean gate for onboarding, not a state machine.** `filled_dec` on the user/auth
payload ("does a latest result exist for this user") is enough to gate "you haven't done the
assessment yet" flows, computed from the same "get latest result" query rather than a dedicated
onboarding-status model.

**Generated API client from the OpenAPI schema.** Frontend TS types/methods are codegen'd from the
backend's Pydantic/OpenAPI schema, so backend and frontend types can't drift silently. DRF can emit
an equivalent OpenAPI schema via `drf-spectacular`, and the same codegen approach (e.g.
`openapi-typescript-codegen`) would apply directly to `app-backend`/`app-frontend`.

**Batch submission, not incremental.** All 60 answers go up in one `POST`; there's no
save-partial-progress endpoint. Resumability, such as it is, is purely a frontend-local concern
(React state) — refreshing mid-quiz loses progress. Fine for a 10-minute quiz where they've
explicitly told the user not to expect to go back; would need reconsideration for something longer
or lower-stakes-to-abandon.

## Explicit gaps / things NOT to copy as-is

- **No admin/CMS authoring** — questions and result-interpretation copy are both hardcoded in
  source (a Python list literal, a TS array). Every wording change is a full deploy. Worth doing
  better if we want non-engineers (Karel, as a coach) editing question/result text without a code
  change.
- **No i18n** on question or result text.
- **No LLM integration at all**, despite this being an "AI capabilities" assessment — the
  "personalized feedback" is static per-category copy, not model-generated. This is the most
  obvious opportunity to differentiate for macekai: LLM-generated personalized interpretation of a
  user's scores (using Azure OpenAI, already provisioned in `infra/`) instead of (or blended with)
  static per-category copy.
- **No analytics/drop-off tracking** on the multi-screen flow.
- **Frontend-enum-as-scoring-contract** (see above) is a silent coupling — a shared constant or
  backend-supplied mapping would be safer than duplicating the `[0,1]` scale in two codebases.
- Refreshing mid-quiz loses all progress — acceptable for their 10-minute fixed quiz, probably not
  for anything longer.

## Rough shape for `app-backend` if we build this

Not a plan, just the load-bearing pieces suggested by the above, for a future actual planning pass:

- `Question` / `AssessmentCategory` as real rows (not hardcoded), even if authored via Django
  admin rather than a full CMS — solves the "no way to edit without deploy" gap cheaply.
- `AssessmentVersion` (or a version field on a `Test`/`Questionnaire` model) from day one, per the
  "freeze the version, don't recompute historical scores" lesson.
- `SubmittedAssessment` storing raw answers + frozen computed result together, keyed by
  user + version + created_at, no explicit "retake" endpoint — just insert-and-query-latest.
- Scoring as an isolated, unit-testable function/service (`compute_profile(answers) -> result`),
  separate from the DRF view, from the start.
- Batch submission (one `POST` with all answers) matching the fixed-length-quiz UX, validated via
  DRF serializer field constraints (length, per-item range) rather than manual checks.
- `drf-spectacular` + generated TS client for `app-frontend`, since that pairing doesn't exist yet
  in this repo and would remove a whole class of type-drift bugs.
- Plan for Azure OpenAI-generated personalized result interpretation as a first-class feature, not
  an afterthought — this is the clearest gap in elifeplatform's implementation and the most
  natural fit for macekai's existing AI-coaching positioning.
