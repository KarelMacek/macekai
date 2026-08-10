# macekai

Monorepo for Karel Macek's career/AI coaching brand: a landing page, a future Django + React "app" product, marketing content, webinars, and (eventually) a blog.

See [CLAUDE.md](CLAUDE.md) for the full layout and conventions. Quick map:

| Path                            | What it is                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [`landing/`](landing/README.md) | Marketing/coaching landing page — Vite + React + TypeScript, deployed to Azure Static Web Apps. Part of the pnpm workspace.   |
| `app-frontend/`, `app-backend/` | Not built yet (Phase 2) — the product app: Django API backend + its own React frontend.                                       |
| [`marketing/`](marketing/)      | Campaign content (copy + generated posters) and the Python/Pillow scripts that generate them. Not part of the pnpm workspace. |
| [`webinars/`](webinars/)        | Webinar planning docs and per-deck slide apps (e.g. `webinars/2026-08-22 .../cameo-spike`, part of the pnpm workspace).       |
| `blog/`                         | Not built yet.                                                                                                                |
| `infra/`                        | Not built yet — Terraform for dev/staging/prod, to be added later.                                                            |

## Setup

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm install
```

This installs dependencies for every pnpm-workspace package (currently `landing` and the webinar's `cameo-spike` deck). Run a package's scripts with `pnpm --filter <package> <script>`, e.g. `pnpm --filter landing dev`.
