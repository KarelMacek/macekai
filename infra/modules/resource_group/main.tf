variable "project_name" {
  type = string
}

variable "environment_name" {
  type        = string
  description = "Short env slug used in resource names, e.g. staging, prod."
}

variable "location" {
  type = string
}

locals {
  # Unlike asistentka's resource_group module, there is no "prod predates
  # this convention" exception here — macekai's app-backend/postgres/etc.
  # don't exist in Azure yet, so every environment (prod included) uses the
  # same consistent "<project>-<env>" naming from day one. The one exception
  # is landing's existing Static Web App, which already lives in some
  # resource group created outside Terraform — that's handled by overriding
  # resource_group_name directly in live/prod/landing_swa/terragrunt.hcl
  # once the real name is confirmed, not by special-casing this module.
  rg_name = "${var.project_name}-${var.environment_name}"
}

resource "azurerm_resource_group" "rg" {
  name     = local.rg_name
  location = var.location
}

output "name" {
  value = azurerm_resource_group.rg.name
}

output "location" {
  value = azurerm_resource_group.rg.location
}
