include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env    = read_terragrunt_config(find_in_parent_folders("env.hcl")).locals
  common = read_terragrunt_config(find_in_parent_folders("common.hcl")).locals
}

terraform {
  source = "${get_repo_root()}/infra/modules/web_app"
}

dependency "resource_group" {
  config_path = "../resource_group"

  mock_outputs = {
    name     = "mock-rg"
    location = "westeurope"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "postgres" {
  config_path = "../postgres"

  mock_outputs = {
    fqdn                = "mock.postgres.database.azure.com"
    database_name       = "mock"
    administrator_login = "mock"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "storage" {
  config_path = "../storage"

  mock_outputs = {
    storage_account_name = "mockstorage"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "openai" {
  config_path = "../openai"

  mock_outputs = {
    endpoint        = "https://mock.openai.azure.com/"
    deployment_name = "mock"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "acr" {
  config_path = "../../shared/acr"

  mock_outputs = {
    login_server   = "mock.azurecr.io"
    admin_username = "mock"
    admin_password = "mock"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  project_name        = local.env.project_name
  environment_name    = local.env.environment_name
  resource_group_name = dependency.resource_group.outputs.name
  location            = local.env.app_location
  sku_name            = local.env.web_app_sku
  image_tag           = local.env.image_tag

  acr_login_server   = dependency.acr.outputs.login_server
  acr_admin_username = dependency.acr.outputs.admin_username
  acr_admin_password = dependency.acr.outputs.admin_password

  google_client_id = local.common.google_client_id

  postgres_fqdn                = dependency.postgres.outputs.fqdn
  postgres_database_name       = dependency.postgres.outputs.database_name
  postgres_administrator_login = dependency.postgres.outputs.administrator_login

  storage_account_name = dependency.storage.outputs.storage_account_name

  azure_openai_endpoint        = dependency.openai.outputs.endpoint
  azure_openai_deployment_name = dependency.openai.outputs.deployment_name
}
