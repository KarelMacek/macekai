# Owns every secret this environment's Web App needs at runtime. The Web App
# never receives raw secret values as Terraform variables/app_settings — it
# gets Key Vault reference strings (built from this vault's name, a pure
# naming convention, no data dependency needed) and resolves them itself at
# boot via its own managed identity.

variable "project_name" {
  type = string
}

variable "environment_name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "tenant_id" {
  type = string
}

variable "web_app_principal_id" {
  type        = string
  description = "Object ID of the Web App's system-assigned managed identity — granted read access to secrets."
}

variable "google_client_secret" {
  type      = string
  sensitive = true
}

variable "postgres_administrator_password" {
  type      = string
  sensitive = true
}

variable "storage_connection_string" {
  type      = string
  sensitive = true
  default   = ""
}

variable "azure_openai_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "tavily_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

resource "random_password" "django_secret_key" {
  length  = 50
  special = true
}

# Key Vault names must be globally unique, 3-24 chars, alphanumeric/hyphens.
resource "azurerm_key_vault" "kv" {
  name                = "kv-${var.project_name}-${var.environment_name}"
  resource_group_name = var.resource_group_name
  location            = var.location
  tenant_id           = var.tenant_id
  sku_name            = "standard"

  rbac_authorization_enabled = true

  # Dev/staging vaults should be fully deletable when an environment is torn
  # down — no compliance need for purge protection here (unlike prod).
  purge_protection_enabled = var.environment_name == "prod" ? true : false
}

resource "azurerm_role_assignment" "web_app_secrets_user" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.web_app_principal_id
}

locals {
  secrets = {
    "secret-key"                = random_password.django_secret_key.result
    "google-client-secret"      = var.google_client_secret
    "postgres-admin-password"   = var.postgres_administrator_password
    "storage-connection-string" = var.storage_connection_string
    "azure-openai-api-key"      = var.azure_openai_api_key
    "tavily-api-key"            = var.tavily_api_key
  }
}

resource "azurerm_key_vault_secret" "secrets" {
  for_each     = local.secrets
  name         = each.key
  value        = each.value
  key_vault_id = azurerm_key_vault.kv.id
}

output "vault_name" {
  value = azurerm_key_vault.kv.name
}

output "vault_uri" {
  value = azurerm_key_vault.kv.vault_uri
}
