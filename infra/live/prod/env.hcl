locals {
  project_name     = "macekai"
  environment_name = "prod"

  rg_location  = "germanywestcentral" # TODO: verify these regions in the macek.ai subscription — copied from asistentka, not yet confirmed for this subscription's quota/availability
  app_location = "westeurope"

  web_app_sku  = "B1" # single instance, no autoscale yet — revisit once there's real traffic/revenue to justify it
  postgres_sku = "B_Standard_B1ms"

  # image tag pushed by the deploy workflow on every push to `main`
  image_tag = "prod-latest"

  openai_deployment_name = "gpt-5.1"
  openai_model_name      = "gpt-5.1"
  openai_model_version   = "2025-11-13"

  # Bound to landing_swa's custom_domain input. Landing's SWA already exists
  # live in Azure with this domain bound today — the landing_swa unit here
  # is for IMPORTING that resource, not creating a new one. Do not
  # `terragrunt apply` prod/landing_swa until the import + zero-diff-plan
  # procedure in infra/README.md is done.
  landing_custom_domain = "macek.ai"
}
