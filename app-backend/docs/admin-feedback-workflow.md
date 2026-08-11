# Reviewing submissions and giving feedback (Django admin)

This is the day-to-day workflow for reviewing someone's diagnostics and publishing
your feedback, using `/admin/` — no custom review UI exists yet, and admin is
genuinely fine for this at the current scale (one admin, low volume).

## 1. Find who's waiting on you

Go to **`/admin/assessments/feedbackrequest/`** and filter by **"review status" →
"Awaiting my review"** in the right sidebar. That's your queue — everyone who's
finished both tests and submitted their CV/LinkedIn, but hasn't gotten feedback
yet. (A `FeedbackRequest` only exists once someone's done, so this list is
naturally short.)

Alternative entry point: **`/admin/assessments/diagnostics/`** shows every
diagnostics ever opened, with a **Status** column (`tests_in_progress` →
`awaiting_feedback_request` → `awaiting_admin_review` → `completed`) and search by
email. Use this if you want the full picture for a specific person (e.g. they
emailed you directly) rather than working through the queue.

## 2. Review their answers

Click into the person's row in `feedbackrequest`. You'll see:

- **Test answers** — a link at the top ("View this person's test submissions and
  answers →") that jumps to their `Diagnostics` page.
- On that `Diagnostics` page, a compact inline table lists each test with its
  result: the snapshot test shows category scores (e.g. `{"relationships": 0.8,
  "work": 0.6, ...}`), the open-ended mapping test shows `(open-ended — see
  answers)`. Click **into** a row (via the inline's own link) to see every
  individual question and answer — for the mapping test, that's where you
  actually read what they wrote.
- Back on the `feedbackrequest` page: their **CV** (click the file link to
  download) and **LinkedIn URL**, right there in the form.

## 3. Write and publish feedback

Still on the `feedbackrequest` page, scroll down to the **Admin feedback**
section (inline form):

- **Document** — upload a file (PDF, doc, whatever). Stored the same way the CV
  is (bytes in Postgres, not a public URL) — the person can only download it once
  it's published.
- **Video URL** — paste a link (Loom, YouTube unlisted, etc.). This is a link,
  not a file upload — record/host the video wherever you normally would.
- **Notes** — optional, freeform.
- **Is published** — leave unchecked while you're still working on it; the
  person genuinely cannot see anything (document, video, or that feedback exists
  at all) until this is checked. Check it and save when you're ready — that's
  the one deliberate one-way action in this whole flow.

Save. Done — they'll see it next time they load the app.

## Other things you can do here

- **Open a diagnostics manually** — `/admin/assessments/diagnostics/add/` and
  fill in just the email + journey. Useful for support cases (someone paid but
  the webhook didn't fire, or you want to comp someone access) without waiting
  on SimpleShop. If a matching Google account already exists, it links
  automatically; if not, it links itself the first time that email logs in.
  Same thing from a terminal: `python manage.py open_diagnostics
  someone@example.com`.
- **"Open a new diagnostics cycle for the same email"** — a bulk action on the
  `Diagnostics` list. Select a row, run the action, and it opens a fresh
  diagnostics for that same email (a new attempt) — for repeat-purchase support
  cases without needing a real second SimpleShop order.
- **Editing test content** — `/admin/assessments/test/` (questions, Likert
  scales, category result copy) and `/admin/assessments/journey/` (which tests,
  in what order, and — for whichever `Journey` a SimpleShop product should
  unlock — its `simpleshop_product_id`). See
  [`self-assessment-engine.md`](self-assessment-engine.md) for how editing a
  test that already has real answers against it behaves.
