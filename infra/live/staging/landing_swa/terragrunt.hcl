include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl")).locals
}

terraform {
  source = "${get_repo_root()}/infra/modules/static_web_app"
}

dependency "resource_group" {
  config_path = "../resource_group"

  mock_outputs = {
    name     = "mock-rg"
    location = "westeurope"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

inputs = {
  project_name        = local.env.project_name
  environment_name    = local.env.environment_name
  resource_group_name = dependency.resource_group.outputs.name
  location            = dependency.resource_group.outputs.location
  app_name            = "landing"
  # No custom_domain here — staging doesn't have a DNS subdomain set up yet.
  # Add one (e.g. "staging.macek.ai") once the CNAME/TXT records exist at the
  # external DNS provider — see infra/README.md.
}
