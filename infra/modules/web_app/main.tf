# Serves both app-backend (Django) and app-frontend (React) from one
# container per environment — Django serves the built React SPA as static
# files (collectstatic), matching the asistentka pattern this was adapted
# from. Unlike that module, the shared ACR's credentials come in as plain
# variables (from a Terragrunt `dependency` on live/shared/acr) rather than a
# hardcoded `data.terraform_remote_state` lookup — macekai's ACR is a normal
# Terragrunt-managed module, not a historical non-Terragrunt exception.

variable "project_name" {
  type = string
}

variable "environment_name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "sku_name" {
  type    = string
  default = "B1"
}

variable "image_tag" {
  type        = string
  description = "Tag on the shared ACR to deploy, e.g. staging-latest, prod-latest."
}

variable "acr_login_server" {
  type = string
}

variable "acr_admin_username" {
  type = string
}

variable "acr_admin_password" {
  type      = string
  sensitive = true
}

# Not secret (a public OAuth client ID, visible in the browser's redirect
# regardless) and identical for every environment — set once in
# live/common.hcl rather than repeated per environment.
variable "google_client_id" {
  type = string
}

# Not secret — grants is_staff on login, see backend/auth/middleware.py.
variable "admin_email" {
  type    = string
  default = ""
}

variable "postgres_fqdn" {
  type = string
}

variable "postgres_database_name" {
  type = string
}

variable "postgres_administrator_login" {
  type = string
}

variable "storage_account_name" {
  type    = string
  default = ""
}

variable "azure_openai_endpoint" {
  type    = string
  default = ""
}

variable "azure_openai_deployment_name" {
  type    = string
  default = ""
}

# Not secret — where users with no diagnostics get sent to buy one. May be
# blank (the app shows a fallback message instead of a dead link).
variable "diagnostics_purchase_url" {
  type    = string
  default = ""
}

# Microsoft Graph sendMail (app-only auth) — see backend/graph_mail.py.
# tenant_id/client_id aren't secret (an Entra tenant/app id, not a
# credential); the client secret comes from Key Vault (kv_ref below), same
# split as google_client_id/GOOGLE_PROVIDER_AUTHENTICATION_SECRET.
variable "ms_graph_tenant_id" {
  type    = string
  default = ""
}

variable "ms_graph_client_id" {
  type    = string
  default = ""
}

variable "email_from_address" {
  type    = string
  default = "karel@macek.ai"
}

# Extra hostname to add to ALLOWED_HOSTS, e.g. "app.macek.ai". The actual
# custom-domain binding + TLS certificate on the App Service are NOT managed
# here — same pattern as prod's landing_swa (see infra/README.md): if a
# custom domain already exists on this Web App outside Terraform, this
# variable only makes Django accept the Host header, it doesn't create or
# touch the binding/cert. Bind the domain in Azure first, then set this.
variable "custom_domain" {
  type    = string
  default = ""
}

locals {
  web_app_name = "app-${var.project_name}-${var.environment_name}"

  allowed_hosts = join(",", compact([
    "${local.web_app_name}.azurewebsites.net",
    var.custom_domain,
  ]))

  # This module never receives raw secret values — only this vault's name
  # (pure naming convention, no Terraform dependency needed) to build Key
  # Vault reference strings. The Web App's own managed identity resolves
  # them at boot; see infra/modules/key_vault, which is granted access to
  # this same vault via that identity's principal_id.
  key_vault_name = "kv-${var.project_name}-${var.environment_name}"

  kv_ref = {
    for secret_name in [
      "secret-key",
      "google-client-secret",
      "postgres-admin-password",
      "storage-connection-string",
      "azure-openai-api-key",
      "tavily-api-key",
      "simpleshop-webhook-secret",
      "ms-graph-client-secret",
    ] : secret_name => "@Microsoft.KeyVault(VaultName=${local.key_vault_name};SecretName=${secret_name})"
  }
}

resource "azurerm_service_plan" "asp" {
  name                = "asp-${var.project_name}-${var.environment_name}"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = var.sku_name
}

