# macekai infra

Terraform + Terragrunt, adapted from a working sibling project (`asistentka`) — see `CLAUDE.md` for what was reused vs. built fresh. Covers `dev`/`staging`/`prod`, plus a `shared` unit for the container registry.

**Status:**
- [x] State storage bootstrap (step 2 below) — done 2026-08-10. Resource group `macekai-tfstate`, storage account `sttfstatemacekai`, container `tfstate`, blob versioning + 14-day soft-delete enabled. Subscription `02b1dc83-906b-4652-9a02-acce7d9a80c1`, tenant `169b8ff6-9bc7-43e8-8ad3-902fd6852f89` (`karel@macek.ai`) — **a different tenant than `asistentka`'s**, confirmed via `az account show`.
- [x] `common.hcl`'s `tenant_id` filled in with the real value above.
- [x] Entra app registration for Easy Auth (step 3) — done 2026-08-10. `macekai-app-backend`, appId `90756a5b-ac1f-439e-99ff-291df4f467d8`, sign-in audience `AzureADMyOrg`. `common.hcl`'s `easy_auth_client_id` filled in. All 3 redirect URIs added. Client secret generated and stored **locally only** at `~/.macekai/easy_auth_client_secret.txt` (chmod 600, not in this repo, not printed anywhere) — needed as `TF_VAR_easy_auth_client_secret` when `key_vault` is actually applied (step 6). Expires 2028-08-10 (2 years) — regenerate via `az ad app credential reset --id 90756a5b-ac1f-439e-99ff-291df4f467d8` before then.
- [ ] Everything else below (branches, GitHub OIDC, `terragrunt apply` bootstrap per environment, RBAC, GitHub Environments/secrets, first deploy, prod SWA import) — not done yet.

**This status list is the source of truth for what's actually live in Azure** — keep it updated as each step below actually gets done (see how `asistentka`'s `docs/infra.md` does the same, including recording *when* and *as which value* each step landed, not just a checkbox).

Note the state storage bootstrap itself (resource group + storage account + container) was created directly via `az` CLI, **not** via Terraform/Terragrunt — same as `asistentka`'s `sttfstateasistentka` — it's a chicken-and-egg dependency of Terraform itself and can never be a resource Terraform manages.

## Layout

```
infra/
  root.hcl            # generates the azurerm backend + provider for every component below
  live/
    common.hcl          # tenant_id, easy_auth_client_id — shared across all envs, currently placeholders
    dev/ staging/ prod/  # resource_group, storage, postgres, openai, key_vault, web_app, landing_swa
    shared/               # resource_group, acr — one registry for all environments
  modules/               # the Terraform modules each terragrunt.hcl above sources
```

## One-time manual setup (do in order)

Terraform/Terragrunt can't do these — they need elevated Entra/subscription permissions most CI identities (and even most human accounts) don't have by default.

1. **Log in to the right account/subscription.**
   ```bash
   az login
   az account set --subscription 02b1dc83-906b-4652-9a02-acce7d9a80c1
   az account show   # confirm subscriptionId matches
   ```

