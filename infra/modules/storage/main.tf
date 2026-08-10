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

variable "containers" {
  type        = list(string)
  default     = []
  description = "Blob containers to create. Empty by default — app-backend doesn't have a defined storage need yet; add container names here once it does."
}

# Storage account names must be globally unique, lowercase, <=24 chars, no
# hyphens — hence the replace() instead of just interpolating environment_name.
resource "azurerm_storage_account" "storage" {
  name                     = "st${replace(var.project_name, "-", "")}${replace(var.environment_name, "-", "")}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "containers" {
  for_each              = toset(var.containers)
  name                  = each.value
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "private"
}

output "storage_account_name" {
  value = azurerm_storage_account.storage.name
}

output "primary_connection_string" {
  value     = azurerm_storage_account.storage.primary_connection_string
  sensitive = true
}

output "container_names" {
  value = [for c in azurerm_storage_container.containers : c.name]
}
