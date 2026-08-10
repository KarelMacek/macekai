# DO NOT `terragrunt apply` THIS UNIT until the import procedure in
# infra/README.md has been completed. All the fields below that don't come
# from local.env/dependency are OVERRIDES capturing the real, pre-existing
# resource's actual shape — confirmed via `az staticwebapp show --name
# macekai --resource-group macekai_group` on 2026-08-10:
#   - resource_group_name: "macekai_group", NOT this repo's "macekai-prod"
#     convention — the SWA predates this repo's resource groups entirely.
#   - location: "westus2", NOT the germanywestcentral/westeurope pattern
#     every other macekai resource uses.
#   - name: "macekai" (literal), NOT the swa-landing-prod naming convention
#     every other SWA in this repo will use.
#   - sku_tier: "Standard", NOT this module's own default of "Free".
#   - custom_domains: BOTH "macek.ai" and "www.macek.ai" are bound today —
#     not just the one apex domain.
#
# Import procedure:
#   1. (Done 2026-08-10) Captured the existing config above.
#   2. `terragrunt plan` — sanity-check the module compiles with these
#      overrides, nothing applied yet.
#   3. `terragrunt import azurerm_static_web_app.swa <resource ID>`
#      (resource ID: /subscriptions/02b1dc83-906b-4652-9a02-acce7d9a80c1/resourceGroups/macekai_group/providers/Microsoft.Web/staticSites/macekai)
#   4. `terragrunt import 'azurerm_static_web_app_custom_domain.domain["macek.ai"]' <resource ID>/customDomains/macek.ai`
#      `terragrunt import 'azurerm_static_web_app_custom_domain.domain["www.macek.ai"]' <resource ID>/customDomains/www.macek.ai`
#      — separate resources from the SWA itself; skipping this risks a later
#      apply trying to recreate the domain bindings, forcing DNS
#      re-verification and real downtime on macek.ai.
#   5. `terragrunt plan` again — expect ZERO diff. If not, fix the Terraform
#      code to match reality; never apply to "reconcile."
#   6. Only then is it safe to treat this as adopted. Consider adding
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

inputs = {
  project_name        = local.env.project_name
  environment_name    = local.env.environment_name
  resource_group_name = "macekai_group" # override — see warning above, NOT dependency.resource_group.outputs.name
  location            = "westus2"       # override — see warning above
  app_name            = "landing"
  name                = "macekai"  # override — see warning above
  sku_tier            = "Standard" # override — see warning above
  custom_domains      = ["macek.ai", "www.macek.ai"]
}
