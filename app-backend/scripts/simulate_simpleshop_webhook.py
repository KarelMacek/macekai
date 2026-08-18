#!/usr/bin/env python3
"""Simulates a SimpleShop.cz "webhook after payment" call against a real
deployed environment (dev/staging/prod) — opens a diagnostics for someone
without a real SimpleShop purchase, going through the exact same code path
a real purchase does (assessments/webhooks.py:SimpleShopWebhookView),
including the post-purchase instructions email (see
docs/post-purchase-email.md) if this is a first-time order id.

Typical uses:
  - dev/staging: exercise the full purchase -> email -> login flow without
    paying, using a disposable test email.
  - prod: grant an existing client access without asking them to buy again.

Usage:
  python scripts/simulate_simpleshop_webhook.py --env dev \\
      --email test@example.com --product-id PROD1-CS

Find a Journey's product id in Django admin's Journeys list (shows both the
cs/en SimpleShop product ids) — pass whichever one you want to grant; that
choice is also what selects the diagnostics' language.

Reads each environment's webhook secret from a .env file (default: repo
root .env, override with --env-file) — same value as that environment's
Key Vault "simpleshop-webhook-secret". Expected keys:
  SIMPLESHOP_WEBHOOK_SECRET_DEV
  SIMPLESHOP_WEBHOOK_SECRET_STAGING
  SIMPLESHOP_WEBHOOK_SECRET_PROD
"""
import argparse
import sys
import uuid
from pathlib import Path

import requests
from dotenv import dotenv_values

ENVIRONMENTS = {
    "dev": "https://app-macekai-dev.azurewebsites.net",
    "staging": "https://app-macekai-staging.azurewebsites.net",
    "prod": "https://app.macek.ai",
}

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ENV_FILE = REPO_ROOT / ".env"


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--env", required=True, choices=sorted(ENVIRONMENTS), help="Target environment")
    parser.add_argument("--email", required=True, help="Buyer/recipient email (SimpleShop's 'mail')")
    parser.add_argument(
        "--product-id", required=True, help="SimpleShop product id (a Journey's cs or en id)"
    )
    parser.add_argument("--order-id", help="Order id ('id') — auto-generated if omitted")
    parser.add_argument("--order-number", default="", help="Order number ('number'), cosmetic only")
    parser.add_argument("--base-url", help="Override the environment's default base URL")
    parser.add_argument(
        "--env-file", type=Path, default=DEFAULT_ENV_FILE, help=f"Path to .env (default: {DEFAULT_ENV_FILE})"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Print the request that would be sent, don't send it"
    )
    args = parser.parse_args()

    secret_key = f"SIMPLESHOP_WEBHOOK_SECRET_{args.env.upper()}"
    secret = dotenv_values(args.env_file).get(secret_key) or ""
    if not secret and not args.dry_run:
        sys.exit(
            f"Missing {secret_key} in {args.env_file}. Add it there (the same value as "
            f"{args.env}'s Key Vault 'simpleshop-webhook-secret')."
        )

    base_url = (args.base_url or ENVIRONMENTS[args.env]).rstrip("/")
    order_id = args.order_id or f"manual-{uuid.uuid4().hex[:12]}"
    params = {
        "mail": args.email,
        "id": order_id,
        "id_product": args.product_id,
        "number": args.order_number,
    }

    if args.dry_run:
        print(f"GET {base_url}/api/webhooks/simpleshop/<secret>/")
        print(f"params: {params}")
        return

    url = f"{base_url}/api/webhooks/simpleshop/{secret}/"
    resp = requests.get(url, params=params, timeout=15)
    print(f"-> {resp.status_code}")

    if resp.status_code == 404:
        sys.exit(f"404 — {secret_key} in {args.env_file} doesn't match {args.env}'s real secret.")
    if resp.status_code != 200:
        print(resp.text)
        sys.exit(1)

    # The webhook always returns 200 even when it silently no-ops (unknown
    # product_id, missing fields) — by design, to avoid confirming to a
    # prober whether the endpoint/token is valid. Confirm the real effect
    # in Django admin's Diagnostics list if in doubt.
    print(
        f"Sent. If product_id {args.product_id!r} matched an active Journey, a diagnostics "
        f"for {args.email} on {args.env} now exists (order_id={order_id}) — verify in "
        f"Django admin's Diagnostics list. A first-time order id also triggers the "
        f"purchase-instructions email."
    )


if __name__ == "__main__":
    main()
