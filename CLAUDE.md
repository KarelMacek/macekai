# macekai — monorepo conventions

This repo is a monorepo for Karel Macek's career/AI coaching brand. It covers five areas, each a **domain-named top-level folder** — not a generic `apps/`+`packages/` (Nx/Turborepo-style) layout:

- `landing/` — the marketing/coaching landing page.
- `app-frontend/` + `app-backend/` — the future product app (Django API + its own React frontend). **Not built yet.**
- `marketing/` — ongoing campaign content and the scripts that generate it.
- `webinars/` — webinar planning docs and per-deck slide apps.
- `blog/` — future, not built yet.
- `infra/` — Terraform for dev/staging/prod. **Not built yet** — Karel will paste in his own example covering all three environments.

## JS/TS tooling: one pnpm workspace

All JS/TS packages share a single pnpm workspace (`pnpm-workspace.yaml`) and one root `pnpm-lock.yaml`. Current packages:

- `landing` (`landing/`)
- `webinar-cameo-spike` (`webinars/2026-08-22 brain and career nemensis/cameo-spike/`)

Commands: `pnpm install` at repo root installs everything; run a package's own scripts with `pnpm --filter <package-name> <script>` (e.g. `pnpm --filter landing dev`, `pnpm --filter webinar-cameo-spike test`). Packages are free to diverge in dependency versions (e.g. `webinar-cameo-spike` runs a newer Vite/TS/ESLint/Vitest than `landing`) — pnpm resolves each package's tree independently, so this is not a problem to "fix."

**Important**: `pnpm.overrides` and `pnpm.patchedDependencies` (e.g. the `wouter` patch) only take effect when declared in the **workspace root** `package.json`, not in an individual package's `package.json`. If a patch or override stops applying, check it's still at the root.

`marketing/` is a plain Python/Pillow content-generation pipeline (`marketing/scripts/`) — it is **not** part of the pnpm workspace and has no `package.json`.

New webinar decks: add their path explicitly to `pnpm-workspace.yaml`'s `packages:` list (webinar folder names contain spaces/dates and hold non-package planning docs, so an explicit path is used instead of a glob).

## Deployment

- `landing/` deploys to **Azure Static Web Apps** via `.github/workflows/azure-static-web-apps-icy-beach-0ba33b71e.yml` on push/PR to `main`. The workflow explicitly runs `pnpm install && pnpm --filter landing build` and passes `skip_app_build: true` to the SWA deploy action — Oryx's auto-build detection isn't reliable against a workspace root, so don't remove the explicit build step. `app_location: "landing"`, `output_location: "dist/public"` (resolved relative to `app_location`, i.e. `landing/dist/public`). The workflow is path-filtered to `landing/**` + workspace root files, so unrelated commits elsewhere in the repo don't retrigger it. **This is prod-only today** — landing's `dev`/`staging` counterparts get wired up once `infra/live/{dev,staging}/landing_swa` exists (see below).
- `app-backend`/`app-frontend` (Phase 2, not built) will deploy together as **one Docker container per environment** to **Azure App Service**, via `.github/workflows/deploy_environments.yml` (not yet functional — needs the app code + the infra bootstrap, see `infra/README.md`).

## Infra (Terraform + Terragrunt) — `infra/`

Scaffolded (not yet applied to Azure — see `infra/README.md` for bootstrap status), adapted from a working sibling project, `asistentka` (`/home/karel/projects/asistentka`), reused as closely as possible rather than designed fresh. Full rationale for every reuse/deviation decision lives in the plan history; the durable facts:

- **Layout**: `infra/root.hcl` (backend+provider generation, per-component state keys) + `infra/live/{dev,staging,prod,shared}/<component>/terragrunt.hcl` + `infra/modules/<component>/main.tf`. One shared remote state storage account (`sttfstatemacekai`), one state file per environment×component pair.
- **Components per environment**: `resource_group`, `storage`, `postgres` (Flexible Server, public+firewall, no VNet), `openai` (Azure OpenAI, kept for future use), `key_vault` (RBAC, Web App reads secrets via managed identity + Key Vault references), `web_app` (Linux App Service, container-based, serves app-backend+app-frontend bundled in one image), `landing_swa` (Azure Static Web App — landing's hosting). `shared/` holds one `acr` (container registry) + its own `resource_group`, used by every environment's `web_app`.
- **App bundling**: app-backend (Django) + app-frontend (React) build into **one Docker image** (`Dockerfile` at repo root) — Django serves the built React SPA as static files via `collectstatic`. They stay separate codebases/packages, just not separately hosted.
- **Landing stays on Azure Static Web Apps**, not folded into the App Service pattern — free tier, already proven working, independently releasable from the app. Prod's `landing_swa` unit is for **importing** the already-live SWA, not creating a new one — see the big warning comment in `infra/live/prod/landing_swa/terragrunt.hcl` before ever running `apply` there.
- **Easy Auth** (Entra ID login via App Service's `auth_settings_v2`) and the **Azure OpenAI** module are kept from `asistentka`, wired but not necessarily used by app logic yet — `common.hcl`'s `tenant_id`/`easy_auth_client_id` are still placeholders (`REPLACE_ME_*`).
- **No Postgres stop/start cost-saving schedule** (unlike `asistentka`) — macekai's app-backend is meant to serve coaching clients who may use it any time, so Postgres stays always-on in every environment.
- **One deploy pattern for all three environments including prod** (`deploy_environments.yml`) — branches `dev`/`staging`/`main` map to environments `dev`/`staging`/`prod`.
- **Local dev**: `docker-compose.yml` + `.env.example` at repo root (Django + Postgres only, no worker) — purely local, unrelated to any deployed environment.
- **Not yet functional**: none of this builds/deploys until `app-backend`/`app-frontend` have at least a minimal skeleton (Phase 2) and the one-time bootstrap in `infra/README.md` has been run.

## Future phases (described, not fully built)

- **Phase 2 — `app-backend` + `app-frontend` code**: Django API (`app-backend/`, likely DRF) + a separate React frontend (`app-frontend/`, added to `pnpm-workspace.yaml` when started). Local dev story, Python dependency tool (uv/poetry/pip — `asistentka` uses `uv`, the Dockerfile assumes the same), and whether `app-frontend` reuses `landing`'s Vite/shadcn/Tailwind stack are all still open. A minimal "hello world" skeleton is needed before `infra/` can be meaningfully validated end-to-end (nothing real to containerize otherwise).
- **Blog**: shape undecided (static Vite site vs. Django-templated vs. separate SSG) — resolve when work on it actually starts.

## Notes

- `CONTEXT.md` at repo root holds brand/positioning notes shared across `marketing/` and (eventually) `app-frontend` copy — don't move it into a subfolder.
- `landing/.manus/`, `landing/.manus-logs/`, `landing/.project-config.json`, `landing/template.json` are leftovers from the original Manus.im app-builder scaffold that produced `landing/`. `.project-config.json` looks like it holds secrets but is gitignored and has never been committed — keep it that way.
- `Dockerfile`, `docker-compose.yml`, and `.env.example` at repo root are for `app-backend`/`app-frontend` (Phase 2) — not landing, not marketing, not webinars. None of them are functional yet (see above).
