# Manually opening a diagnostics via the webhook simulator

`scripts/simulate_simpleshop_webhook.py` calls a real deployed environment's
`SimpleShopWebhookView` (`assessments/webhooks.py`) exactly the way SimpleShop
itself would, without a real purchase. Unlike `python manage.py
open_diagnostics <email>` (which only works against whatever database the
process it runs in is connected to, i.e. requires shell access to that
environment's container), this is a plain HTTP call from your own machine
against any environment — and it's the only manual path that also sends the
real post-purchase instructions email (see `docs/post-purchase-email.md`),
since that's only triggered from the webhook path.

## When to use it

- **dev/staging**: exercise the full purchase → email → login flow with a
  disposable test email, without going through SimpleShop.
- **prod**: grant an existing client access without asking them to buy again
  — e.g. a support case or a manually-arranged deal.

## Usage

```
python scripts/simulate_simpleshop_webhook.py --env dev \
    --email someone@example.com --product-id PROD1-CS
```

`--product-id` must match one of the target Journey's
`simpleshop_product_id_cs`/`simpleshop_product_id_en` values — visible in
Django admin's Journeys list — and also determines the diagnostics'
language. Add `--dry-run` to print the request without sending it.

## Secrets

Reads `SIMPLESHOP_WEBHOOK_SECRET_{DEV,STAGING,PROD}` from the repo root
`.env` (see `.env.example`) — the same value as that environment's Key Vault
`simpleshop-webhook-secret`. These are separate from the plain
`SIMPLESHOP_WEBHOOK_SECRET` var, which is only for local docker-compose.
