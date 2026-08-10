locals {
  project_name     = "macekai"
  environment_name = "staging"

  rg_location  = "germanywestcentral" # TODO: verify these regions in the macek.ai subscription — copied from asistentka, not yet confirmed for this subscription's quota/availability
  app_location = "westeurope"

  web_app_sku  = "B1"
  postgres_sku = "B_Standard_B1ms"

  # image tag pushed by the deploy workflow on every push to the `staging` branch
  image_tag = "staging-latest"

  openai_deployment_name = "gpt-5.1"
  openai_model_name      = "gpt-5.1"
  openai_model_version   = "2025-11-13"
}
