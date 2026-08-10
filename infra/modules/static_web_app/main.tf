# Hosts landing (and, if it's ever split out from web_app, app-frontend) as
# an Azure Static Web App — free tier, no compute cost. No asistentka
# precedent for this module; that project is pure Django+React with no
# separate static site.
#
# Custom domains are optional (var.custom_domains = []) so dev/staging SWAs
# can be created before DNS is set up. For prod, this module is used to
# IMPORT the existing landing SWA rather than create a new one — see
# infra/README.md for that procedure; do not `terragrunt apply` this for
# prod until the import + zero-diff-plan check has been done. That existing
# resource doesn't follow this module's own naming convention (it predates
# this repo), hence var.name being overridable rather than always derived.

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

variable "name" {
  type        = string
  default     = ""
  description = "Override the resource name. Empty = derive from app_name/environment_name (the convention every fresh SWA uses). Non-empty only for importing a pre-existing resource whose name predates this convention (e.g. prod's landing SWA, named just 'macekai')."
}

variable "sku_tier" {
  type    = string
  default = "Free"
}

variable "custom_domains" {
  type        = list(string)
  default     = []
  description = "e.g. [\"macek.ai\", \"www.macek.ai\"] or [\"staging.macek.ai\"]. Empty = no custom domain bound (DNS is external — see plan). Setting this only creates the binding; the CNAME/TXT records still need to be added manually at the DNS provider first."
}

locals {
  swa_name = var.name != "" ? var.name : "swa-${var.app_name}-${var.environment_name}"
}

resource "azurerm_static_web_app" "swa" {
  name                = local.swa_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = var.sku_tier
  sku_size            = var.sku_tier
}

resource "azurerm_static_web_app_custom_domain" "domain" {
  for_each          = toset(var.custom_domains)
  static_web_app_id = azurerm_static_web_app.swa.id
  domain_name       = each.value
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
