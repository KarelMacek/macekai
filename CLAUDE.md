# macekai — monorepo conventions

This repo is a monorepo for Karel Macek's career/AI coaching brand. It covers five areas, each a **domain-named top-level folder** — not a generic `apps/`+`packages/` (Nx/Turborepo-style) layout:

- `landing/` — the marketing/coaching landing page.
- `app-frontend/` + `app-backend/` — the product app (Django API + its own React frontend, bundled into one container). Currently a hello-world skeleton with Easy Auth wired end-to-end — real features not built yet.
- `marketing/` — ongoing campaign content and the scripts that generate it.
- `webinars/` — webinar planning docs and per-deck slide apps.
- `blog/` — future, not built yet.
- `infra/` — Terraform + Terragrunt for dev/staging/prod, adapted from a sibling project (`asistentka`). `dev` is fully live; `staging`/`prod` have only the lightweight prerequisites applied (resource groups, shared ACR) — see `infra/README.md`.

## JS/TS tooling: one pnpm workspace

All JS/TS packages share a single pnpm workspace (`pnpm-workspace.yaml`) and one root `pnpm-lock.yaml`. Current packages:

- `landing` (`landing/`)
- `app-frontend` (`app-frontend/`)
- `webinar-cameo-spike` (`webinars/2026-08-22 brain and career nemensis/cameo-spike/`)

Commands: `pnpm install` at repo root installs everything; run a package's own scripts with `pnpm --filter <package-name> <script>` (e.g. `pnpm --filter landing dev`, `pnpm --filter webinar-cameo-spike test`). Packages are free to diverge in dependency versions (e.g. `webinar-cameo-spike` runs a newer Vite/TS/ESLint/Vitest than `landing`) — pnpm resolves each package's tree independently, so this is not a problem to "fix."

**Important**: `pnpm.overrides` and `pnpm.patchedDependencies` (e.g. the `wouter` patch) only take effect when declared in the **workspace root** `package.json`, not in an individual package's `package.json`. If a patch or override stops applying, check it's still at the root.

`marketing/` is a plain Python/Pillow content-generation pipeline (`marketing/scripts/`) — it is **not** part of the pnpm workspace and has no `package.json`.

New webinar decks: add their path explicitly to `pnpm-workspace.yaml`'s `packages:` list (webinar folder names contain spaces/dates and hold non-package planning docs, so an explicit path is used instead of a glob).

## Deployment

