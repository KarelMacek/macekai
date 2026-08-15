# Reviewing submissions and giving feedback

This is the day-to-day workflow for reviewing someone's diagnostics and
publishing your feedback. It happens **inside the app itself**, not Django
admin — log in as an admin account (`is_staff=True`), and a toggle appears
in the top-right of the header to switch from "user view" to "admin view".
The toggle only shows up for staff accounts; everyone else never sees it.

Content authoring (test questions, Likert scales, journeys) is still done in
Django admin — see the last section below. Only the review/feedback loop
moved into the app.

## 1. Find who's waiting on you

Admin view opens on a table of every diagnostics ever opened: email,
journey, status, opened date. Use the **status filter** (`awaiting_admin_review`
is your actual queue — tests done, feedback requested, nothing published
yet) or the **email search box** if someone emailed you directly and you
want their specific record.

Click a row to open it.

## 2. Review their answers

The detail page shows, top to bottom:

- Who and which journey (email, journey slug, current status).
- Each test's answers — the snapshot test shows category scores, the
  open-ended mapping test shows what they actually wrote, one paragraph per
  question.
- Their **CV** (download link) and **LinkedIn URL**, if they submitted a
  feedback request.

## 3. Write and publish feedback

Below that, the feedback form itself:

- **Feedback document (PDF)** — upload a file. If one was already uploaded,
  a "current document" link shows above the input so you can check what's
  live before replacing it.
- **Video URL** — paste a link (Loom, YouTube unlisted, etc.) — this is a
  link field, not a file upload.
- **Notes** — optional, freeform.
- **Publish to customer** — leave unchecked while you're still drafting; the
  person cannot see anything (document, video, or that feedback exists at
  all) until this is checked. Check it and save when ready — that's the one
  deliberate one-way action in this flow.

Hit **Save feedback**. You can come back and re-save as many times as you
like (same form, pre-filled with whatever's already there) — saving again
just updates the existing feedback rather than creating a second one.

## Wiring up a new SimpleShop product

Each `Journey` maps 1:1 to a SimpleShop product via its
`simpleshop_product_id` field. Do this once per new product (learned the
hard way, live, on 2026-08-14 — SimpleShop's own settings UI silently
dropped a saved value more than once, so the verification steps below are
not optional):

1. **Get the webhook URL.** The secret token lives in that environment's
   Key Vault, never in the repo:
   ```
   az keyvault secret show --vault-name kv-macekai-prod --name simpleshop-webhook-secret --query value -o tsv
   ```
   Build the full URL with SimpleShop's own placeholder-token syntax (they
   substitute these at call time — paste literally, including the curly
   braces):
   ```
   https://app-macekai-prod.azurewebsites.net/api/webhooks/simpleshop/<token>/?mail={mail}&id={id}&number={number}&id_product={id_product}
   ```
   `dev`/`staging` follow the same pattern with their own vault name and
   hostname.

2. **Paste it into the product's "Webhook po zaplacení" (after payment)
   field** in SimpleShop, not "Webhook po objednání" (after order) — an
   order can exist unpaid (e.g. pending bank transfer), and you don't want
   to grant a diagnostics slot before the money has actually arrived.

3. **Reload the settings page and re-check the field before trusting it
   saved.** This bit us live: the full URL (with token + query string) got
   silently truncated down to just the bare path with nothing else. Don't
   test until you've confirmed, on a fresh page load, that the field still
   shows the complete string ending in `id_product={id_product}`.

4. **Find the real `id_product`.** SimpleShop's own order/document history
   doesn't log webhook delivery attempts, so don't rely on it. Instead tail
   the target environment's logs and trigger one real purchase:
   ```
   az webapp log tail --name app-macekai-prod --resource-group macekai-prod
   ```
   Watch for a line containing `/api/webhooks/simpleshop/` — the
   `id_product=` query param on that request is the real value (their
   dispatcher shows up as `Vyfakturuj-Webhook`, not "SimpleShop", in the
   user-agent — that's expected, it's their invoicing integration doing the
   actual call).

5. **Set `Journey.simpleshop_product_id`** to that value at
   `/admin/assessments/journey/<id>/change/` — clear the field completely
   before typing the new value, save, then **reload the journey list page
   and confirm the `SIMPLESHOP PRODUCT ID` column actually shows the new
   value** before moving on. Same silent-save risk as step 3.

6. **Re-test.** Either repurchase for real, or (cheaper) resend the exact
   webhook call captured in step 4 by hand — `_handle()` is idempotent per
   `source_order_id`/`id`, so replaying the same request is safe. Confirm a
   new row appears for that email in the admin console's diagnostics list.

## Other things you can do here

Still in Django admin (`/admin/`), not the in-app console:

- **Open a diagnostics manually** — `/admin/assessments/diagnostics/add/` and
  fill in just the email + journey. Useful for support cases (someone paid
  but the webhook didn't fire, or you want to comp someone access) without
  waiting on SimpleShop. If a matching Google account already exists, it
  links automatically; if not, it links itself the first time that email
  logs in. Same thing from a terminal: `python manage.py open_diagnostics
  someone@example.com`.
- **"Open a new diagnostics cycle for the same email"** — a bulk action on
  the `Diagnostics` list. Select a row, run the action, and it opens a fresh
  diagnostics for that same email (a new attempt) — for repeat-purchase
  support cases without needing a real second SimpleShop order.
- **Editing test content** — `/admin/assessments/test/` (questions, Likert
  scales, category result copy) and `/admin/assessments/journey/` (which
  tests, in what order, and — for whichever `Journey` a SimpleShop product
  should unlock — its `simpleshop_product_id`). See
  [`self-assessment-engine.md`](self-assessment-engine.md) for how editing a
  test that already has real answers against it behaves.
