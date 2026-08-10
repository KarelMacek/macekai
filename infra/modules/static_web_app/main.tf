# Hosts landing (and, if it's ever split out from web_app, app-frontend) as
# an Azure Static Web App — free tier, no compute cost. No asistentka
# precedent for this module; that project is pure Django+React with no
# separate static site.
#
# Custom domain is optional (var.custom_domain = "" skips it) so dev/staging
# SWAs can be created before DNS is set up. For prod, this module is used to
# IMPORT the existing landing SWA rather than create a new one — see
# infra/README.md for that procedure; do not `terragrunt apply` this for
# prod until the import + zero-diff-plan check has been done.

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

variable "app_name" {
  type        = string
  description = "Which app this SWA serves, e.g. 'landing'. Kept distinct from project_name since app-frontend may get its own SWA later."
  default     = "landing"
}

variable "sku_tier" {
  type    = string
  default = "Free"
}

variable "custom_domain" {
  type        = string
  default     = ""
  description = "e.g. macek.ai or staging.macek.ai. Empty = no custom domain bound (DNS is external — see plan). Setting this only creates the binding; the CNAME/TXT records still need to be added manually at the DNS provider first."
}

resource "azurerm_static_web_app" "swa" {
  name                = "swa-${var.app_name}-${var.environment_name}"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = var.sku_tier
  sku_size            = var.sku_tier
}

resource "azurerm_static_web_app_custom_domain" "domain" {
  count             = var.custom_domain != "" ? 1 : 0
  static_web_app_id = azurerm_static_web_app.swa.id
  domain_name       = var.custom_domain
  validation_type   = "cname-delegation"
}

output "default_hostname" {
  value = azurerm_static_web_app.swa.default_host_name
}

output "name" {
  value = azurerm_static_web_app.swa.name
}

output "api_key" {
  value       = azurerm_static_web_app.swa.api_key
  sensitive   = true
  description = "The deploy token GitHub Actions' Azure/static-web-apps-deploy@v1 action needs — same idiom landing already uses today, one token per SWA resource."
}
