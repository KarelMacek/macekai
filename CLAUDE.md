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

- `landing/` deploys to **Azure Static Web Apps** via `.github/workflows/azure-static-web-apps-icy-beach-0ba33b71e.yml` on push/PR to `main`. The workflow explicitly runs `pnpm install && pnpm --filter landing build` and passes `skip_app_build: true` to the SWA deploy action — Oryx's auto-build detection isn't reliable against a workspace root, so don't remove the explicit build step. `app_location: "landing"`, `output_location: "dist/public"` (resolved relative to `app_location`, i.e. `landing/dist/public`). The workflow is path-filtered to `landing/**` + workspace root files, so unrelated commits elsewhere in the repo don't retrigger it.
- `app-backend`/`app-frontend` (Phase 2, not built) will target **Azure App Service or Container Apps**, not Azure Static Web Apps.

## Future phases (described, not built)

- **Phase 2 — `app-backend` + `app-frontend`**: Django API (`app-backend/`, likely DRF) + a separate React frontend (`app-frontend/`, added to `pnpm-workspace.yaml` when started). Local dev story, Python dependency tool (uv/poetry/pip), and whether `app-frontend` reuses `landing`'s Vite/shadcn/Tailwind stack are all still open — decide these when Phase 2 actually starts rather than guessing now.
- **Phase 3 — `infra/`**: Terraform, `infra/environments/{dev,staging,prod}/` + `infra/modules/*`, Azure Storage remote state. Should **import**, not recreate, the existing Static Web App resource. Adds App Service/Container Apps + Postgres + Key Vault for Phase 2's backend.
- **Blog**: shape undecided (static Vite site vs. Django-templated vs. separate SSG) — resolve when work on it actually starts.

## Notes

- `CONTEXT.md` at repo root holds brand/positioning notes shared across `marketing/` and (eventually) `app-frontend` copy — don't move it into a subfolder.
- `landing/.manus/`, `landing/.manus-logs/`, `landing/.project-config.json`, `landing/template.json` are leftovers from the original Manus.im app-builder scaffold that produced `landing/`. `.project-config.json` looks like it holds secrets but is gitignored and has never been committed — keep it that way.
