# Values shared by every environment: neither secret nor environment-specific.
#
# tenant_id: needed by the key_vault module for the azurerm_key_vault
# resource's own required tenant_id field (which Entra tenant the vault's
# RBAC is evaluated against) — this is NOT about the login provider, keep it
# regardless of which auth provider app-backend uses.
#
# google_client_id: the OAuth 2.0 Client ID for Google Sign-In via Azure App
# Service's Easy Auth (a native `google_v2` auth_settings_v2 provider — same
# mechanism as the old Microsoft one, just a different upstream IdP). Not
# secret (visible in the browser's OAuth redirect regardless). The
# corresponding Client *Secret* goes through Key Vault via
# TF_VAR_google_client_secret, same pattern as the old Easy Auth secret.
#
# admin_email: the one admin (Karel) — this Google account gets is_staff on
# login, granting /admin/ access (assessments authoring + feedback review).
# Same account for every environment, so set once here rather than repeated
# per environment. See app-backend/backend/auth/middleware.py.
#
# ms_graph_client_id: Application (client) ID of the Entra app registration
# used for Microsoft Graph sendMail (app-only auth), see
# app-backend/backend/graph_mail.py. Not secret. Same tenant as tenant_id
# above (macek.ai), so no separate ms_graph_tenant_id — web_app's
# ms_graph_tenant_id input just reuses local.tenant_id. Blank until that app
# registration is created (see app-backend/docs/post-purchase-email.md) — the
# email send fails loudly (caught, logged) rather than silently while blank.
locals {
  tenant_id          = "169b8ff6-9bc7-43e8-8ad3-902fd6852f89"                                     # macek.ai tenant, confirmed via `az account show`
  google_client_id   = "216246394621-1392smrosb70db367hiets4fq0cij03m.apps.googleusercontent.com" # "macekai-app-backend" OAuth client, Google Cloud project "MacekAI", created 2026-08-10
  admin_email        = "kouckarel@gmail.com"
  ms_graph_client_id = "74565a6b-d335-4a6a-9a8e-6ba6484e1693" # "macekai-app-mailer" app registration, created 2026-08-17
}