2. **Create the Terraform state storage account** (bootstrap dependency of Terraform itself — must exist before `terragrunt init` can use it).

   **Done** (2026-08-10):
   ```bash
   az group create --name macekai-tfstate --location germanywestcentral
   az storage account create \
     --name sttfstatemacekai \
     --resource-group macekai-tfstate \
     --sku Standard_LRS \
     --encryption-services blob \
     --min-tls-version TLS1_2
   az storage container create \
     --name tfstate \
     --account-name sttfstatemacekai \
     --auth-mode login
   az storage account blob-service-properties update \
     --account-name sttfstatemacekai \
     --resource-group macekai-tfstate \
     --enable-versioning true \
     --enable-delete-retention true \
     --delete-retention-days 14
   ```
   Blob versioning + 14-day soft-delete are on (state backend is a single point of failure for all three environments — see the plan's risk callouts).

3. **Entra app registration for Easy Auth**, and fill in `infra/live/common.hcl`.

   **Done** (2026-08-10):
   ```bash
   az ad app create --display-name macekai-app-backend --sign-in-audience AzureADMyOrg
   # -> appId 90756a5b-ac1f-439e-99ff-291df4f467d8, now in common.hcl as easy_auth_client_id

   az ad app update --id 90756a5b-ac1f-439e-99ff-291df4f467d8 \
     --web-redirect-uris \
       "https://app-macekai-dev.azurewebsites.net/.auth/login/aad/callback" \
       "https://app-macekai-staging.azurewebsites.net/.auth/login/aad/callback" \
       "https://app-macekai-prod.azurewebsites.net/.auth/login/aad/callback"

   # Client secret — captured directly into a local file, never printed to a
   # terminal/chat transcript. Regenerate the same way if it's ever lost:
   az ad app credential reset --id 90756a5b-ac1f-439e-99ff-291df4f467d8 \
     --display-name "easy-auth-bootstrap-2026-08-10" --years 2 \
     --query "password" -o tsv > ~/.macekai/easy_auth_client_secret.txt
   chmod 600 ~/.macekai/easy_auth_client_secret.txt
   ```
   Needed later as `TF_VAR_easy_auth_client_secret` when `key_vault` is applied (step 6) — e.g. `export TF_VAR_easy_auth_client_secret="$(cat ~/.macekai/easy_auth_client_secret.txt)"`.

   Note: `azureactivedirectory` as configured in the `web_app` module only allows sign-in from accounts in this tenant. If coaching clients ever need to log in with their own accounts, this app registration's sign-in audience and the module's `auth_settings_v2` need revisiting — not yet decided, see `CLAUDE.md`.

4. **Branches**: `main` already exists (currently deploys landing only). Create `dev` and `staging` off it.

5. **GitHub OIDC app registration for CI** — no client secret needed:
   ```bash
   az ad app create --display-name macekai-github
   ```
   Then federated credentials, one per environment (subject must exactly match `repo:<owner>/macekai:environment:<name>` — that string is only emitted when a workflow job declares `environment: <name>`, which `deploy_environments.yml`/`terraform_drift_check.yml` already do):
   ```bash
   az ad app federated-credential create --id <macekai-github appId> --parameters '{
     "name": "dev",
     "issuer": "https://token.actions.githubusercontent.com",
     "subject": "repo:<owner>/macekai:environment:dev",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   # repeat for staging, prod, shared
   ```

6. **Bootstrap apply, per environment** (dev first, then staging, then prod last — prod's `landing_swa` unit needs the import procedure below, do NOT plain-apply it):
   ```bash
   export TF_VAR_easy_auth_client_secret="<from step 3>"
   export TF_VAR_tavily_api_key=""   # optional, set if/when actually used

   cd infra/live/shared
   nohup terragrunt run --all -- apply --non-interactive > /tmp/shared-apply.log 2>&1 &
   disown
   # then, once shared/acr exists:
   cd ../dev
   nohup terragrunt run --all -- apply --non-interactive > /tmp/dev-apply.log 2>&1 &
   disown
   ```
   **Always background real applies** (`nohup ... & disown`), never wrap in a short timeout — a killed `apply` can leave an orphaned state lock and/or a resource created in Azure but not recorded in state. Recover with `terragrunt force-unlock -force <lock ID>` and `terragrunt import <resource address> <Azure resource ID>` for anything that exists in Azure but isn't in state, then re-apply to reconcile the rest.

   Apply order within an environment resolves automatically from the `dependency` blocks: `resource_group` → `storage`/`postgres`/`openai` → `web_app` → `key_vault`. `landing_swa` has no dependency on the others and can go any time (except prod — see below).

   **First-apply quirk**: the Web App's `app_settings` reference the Key Vault by name (a naming convention) before `key_vault` has actually run. The app will show unresolved Key Vault references and fail to start until `key_vault` applies and grants the Web App's managed identity access — resolves itself, or force it with `az webapp restart`.

7. **Role assignments for `macekai-github`**: `Contributor` on each resource group it deploys into (`macekai-dev`, `macekai-staging`, `macekai-prod`, `macekai-shared`), plus `AcrPush` on the shared ACR. Grant **both** `User Access Administrator` and `Key Vault Data Access Administrator` to whichever human account runs the bootstrap applies — `asistentka` lost multiple days to `User Access Administrator`'s ABAC condition not covering the `Key Vault Secrets User` role assignment `key_vault`'s module needs to create; `Key Vault Data Access Administrator` is unconditioned and covers it.

8. **GitHub Environments + repo secrets.** Create GitHub Environments named `dev`, `staging`, `prod`, `shared` (Settings → Environments — no secrets needed *in* them, they exist so the OIDC subject claim matches; add a required-reviewer protection rule on `prod`). Repo secrets (plain repo-level — the federated credential's subject is what scopes access): `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.

9. **First real deploy** — once app-backend/app-frontend have at least a minimal skeleton (see the plan's sequencing), push to `dev` and watch `deploy_environments.yml` succeed end to end before doing the same for `staging` and `main`.

## Importing prod's existing landing Static Web App

Landing already has a live, working Azure Static Web App on `macek.ai` — created outside Terraform. `infra/live/prod/landing_swa/terragrunt.hcl` has the full import procedure as an inline comment; do not `terragrunt apply` it before completing that procedure. Short version: capture the real config (`az staticwebapp show`), confirm/override the resource group name (it almost certainly isn't `macekai-prod`), `plan` before importing to sanity-check the module, import the SWA **and its custom domain binding separately**, `plan` again and require zero diff before ever applying.

## Day-to-day commands

```bash
# plan/apply a single component
cd infra/live/dev/web_app
terragrunt plan
terragrunt apply

# plan/apply everything in one environment
cd infra/live/dev
terragrunt run --all -- plan
terragrunt run --all -- apply
```

State: each `<environment>/<component>` pair gets its own state file in `sttfstatemacekai`'s `tfstate` container — no new bootstrap storage needed for new components, only new keys (derived automatically from the directory path).