- `landing/` deploys to **Azure Static Web Apps** via `.github/workflows/azure-static-web-apps-icy-beach-0ba33b71e.yml` (prod, push/PR to `main`) and `.github/workflows/azure-static-web-apps-dev.yml` (dev, push/PR to `dev`; `staging` doesn't have one yet). Both explicitly run `pnpm install && pnpm --filter landing build` and pass `skip_app_build: true`.
  **Critical gotcha, hit live on 2026-08-10**: with `skip_app_build: true`, `Azure/static-web-apps-deploy@v1` uploads `app_location` **verbatim** — it does *not* join `app_location`+`output_location` the way it does during its own build. `app_location: "landing"` + `output_location: "dist/public"` silently deployed the *raw unbuilt* `landing/index.html` (200 OK, correct `<title>`, but a blank page — `<script src="/src/main.tsx">` isn't valid browser JS) to **both dev and prod** before this was caught. The fix: `app_location` must point directly at the built output (`"landing/dist/public"`), `output_location` stays `""`. If you ever touch these workflows, verify with more than `curl | grep title` — check the actual `<script src>` tag resolves to a hashed `/assets/*.js` file, not a `.tsx` source path.
- `app-backend`/`app-frontend` deploy together as **one Docker container per environment** to **Azure App Service**, via `.github/workflows/deploy_environments.yml`. Live and working for `dev` (`app-macekai-dev.azurewebsites.net`).

## Infra (Terraform + Terragrunt) — `infra/`

Adapted from a working sibling project, `asistentka` (`/home/karel/projects/asistentka`), reused as closely as possible rather than designed fresh. `dev` is fully applied and live; `staging`/`prod` only have the lightweight prerequisites (resource group, shared ACR read) applied so far. See `infra/README.md` for exact status/commands — it's the running source of truth, keep it updated as things change.

- **Layout**: `infra/root.hcl` (backend+provider generation, per-component state keys) + `infra/live/{dev,staging,prod,shared}/<component>/terragrunt.hcl` + `infra/modules/<component>/main.tf`. One shared remote state storage account (`sttfstatemacekai`), one state file per environment×component pair.
- **Components per environment**: `resource_group`, `storage`, `postgres` (Flexible Server, public+firewall, no VNet), `openai` (Azure OpenAI — Cognitive Account only by default, `deploy_model` variable gates the actual model deployment off since this subscription starts with zero approved TPM quota), `key_vault` (RBAC, Web App reads secrets via managed identity + Key Vault references), `web_app` (Linux App Service, container-based, serves app-backend+app-frontend bundled in one image), `landing_swa` (Azure Static Web App — landing's hosting). `shared/` holds one `acr` (container registry) + its own `resource_group`, used by every environment's `web_app`.
- **Region note**: Azure Static Web Apps aren't available in every region — `landing_swa` uses each env's `app_location` (`westeurope`), not the resource group's own `rg_location` (`germanywestcentral`, not SWA-eligible). Prod's *existing* (pre-Terraform) SWA is in `westus2` — a separate, hardcoded override, not the general pattern.
- **App bundling**: app-backend (Django) + app-frontend (React) build into **one Docker image** (`Dockerfile` at repo root, build context is the whole monorepo) — Django serves the built React SPA as static files via `collectstatic`. They stay separate codebases/packages, just not separately hosted. `app-backend`'s Easy Auth (`backend/auth/{easy_auth.py,middleware.py}`, decoding App Service's injected `X-MS-CLIENT-PRINCIPAL` header) is reused near-verbatim from `asistentka` — dependency-free, no reason to diverge.
- **Landing stays on Azure Static Web Apps**, not folded into the App Service pattern — free tier, already proven working, independently releasable from the app. Prod's `landing_swa` unit is for **importing** the already-live SWA, not creating a new one — see the big warning comment in `infra/live/prod/landing_swa/terragrunt.hcl` before ever running `apply` there. That resource's real shape (resource group `macekai_group`, region `westus2`, `Standard` SKU, two custom domains) is already documented in that file from a read-only `az staticwebapp show` lookup — the import itself hasn't been run.
- **Easy Auth via App Service's `auth_settings_v2`**, provider **Google only** (`google_v2` block) — explicit decision, no Microsoft/Entra fallback. `asistentka`'s original Entra-based setup was fully replaced same day it was built; the vestigial Entra app registration (`macekai-app-backend`) is unused. `common.hcl`'s `google_client_id` still needs the real value from the Google Cloud Console (see `infra/README.md`); the client secret lives only at `~/.macekai/google_client_secret.txt` locally, never in the repo. `tenant_id` in `common.hcl` is unrelated to login — it's required by the `key_vault` module for the Key Vault resource's own `tenant_id` field, keep it regardless of auth provider. The **Azure OpenAI** module is kept from `asistentka` too, model deployment gated off (see below).
- **No Postgres stop/start cost-saving schedule** (unlike `asistentka`) — macekai's app-backend is meant to serve coaching clients who may use it any time, so Postgres stays always-on in every environment.
- **One deploy pattern for all three environments including prod** (`deploy_environments.yml`) — branches `dev`/`staging`/`main` map to environments `dev`/`staging`/`prod`.
- **RBAC for Key Vault needs three separate roles**, not two — `User Access Administrator` (general, but excludes Key Vault assignments), `Key Vault Data Access Administrator` (lets you *assign* Key Vault roles to others), and `Key Vault Secrets Officer` (a data-plane role letting you actually read/write secret *values* yourself). Missing the third one specifically causes a `403` on `terraform apply` for `key_vault` even with the other two granted — discovered live, not documented in `asistentka`'s own notes.
- **Local dev**: `docker-compose.yml` + `.env.example` at repo root (Django + Postgres only, no worker) — purely local, unrelated to any deployed environment. Verified working end-to-end including the dev-login → whoami Easy-Auth-simulation cycle.

## Future phases (described, not fully built)

- **Real product features** in `app-backend`/`app-frontend` — currently just a hello-world proving the deploy pipeline + Easy Auth, not the actual coaching product.
- **`staging`/`prod` full infra fleet** — only `dev` has `postgres`/`web_app`/`key_vault`/`openai` applied so far.
- **Prod landing SWA import** — documented (see above), not executed.
- **Blog**: shape undecided (static Vite site vs. Django-templated vs. separate SSG) — resolve when work on it actually starts.

## Notes

- `CONTEXT.md` at repo root holds brand/positioning notes shared across `marketing/` and (eventually) `app-frontend` copy — don't move it into a subfolder.
- `landing/.manus/`, `landing/.manus-logs/`, `landing/.project-config.json`, `landing/template.json` are leftovers from the original Manus.im app-builder scaffold that produced `landing/`. `.project-config.json` looks like it holds secrets but is gitignored and has never been committed — keep it that way.
- `Dockerfile`, `docker-compose.yml`, and `.env.example` at repo root are for `app-backend`/`app-frontend` — not landing, not marketing, not webinars. Working and verified (local `docker compose` + real Azure deploy to `dev`).
