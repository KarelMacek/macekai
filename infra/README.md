# macekai infra

Terraform + Terragrunt, adapted from a working sibling project (`asistentka`) — see `CLAUDE.md` for what was reused vs. built fresh. Covers `dev`/`staging`/`prod`, plus a `shared` unit for the container registry.

**Status:**
- [x] State storage bootstrap (step 2 below) — done 2026-08-10. Resource group `macekai-tfstate`, storage account `sttfstatemacekai`, container `tfstate`, blob versioning + 14-day soft-delete enabled. Subscription `02b1dc83-906b-4652-9a02-acce7d9a80c1`, tenant `169b8ff6-9bc7-43e8-8ad3-902fd6852f89` (`karel@macek.ai`) — **a different tenant than `asistentka`'s**, confirmed via `az account show`.
- [x] `common.hcl`'s `tenant_id` filled in with the real value above.
- [x] ~~Entra app registration for Easy Auth~~ — done 2026-08-10, then **superseded same day**: Google is now the only auth provider (explicit decision), Microsoft/Entra fully removed from `web_app`'s `auth_settings_v2`. The Entra app registration (`macekai-app-backend`, appId `90756a5b-ac1f-439e-99ff-291df4f467d8`) is unused/vestigial, safe to delete later.
- [x] Google OAuth client for Easy Auth (step 3, revised) — done 2026-08-10. Created via Google Cloud Console, project "MacekAI", client `macekai-app-backend`. `common.hcl`'s `google_client_id` filled in with the real value; secret stored locally at `~/.macekai/google_client_secret.txt` (never in chat/repo). `dev/web_app` and `dev/key_vault` re-applied (in-place update, no resource recreation) and verified: `GET /.auth/login/google` returns a 302 to `accounts.google.com/o/oauth2/v2/auth` with the correct `client_id`/`redirect_uri`/`scope=openid+profile+email`. `staging`/`prod` still need the same re-apply once those environments' `web_app`/`key_vault` exist.

  **Gotcha hit along the way**: right after `key_vault` created the new `google-client-secret` (renamed from `easy-auth-client-secret`), the `/.auth/login/google/callback` step 500'd — App Service's Key Vault reference for `GOOGLE_PROVIDER_AUTHENTICATION_SECRET` was stuck reporting `SecretNotFound` (checkable via `az rest --method get --url ".../config/configreferences/appsettings?api-version=2022-03-01"`) even though the secret genuinely existed and RBAC was correct. A plain `az webapp restart` did **not** clear it — needed a full `az webapp stop` + `az webapp start` (not just restart) plus about a minute's wait before the reference actually re-resolved. Worth checking that endpoint first if a Key Vault-backed app setting seems to be causing 500s right after a secret rename/rotation.
