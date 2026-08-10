include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl")).locals
}

terraform {
  source = "${get_repo_root()}/infra/modules/resource_group"
}

inputs = {
  project_name     = local.env.project_name
  environment_name = local.env.environment_name
  location         = local.env.rg_location
}
