locals {
  project_name = "macekai"

  # "shared" isn't a deploy environment — it's where cross-environment
  # resources (currently just the ACR) live, one resource group, not one per env.
  environment_name = "shared"

  rg_location = "germanywestcentral" # TODO: verify in the macek.ai subscription
}