- [x] **Google sign-in verified end-to-end in a real browser** — done 2026-08-10. After a real Google login, the app kept showing "Not signed in" (`/api/whoami/` → 401) despite a valid `AppServiceAuthSession` cookie. Root cause: Azure Easy Auth normalizes Google's OIDC claims into legacy WS-Identity claim types rather than passing through `sub` — the object id actually arrives as `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier`. Confirmed by temporarily logging the raw decoded claim list at WARNING level and tailing `az webapp log tail` while re-firing an authenticated request. Fixed `_OID_TYPES` in `app-backend/backend/auth/easy_auth.py` to check that claim type first (kept `sub`/`oid` as fallbacks for a possible future AAD provider). Also fixed, spotted in the same log tail: Azure's internal container warm-up probe hits with `Host: 169.254.x.x:8000` (a link-local/APIPA address, never internet-routable), which Django's `ALLOWED_HOSTS` rejected as `DisallowedHost` — added `backend/auth/host_middleware.py` (`AzureInternalProbeHostMiddleware`, first in `MIDDLEWARE`) to normalize that specific range before Django's host check runs. Both fixes built and pushed to ACR as `dev-latest` directly (`docker build` + `docker push` + `az webapp restart`, bypassing CI for faster iteration during debugging) and verified live: `curl -b "$SESSION_COOKIE" .../api/whoami/` now returns `{"is_authenticated": true, "username": "kaja.macek@gmail.com", ...}` with HTTP 200. Still need to commit these two files and let the next real `dev` push go through CI normally. `staging`/`prod` will pick up the fix automatically once their `web_app` exists and gets a deploy, since it's app code, not infra.
- [x] `entry_service` merged into `main` via [PR #19](https://github.com/KarelMacek/macekai/pull/19) — done 2026-08-10. Caught and fixed a real bug in the process: `pnpm/action-setup@v4` errors when both its `version:` input and `package.json`'s `packageManager` conflict, even when they agree — the SWA workflow now lets `packageManager` be the only source.
- [x] **Incident, same day**: that merge's deploy returned HTTP 200 with the correct `<title>` (what got checked at the time) but was actually serving the **raw unbuilt** `landing/index.html` (`<script src="/src/main.tsx">`, which browsers can't execute — blank page). Root cause: `Azure/static-web-apps-deploy@v1` with `skip_app_build: true` uploads `app_location` verbatim, it does **not** join `app_location`+`output_location` the way it does during its own build. Only caught later while verifying `dev`'s SWA visually in a browser (curl-only checks miss this — 200 + right title, wrong body). Fixed by pointing `app_location` directly at the built output (`landing/dist/public`) and leaving `output_location` empty, pushed straight to `main` (no PR) given live production impact. Re-verified after: `curl https://macek.ai/ | grep script` now shows the real hashed `/assets/*.js` bundle, not the source reference.
- [x] Branches (step 4) — done 2026-08-10. `dev` and `staging` created off the now-current `main` and pushed.
- [x] GitHub OIDC app registration + federated credentials (step 5) — done 2026-08-10.
- [x] GitHub Environments + repo secrets (step 8) — done 2026-08-10, including a required-reviewer rule on `prod`.
- [x] **Prerequisite** resource groups + shared ACR (step 6, partial — NOT the full per-environment fleet) — done 2026-08-10. `macekai-dev`, `macekai-staging`, `macekai-prod`, `macekai-shared` resource groups + `acrmacekai` (Basic) all created via `terragrunt apply`, applied in parallel, all confirmed via `az group list`/`az acr list`. Postgres/App Service/Key Vault/OpenAI for each environment are **still unapplied** — that's the deliberately-deferred "massive deploy," pending explicit go-ahead.
- [x] RBAC role assignments (step 7) — done 2026-08-10.
- [x] **Discovered and documented (not executed)** the prod landing SWA import facts — see "Importing prod's existing landing Static Web App" below. `macekai_group` (the resource group holding it) was left completely untouched, per explicit instruction — no `terragrunt plan`/`import`/apply has touched it.
- [x] **`dev` environment fully live** — done 2026-08-10. `postgres`, `openai` (Cognitive Account only, model deployment skipped — zero TPM quota on this fresh subscription, see the `openai` module's `deploy_model` toggle), `web_app`, `key_vault`, `landing_swa` all applied for `dev`. `app-backend`/`app-frontend` hello-world skeleton built (Django + React, Easy Auth reused near-verbatim from `asistentka`), containerized, deployed via `deploy_environments.yml` to `app-macekai-dev`. New `azure-static-web-apps-dev.yml` deploys `landing` to the dev SWA. Verified: dev SWA serves landing (200, correct bundle); `app-macekai-dev.azurewebsites.net/healthz/` returns 200 without auth; `/` returns a 401 Easy Auth challenge naming the correct tenant + app registration; the same code's full dev-login → whoami cycle already verified locally against real Postgres via `docker compose`. Interactive Microsoft-login-in-a-real-browser is the one thing not verified here (no browser access) — worth a manual click-through.
- [x] **Staging/prod's per-environment fleet** (`postgres`/`web_app`/`key_vault`/`openai`) — still not applied, only `dev`'s was, per the explicit scope of this pass.
- [ ] The actual prod SWA import (plan/import/verify steps) — documented, not executed.
- [ ] **Post-purchase instructions email** (2026-08-17) — the SimpleShop webhook now sends the buyer a login/next-steps email via Microsoft Graph `sendMail` (app-only auth, `app-backend/backend/graph_mail.py` + `assessments/emailing.py`), since SimpleShop's own post-payment browser redirect alone isn't reliable enough. `key_vault`/`web_app` Terraform modules gained `ms_graph_client_secret`/`ms_graph_tenant_id`/`ms_graph_client_id`/`email_from_address`, same pattern as the existing Google/Tavily secrets. **Not yet live in any environment** — needs the one-time Entra app registration + `Mail.Send` admin consent (not something Terraform can do) documented in `app-backend/docs/post-purchase-email.md`, then `common.hcl`'s `ms_graph_client_id` filled in and `TF_VAR_ms_graph_client_secret` set for whichever environment's `key_vault` gets (re-)applied. Until then the webhook still opens the `Diagnostics` row correctly — the email send fails, gets caught and logged, and doesn't block the webhook response.

**This status list is the source of truth for what's actually live in Azure** — keep it updated as each step below actually gets done (see how `asistentka`'s `docs/infra.md` does the same, including recording *when* and *as which value* each step landed, not just a checkbox).

