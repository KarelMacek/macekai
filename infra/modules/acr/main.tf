# Shared Container Registry — one for the whole project, not per-environment.
# Every environment's web_app pushes differently-tagged images into this same
# registry (dev-latest, staging-latest, prod-latest, plus immutable sha
# tags) — the build artifact is identical across environments, only
# compute/data need isolating per environment.
#
# Adapted from asistentka's root-level main.tf, where this resource lives
# outside Terragrunt entirely (a historical accident — that project's state
# storage account already existed before its Terragrunt migration). Nothing
# pre-exists for macekai, so this is a normal Terragrunt-managed module
# instead, sourced from infra/live/shared/acr.

variable "project_name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

resource "azurerm_container_registry" "acr" {
  name                = "acr${replace(var.project_name, "-", "")}"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Basic"
  admin_enabled       = true
}

output "login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "admin_username" {
  value = azurerm_container_registry.acr.admin_username
}

output "admin_password" {
  value     = azurerm_container_registry.acr.admin_password
  sensitive = true
}
