# Root Terragrunt config, included by every live/<env>/<component>/terragrunt.hcl.
#
# Generates the azurerm backend and provider blocks so individual modules
# never hardcode them — state key is derived from each config's own path, so
# every environment/component pair gets its own state file automatically
# (staging/web_app.tfstate, dev/postgres.tfstate, shared/acr.tfstate, ...) in
# the same storage account.
#
# Adapted from the equivalent asistentka/infra/root.hcl. The state storage
# account itself (resource_group_name/storage_account_name below) is a
# bootstrap dependency of Terraform, not something Terraform manages — it
# must exist before `terragrunt init` can use it, created once via the Azure
# CLI. See infra/README.md for the bootstrap command.
#
# TODO before first use: confirm these names don't collide with anything
# already in the macek.ai subscription (storage account names are globally
# unique across all of Azure) and that this resource group is created.

remote_state {
  backend = "azurerm"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite"
  }
  config = {
    resource_group_name  = "macekai-tfstate"
    storage_account_name = "sttfstatemacekai"
    container_name       = "tfstate"
    key                  = "${path_relative_to_include()}.tfstate"
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents  = <<EOF
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "02b1dc83-906b-4652-9a02-acce7d9a80c1" # macek.ai subscription
}
EOF
}