Note the state storage bootstrap itself (resource group + storage account + container) was created directly via `az` CLI, **not** via Terraform/Terragrunt — same as `asistentka`'s `sttfstateasistentka` — it's a chicken-and-egg dependency of Terraform itself and can never be a resource Terraform manages.

## Layout

```
infra/
  root.hcl            # generates the azurerm backend + provider for every component below
  live/
    common.hcl          # tenant_id (for Key Vault's own resource field), google_client_id — shared across all envs
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

3. **Google OAuth client for Easy Auth**, and fill in `infra/live/common.hcl`.

   **Superseded 2026-08-10**: originally built with Microsoft/Entra (`macekai-app-backend`, appId `90756a5b-ac1f-439e-99ff-291df4f467d8`) — per explicit decision, **Google is now the only auth provider**, Microsoft/Entra is fully removed from `web_app`'s `auth_settings_v2`. That Entra app registration is now unused/vestigial; harmless to leave, safe to delete later if you want to tidy up (`az ad app delete --id 90756a5b-ac1f-439e-99ff-291df4f467d8`).

   Azure App Service's Easy Auth has a native Google provider (`google_v2` in `auth_settings_v2`) — same mechanism as the old Microsoft one, just a different upstream identity provider. This can't be created via `az` CLI or `gcloud` (not installed here) — it's a manual step in the Google Cloud Console:

   1. [console.cloud.google.com](https://console.cloud.google.com/) → create or select a project (e.g. "macekai").
   2. **APIs & Services → OAuth consent screen** (if not already configured): User type **External**, app name "macekai", your email as support/developer contact.
   3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
      - Application type: **Web application**
      - Name: `macekai-app-backend` (or similar)
      - Authorized redirect URIs — one per environment as its Web App exists:
        - `https://app-macekai-dev.azurewebsites.net/.auth/login/google/callback`
        - `https://app-macekai-staging.azurewebsites.net/.auth/login/google/callback`
        - `https://app-macekai-prod.azurewebsites.net/.auth/login/google/callback`
   4. Copy the **Client ID** into `infra/live/common.hcl`'s `google_client_id` (not secret, fine to commit).
   5. Save the **Client Secret** the same way the old Easy Auth secret was handled — never pasted into a terminal/chat transcript:
      ```bash
      echo -n "<paste the Client Secret here in your own terminal, not via Claude>" > ~/.macekai/google_client_secret.txt
      chmod 600 ~/.macekai/google_client_secret.txt
      ```
   Needed later as `TF_VAR_google_client_secret` when `key_vault` is applied — e.g. `export TF_VAR_google_client_secret="$(cat ~/.macekai/google_client_secret.txt)"`.

4. **Branches**: `main` already exists (currently deploys landing only). Create `dev` and `staging` off it.

   **Done** (2026-08-10): both created off `main` (post-merge of the monorepo restructuring, see status above) and pushed.

5. **GitHub OIDC app registration for CI** — no client secret needed.

   **Done** (2026-08-10):
   ```bash
   az ad app create --display-name macekai-github
   # -> appId 9aaf7160-f90a-41ab-a549-f66a33caf6c0

   az ad sp create --id 9aaf7160-f90a-41ab-a549-f66a33caf6c0
   # -> service principal object id 8acfa926-11c6-4212-b42f-465c98385f46 — needed as the
   # principal for role assignments in step 7, an app registration alone can't hold roles

   for env in dev staging prod shared; do
     az ad app federated-credential create --id 9aaf7160-f90a-41ab-a549-f66a33caf6c0 --parameters "{
       \"name\": \"$env\",
       \"issuer\": \"https://token.actions.githubusercontent.com\",
       \"subject\": \"repo:KarelMacek/macekai:environment:$env\",
       \"audiences\": [\"api://AzureADTokenExchange\"]
     }"
   done
   ```
   All 4 federated credentials created (subject must exactly match `repo:<owner>/macekai:environment:<name>` — that string is only emitted when a workflow job declares `environment: <name>`, which `deploy_environments.yml`/`terraform_drift_check.yml` already do).

