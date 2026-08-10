# Secrets this environment needs from outside Terraform (no dependency
# module produces them): easy_auth_client_secret, tavily_api_key — via
# TF_VAR_easy_auth_client_secret / TF_VAR_tavily_api_key (see
# infra/README.md). tavily_api_key defaults to "" if unset. Everything else
# secret is generated or already known to Terraform via dependency outputs
# from postgres/storage/web_app.

include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env    = read_terragrunt_config(find_in_parent_folders("env.hcl")).locals
  common = read_terragrunt_config(find_in_parent_folders("common.hcl")).locals
}

terraform {
  source = "${get_repo_root()}/infra/modules/key_vault"
}

dependency "resource_group" {
  config_path = "../resource_group"

  mock_outputs = {
    name     = "mock-rg"
    location = "westeurope"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "web_app" {
  config_path = "../web_app"

  mock_outputs = {
    principal_id = "00000000-0000-0000-0000-000000000000"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "postgres" {
  config_path = "../postgres"

  mock_outputs = {
    administrator_password = "mock"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "storage" {
  config_path = "../storage"

  mock_outputs = {
    primary_connection_string = "mock"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

dependency "openai" {
  config_path = "../openai"

  mock_outputs = {
    primary_access_key = "mock"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  project_name        = local.env.project_name
  environment_name    = local.env.environment_name
  resource_group_name = dependency.resource_group.outputs.name
  location            = local.env.app_location
  tenant_id           = local.common.tenant_id

  web_app_principal_id = dependency.web_app.outputs.principal_id

  postgres_administrator_password = dependency.postgres.outputs.administrator_password
  storage_connection_string       = dependency.storage.outputs.primary_connection_string
  azure_openai_api_key            = dependency.openai.outputs.primary_access_key
}
