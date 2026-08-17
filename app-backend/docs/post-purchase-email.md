# Post-purchase instructions email

When the SimpleShop webhook (`assessments/webhooks.py`) sees a genuinely new
order, it sends the buyer one email — in `assessments/emailing.py` — with an
explicit login link and a walkthrough of the rest of the journey. This exists
because SimpleShop's own post-payment browser redirect isn't a reliable
enough channel on its own; the webhook call is the one signal we can actually
depend on, so it's what triggers this.

Sent via **Microsoft Graph's `sendMail`** (app-only/client-credentials auth,
`backend/graph_mail.py`) as `karel@macek.ai`, using the same `macek.ai` Entra
ID tenant this project's own Azure identity already lives in — no external
email vendor.

## One-time setup (per tenant, not per environment)

1. **Create a dedicated Entra ID app registration** in the `macek.ai`
   tenant — e.g. `macekai-app-mailer`. Deliberately separate from the
   vestigial, unused `macekai-app-backend` registration (the pre-Google-only
   Easy Auth leftover) rather than reusing it, to keep this app's purpose and
   permissions legible on their own. No redirect URI is needed — this is a
   daemon (client-credentials) app, never an interactive login.
2. **API permissions** → Microsoft Graph → **Application** permissions (not
   Delegated) → add `Mail.Send` → **Grant admin consent**.
3. **Strongly recommended:** scope that grant down with an Exchange Online
   Application Access Policy so this app can only send as `karel@macek.ai`,
   not as any mailbox in the tenant:
   ```powershell
   New-ApplicationAccessPolicy -AppId <client-id> -PolicyScopeGroupId karel@macek.ai -AccessRight RestrictAccess -Description "macekai-app-mailer: sendMail only as karel@macek.ai"
   ```
   Without this, an unscoped tenant-wide `Mail.Send` Application permission
   is a bigger blast radius than this feature needs.
4. **Create a client secret** on the app registration. Note the value (once —
   it isn't shown again) and the app's Application (client) ID.

## Per-environment wiring

- `ms_graph_client_id` — same app registration/client ID for every
  environment; set once in `infra/live/common.hcl`.
- `ms_graph_client_secret` — via `TF_VAR_ms_graph_client_secret` when running
  `terragrunt apply` for that environment's `key_vault` component (same
  pattern as `google_client_secret`/`tavily_api_key` — see
  `infra/README.md`).
- `MS_GRAPH_TENANT_ID` reuses `common.hcl`'s existing `tenant_id` — same
  Entra tenant, nothing new to set there.

If `MS_GRAPH_CLIENT_ID`/`SECRET` are blank (e.g. a fresh environment before
this is wired up), `graph_mail.send_mail()` fails — the webhook catches and
logs that, still returns `200`, and the `Diagnostics` row is still created.
The buyer just doesn't get the email until this is set up for that
environment.

## Rotating the client secret

Create a new client secret on the same app registration in the Entra portal,
set `TF_VAR_ms_graph_client_secret` to the new value, re-run `terragrunt
apply` for that environment's `key_vault`, then delete the old secret from
the app registration once the new one is confirmed live.