resource "azurerm_linux_web_app" "app" {
  name                = local.web_app_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.asp.id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = true
    application_stack {
      docker_image_name        = "${var.project_name}:${var.image_tag}"
      docker_registry_url      = "https://${var.acr_login_server}"
      docker_registry_username = var.acr_admin_username
      docker_registry_password = var.acr_admin_password
    }
  }

  logs {
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  app_settings = {
    # DJANGO_SETTINGS_MODULE is not set here on purpose — manage.py/wsgi.py
    # should default it via os.environ.setdefault() once app-backend exists,
    # identical for every environment, so the codebase owns this one.
    #
    # TODO once app-backend's actual Django settings.py exists: reconcile
    # this list against what it really reads (names below are placeholders
    # copied from a sibling project's convention, not yet verified against
    # macekai's own code).
    "SECRET_KEY"        = local.kv_ref["secret-key"]
    "DEBUG"             = "False"
    "ALLOWED_HOSTS"     = local.allowed_hosts
    "EASY_AUTH_ENABLED" = "True"

    "GOOGLE_PROVIDER_AUTHENTICATION_SECRET" = local.kv_ref["google-client-secret"]
    "ADMIN_EMAIL"                           = var.admin_email

    "POSTGRES_DB"       = var.postgres_database_name
    "POSTGRES_USER"     = var.postgres_administrator_login
    "POSTGRES_PASSWORD" = local.kv_ref["postgres-admin-password"]
    "POSTGRES_HOST"     = var.postgres_fqdn
    "POSTGRES_PORT"     = "5432"
    "POSTGRES_SSLMODE"  = "require"

    "AZURE_STORAGE_ACCOUNT_NAME"      = var.storage_account_name
    "AZURE_STORAGE_CONNECTION_STRING" = local.kv_ref["storage-connection-string"]

    "AZURE_OPENAI_ENDPOINT"   = var.azure_openai_endpoint
    "AZURE_OPENAI_DEPLOYMENT" = var.azure_openai_deployment_name
    "AZURE_OPENAI_API_KEY"    = local.kv_ref["azure-openai-api-key"]

    "TAVILY_API_KEY" = local.kv_ref["tavily-api-key"]

    "SIMPLESHOP_WEBHOOK_SECRET" = local.kv_ref["simpleshop-webhook-secret"]
    "DIAGNOSTICS_PURCHASE_URL"  = var.diagnostics_purchase_url

    "MS_GRAPH_TENANT_ID"     = var.ms_graph_tenant_id
    "MS_GRAPH_CLIENT_ID"     = var.ms_graph_client_id
    "MS_GRAPH_CLIENT_SECRET" = local.kv_ref["ms-graph-client-secret"]
    "EMAIL_FROM_ADDRESS"     = var.email_from_address
  }

  auth_settings_v2 {
    auth_enabled           = true
    runtime_version        = "~2"
    require_authentication = true
    require_https          = true
    unauthenticated_action = "RedirectToLoginPage"
    default_provider       = "google"

    # Google is the ONLY auth provider in this system, by explicit choice —
    # no Microsoft/Entra fallback. Login: /.auth/login/google
    # (post_login_redirect_uri=/ query param sends the user back to the SPA).
    excluded_paths = [
      # Both with and without the trailing slash — App Service's excluded_paths
      # matching turned out to be exact, not prefix, when checked against
      # the real deployed dev app (2026-08-10): /healthz/ (Django's actual
      # route, via urls.py's path('healthz/', ...)) still 401'd with only
      # "/healthz" (no slash) listed here.
      "/healthz",
      "/healthz/",
      "/health/",
      "/static/*",
      "/signed-out",
      # SimpleShop.cz's payment webhook (assessments/webhooks.py) — external,
      # unauthenticated caller with no Google session. The secret is the
      # <token> path segment itself, checked in Django
      # (constant_time_compare against SIMPLESHOP_WEBHOOK_SECRET), not by
      # Azure — this exclusion is what lets that check ever run instead of
      # Azure's edge 401ing the request first. Wildcard, not the literal
      # secret, so rotating the secret doesn't require a Terraform change.
      "/api/webhooks/*",
    ]

    google_v2 {
      client_id                  = var.google_client_id
      client_secret_setting_name = "GOOGLE_PROVIDER_AUTHENTICATION_SECRET"
    }

    login {
      token_store_enabled = false
    }
  }

  # The deploy workflow pins the running image to an immutable sha tag on
  # every deploy (see .github/workflows/deploy_environments.yml), permanently
  # diverging from var.image_tag's mutable tag declared here — expected, not
  # drift.
  lifecycle {
    ignore_changes = [
      site_config[0].application_stack[0].docker_image_name,
      app_settings["DOCKER_CUSTOM_IMAGE_NAME"],
    ]
  }
}

output "webapp_url" {
  value = "https://${azurerm_linux_web_app.app.default_hostname}"
}

output "webapp_name" {
  value = azurerm_linux_web_app.app.name
}

output "principal_id" {
  value = azurerm_linux_web_app.app.identity[0].principal_id
}
