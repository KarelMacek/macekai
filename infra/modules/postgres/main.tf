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
  default = "B_Standard_B1ms"
}

variable "postgres_version" {
  type    = string
  default = "18"
}

variable "storage_mb" {
  type    = number
  default = 32768
}

resource "random_password" "admin_password" {
  length  = 32
  special = true
}

resource "azurerm_postgresql_flexible_server" "postgres" {
  name                   = "psql-${var.project_name}-${var.environment_name}"
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = var.postgres_version
  administrator_login    = "psqladmin"
  administrator_password = random_password.admin_password.result
  storage_mb             = var.storage_mb
  sku_name               = var.sku_name
  backup_retention_days  = 7

  lifecycle {
    # Azure assigns this at create time; re-planning shouldn't try to move zones.
    ignore_changes = [zone]
  }
}

resource "azurerm_postgresql_flexible_server_database" "db" {
  name      = replace(var.environment_name, "-", "_")
  server_id = azurerm_postgresql_flexible_server.postgres.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

# No VNet integration at this SKU — the Web App has no static outbound IP to
# allow-list, so this opens to Azure-internal traffic generally rather than a
# specific range. Documented hardening path once real client data is
# involved: App Service VNet integration + Postgres private endpoint,
# disabling public network access.
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.postgres.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

output "server_name" {
  value = azurerm_postgresql_flexible_server.postgres.name
}

output "fqdn" {
  value = azurerm_postgresql_flexible_server.postgres.fqdn
}

output "database_name" {
  value = azurerm_postgresql_flexible_server_database.db.name
}

output "administrator_login" {
  value = azurerm_postgresql_flexible_server.postgres.administrator_login
}

output "administrator_password" {
  value     = random_password.admin_password.result
  sensitive = true
}
