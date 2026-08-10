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
locals {
  tenant_id        = "169b8ff6-9bc7-43e8-8ad3-902fd6852f89" # macek.ai tenant, confirmed via `az account show`
  google_client_id = "REPLACE_ME_GOOGLE_OAUTH_CLIENT_ID"    # from Google Cloud Console — see infra/README.md
}
