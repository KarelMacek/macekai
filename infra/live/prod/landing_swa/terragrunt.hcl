# DO NOT `terragrunt apply` THIS UNIT until the import procedure in
# infra/README.md has been completed:
#   1. Capture the existing SWA's current config: `az staticwebapp show ...`
#   2. Confirm resource_group_name below actually matches where that SWA
#      lives today — it almost certainly does NOT live in "macekai-prod"
#      (this repo's fresh naming convention), since it was created outside
#      Terraform before this infra/ existed. Override resource_group_name
#      with the real discovered name (a plain string, not the
#      dependency.resource_group.outputs.name below) if they differ.
#   3. `terragrunt plan` — sanity-check the module compiles, nothing applied.
#   4. `terragrunt import azurerm_static_web_app.swa <resource ID>`
#   5. `terragrunt import azurerm_static_web_app_custom_domain.domain[0] <resource ID>`
#      — a SEPARATE resource from the SWA itself; skipping this risks a later
#      apply trying to recreate the domain binding, forcing DNS
#      re-verification and real downtime on macek.ai.
#   6. `terragrunt plan` again — expect ZERO diff. If not, fix the Terraform
#      code to match reality; never apply to "reconcile."
#   7. Only then is it safe to treat this as adopted. Consider adding
#      `lifecycle { prevent_destroy = true }` to the static_web_app module's
#      resource afterward.

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
  resource_group_name = dependency.resource_group.outputs.name # TODO: verify/override — see warning above
  location            = dependency.resource_group.outputs.location
  app_name            = "landing"
  custom_domain       = local.env.landing_custom_domain
}