6. **Bootstrap apply, per environment** (dev first, then staging, then prod last — prod's `landing_swa` unit needs the import procedure below, do NOT plain-apply it).

   **Partially done** (2026-08-10) — only the lightweight prerequisite pieces RBAC needed to exist:
   ```bash
   cd infra/live/shared/resource_group && terragrunt apply -auto-approve
   cd ../acr && terragrunt apply -auto-approve
   cd ../../dev/resource_group && terragrunt apply -auto-approve
   cd ../../staging/resource_group && terragrunt apply -auto-approve
   cd ../../prod/resource_group && terragrunt apply -auto-approve
   ```
   Created: `macekai-shared`, `macekai-dev`, `macekai-staging`, `macekai-prod` (resource groups), `acrmacekai` (Basic ACR). These ran individually in the background, not via `run --all` — fine for independent leaf resources like this, but `run --all` is still the right call for a real multi-component environment apply (respects `dependency` ordering automatically).

   **Still NOT done** (the actual "massive deploy," deliberately deferred): `postgres`, `web_app`, `key_vault`, `openai` for `dev`/`staging`/`prod`. When ready:
   ```bash
   export TF_VAR_google_client_secret="$(cat ~/.macekai/google_client_secret.txt)"
   export TF_VAR_tavily_api_key=""   # optional, set if/when actually used

   cd infra/live/dev
   nohup terragrunt run --all -- apply --non-interactive > /tmp/dev-apply.log 2>&1 &
   disown
   ```
   **Always background real applies** (`nohup ... & disown`, or the Bash tool's own background mode), never wrap in a short timeout — a killed `apply` can leave an orphaned state lock and/or a resource created in Azure but not recorded in state. Recover with `terragrunt force-unlock -force <lock ID>` and `terragrunt import <resource address> <Azure resource ID>` for anything that exists in Azure but isn't in state, then re-apply to reconcile the rest.

   Apply order within an environment resolves automatically from the `dependency` blocks: `resource_group` → `storage`/`postgres`/`openai` → `web_app` → `key_vault`. `landing_swa` has no dependency on the others and can go any time (except prod — see below). Also note: this environment's `resource_group` is already applied (step 6 above), so `run --all` here will show it as a no-op and proceed straight to the rest.

   **First-apply quirk**: the Web App's `app_settings` reference the Key Vault by name (a naming convention) before `key_vault` has actually run. The app will show unresolved Key Vault references and fail to start until `key_vault` applies and grants the Web App's managed identity access — resolves itself, or force it with `az webapp restart`.

7. **Role assignments for `macekai-github`**: `Contributor` on each resource group it deploys into (`macekai-dev`, `macekai-staging`, `macekai-prod`, `macekai-shared`), plus `AcrPush` on the shared ACR. Grant **all three** of `User Access Administrator`, `Key Vault Data Access Administrator`, and `Key Vault Secrets Officer` to whichever human account runs the bootstrap applies:
   - `User Access Administrator` — general role-assignment permission, but has an ABAC condition that specifically **excludes** Key Vault role assignments (the same gap `asistentka` lost multiple days to).
   - `Key Vault Data Access Administrator` — unconditioned, covers *assigning* Key Vault roles to others (e.g. granting the Web App's managed identity `Key Vault Secrets User`).
   - `Key Vault Secrets Officer` — **a distinct, easy-to-miss third role**: a *data-plane* role letting the caller actually read/write secret *values* itself. Without it, `terraform apply` for `key_vault` fails with `403 Forbidden ... Action: Microsoft.KeyVault/vaults/secrets/getSecret/action` even with both roles above granted — discovered the hard way applying `dev/key_vault` on 2026-08-10, not something `asistentka`'s own docs called out explicitly.

   RBAC changes can take a minute or two to actually propagate — if a fresh grant still 403s, wait and retry before assuming something's wrong.

   **Done** (2026-08-10):
   ```bash
   SP_ID="8acfa926-11c6-4212-b42f-465c98385f46"   # macekai-github's service principal (NOT its appId — role assignments need the SP)
   MY_ID="5461202f-6ab0-482f-b23c-058c3b805cdc"   # karel@macek.ai's own object id, from `az ad signed-in-user show`
   SUB="02b1dc83-906b-4652-9a02-acce7d9a80c1"

   az role assignment create --assignee-object-id "$SP_ID" --assignee-principal-type ServicePrincipal \
     --role "AcrPush" --scope "/subscriptions/$SUB/resourceGroups/macekai-shared/providers/Microsoft.ContainerRegistry/registries/acrmacekai"

   for rg in macekai-dev macekai-staging macekai-prod macekai-shared; do
     az role assignment create --assignee-object-id "$SP_ID" --assignee-principal-type ServicePrincipal \
       --role "Contributor" --scope "/subscriptions/$SUB/resourceGroups/$rg"
     az role assignment create --assignee-object-id "$MY_ID" --assignee-principal-type User \
       --role "User Access Administrator" --scope "/subscriptions/$SUB/resourceGroups/$rg"
     az role assignment create --assignee-object-id "$MY_ID" --assignee-principal-type User \
       --role "Key Vault Data Access Administrator" --scope "/subscriptions/$SUB/resourceGroups/$rg"
   done
   ```
   **Verification gotcha hit while doing this**: `az role assignment list --assignee <id>` returned empty immediately after creation even though `create` succeeded — Graph-backed assignee lookup lags behind the RBAC write. `az role assignment list --scope <resource-id>` is reliable immediately; use that to verify, not `--assignee`.

8. **GitHub Environments + repo secrets.** Create GitHub Environments named `dev`, `staging`, `prod`, `shared` (Settings → Environments — no secrets needed *in* them, they exist so the OIDC subject claim matches; add a required-reviewer protection rule on `prod`). Repo secrets (plain repo-level — the federated credential's subject is what scopes access): `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.

   **Done** (2026-08-10, done before step 6/7 — order doesn't matter, this just needed to happen before any CI workflow run could authenticate):
   ```bash
   gh api --method PUT repos/KarelMacek/macekai/environments/dev
   gh api --method PUT repos/KarelMacek/macekai/environments/staging
   gh api --method PUT repos/KarelMacek/macekai/environments/prod    # already existed — auto-created by the first (expected-to-fail) deploy_environments.yml run after the merge to main
   gh api --method PUT repos/KarelMacek/macekai/environments/shared

   echo '{"reviewers":[{"type":"User","id":22668000}],"wait_timer":0}' \
     | gh api --method PUT repos/KarelMacek/macekai/environments/prod --input -

   gh secret set AZURE_CLIENT_ID --body "9aaf7160-f90a-41ab-a549-f66a33caf6c0"
   gh secret set AZURE_TENANT_ID --body "169b8ff6-9bc7-43e8-8ad3-902fd6852f89"
   gh secret set AZURE_SUBSCRIPTION_ID --body "02b1dc83-906b-4652-9a02-acce7d9a80c1"
   ```

9. **First real deploy** — once app-backend/app-frontend have at least a minimal skeleton (see the plan's sequencing), push to `dev` and watch `deploy_environments.yml` succeed end to end before doing the same for `staging` and `main`.

## Importing prod's existing landing Static Web App

Landing already has a live, working Azure Static Web App on `macek.ai` — created outside Terraform. `infra/live/prod/landing_swa/terragrunt.hcl` has the full import procedure as an inline comment; do not `terragrunt apply`, `plan`, or `import` it without explicit go-ahead — **`macekai_group` (the resource group holding it) has not been touched by Terraform/Terragrunt in any way**, and should stay that way until deliberately decided otherwise.

**Facts confirmed 2026-08-10** via `az staticwebapp show --name macekai --resource-group macekai_group` (a read-only lookup, no state changed):
- Resource ID: `/subscriptions/02b1dc83-906b-4652-9a02-acce7d9a80c1/resourceGroups/macekai_group/providers/Microsoft.Web/staticSites/macekai`
- Resource group `macekai_group`, name `macekai` — neither follows this repo's naming convention (predates it entirely)
- Location `westus2` — not the germanywestcentral/westeurope pattern every other macekai resource uses
- SKU `Standard` — not this module's own default of `Free`
- **Two** custom domains bound: `macek.ai` and `www.macek.ai`
- Deployed via the GitHub-integrated flow (`provider: GitHub`, tied to `KarelMacek/macekai` on branch `main`) — same idiom the existing SWA workflow already uses

The `static_web_app` Terraform module and `prod/landing_swa/terragrunt.hcl` were updated to model these facts accurately (module gained `name` and `custom_domains` [list] override variables) — **as local file edits only**, no Terraform/Terragrunt command has run against this resource. When ready to actually import: `terragrunt plan` first (sanity-check only, applies nothing), then `terragrunt import azurerm_static_web_app.swa <resource ID>` and `terragrunt import 'azurerm_static_web_app_custom_domain.domain["macek.ai"]' <resource ID>/customDomains/macek.ai` (and same for `www.macek.ai`) as two separate imports, then `plan` again and require zero diff before ever applying. Full detail in the terragrunt.hcl file's inline comment.

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
