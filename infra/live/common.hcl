# Values shared by every environment: neither secret (both would be visible
# in login redirect URLs / browser network tabs — a directory ID and a
# public client ID, not a credential) nor environment-specific (one Entra
# tenant, one app registration with a redirect URI added per environment
# hostname).
#
# TODO — both are placeholders. Fill in once logged into the macek.ai
# Azure/Entra tenant (subscription 02b1dc83-906b-4652-9a02-acce7d9a80c1 —
# NOT the same tenant asistentka uses):
#   az account show --query tenantId -o tsv                      # tenant_id
#   az ad app create --display-name macekai-app-backend \
#     --sign-in-audience AzureADMyOrg                             # creates the Easy Auth app registration, gives you easy_auth_client_id
# See infra/README.md for the full one-time bootstrap checklist this belongs to.
locals {
  tenant_id           = "169b8ff6-9bc7-43e8-8ad3-902fd6852f89" # macek.ai tenant, confirmed via `az account show`
  easy_auth_client_id = "90756a5b-ac1f-439e-99ff-291df4f467d8" # "macekai-app-backend" Entra app registration, created 2026-08-10
}
