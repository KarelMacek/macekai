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

variable "sku_name" {
  type    = string
  default = "S0"
}

variable "deployment_name" {
  type        = string
  description = "Name of the model deployment — this is what apps read as AZURE_OPENAI_DEPLOYMENT, not a raw model id."
}

variable "model_name" {
  type        = string
  description = "Azure OpenAI model to deploy, e.g. 'gpt-4o'. Check current model availability/quota in the target region+subscription before applying — this shifts over time."
}

variable "model_version" {
  type = string
}

variable "model_capacity" {
  type        = number
  default     = 10
  description = "Deployment capacity in the unit Azure bills for this model (TPM x1000 for most chat models) — check quota for the target region/subscription before raising this."
}

variable "deployment_sku_name" {
  type        = string
  default     = "GlobalStandard"
  description = "Deployment SKU — not every model/version/region combo supports the regional 'Standard' SKU. Check `az rest --method get --url 'https://management.azure.com/subscriptions/<sub>/providers/Microsoft.CognitiveServices/locations/<region>/modelCapacities?api-version=2024-04-01-preview&modelFormat=OpenAI&modelName=<model>&modelVersion=<version>'` for what's actually available before overriding."
}

variable "deploy_model" {
  type        = bool
  default     = true
  description = "A fresh subscription starts with zero approved TPM quota for any model — deploying fails with InsufficientQuota until a quota increase is manually requested/approved via the Azure Portal (Terraform can't do this). Set false to create just the Cognitive Account (so dependents can still read its endpoint) without attempting a deployment; flip true once quota is granted."
}

resource "azurerm_cognitive_account" "openai" {
  name                  = "oai-${var.project_name}-${var.environment_name}"
  resource_group_name   = var.resource_group_name
  location              = var.location
  kind                  = "OpenAI"
  sku_name              = var.sku_name
  custom_subdomain_name = "oai-${var.project_name}-${var.environment_name}"
}

resource "azurerm_cognitive_deployment" "main" {
  count                = var.deploy_model ? 1 : 0
  name                 = var.deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = var.model_name
    version = var.model_version
  }

  sku {
    name     = var.deployment_sku_name
    capacity = var.model_capacity
  }
}

output "endpoint" {
  value = azurerm_cognitive_account.openai.endpoint
}

output "primary_access_key" {
  value     = azurerm_cognitive_account.openai.primary_access_key
  sensitive = true
}

output "deployment_name" {
  # Empty when var.deploy_model is false — nothing calls Azure OpenAI yet, so
  # an empty AZURE_OPENAI_DEPLOYMENT app setting downstream is harmless.
  value = var.deploy_model ? azurerm_cognitive_deployment.main[0].name : ""
}
