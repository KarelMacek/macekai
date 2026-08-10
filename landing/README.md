# landing

Static single-page site built with React 19, Vite 7, TypeScript, and Tailwind CSS. There is no backend — the app is a client-only build served as static files. This package is part of the `macekai` pnpm workspace — see the [root README](../README.md) for repo-wide setup.

## Develop

From the repo root:

```bash
pnpm install
pnpm --filter landing dev
```

Starts the Vite dev server (with `--host`) and serves the app with hot reload.

## Build

```bash
pnpm --filter landing build
```

Type-checked, production-optimized static output is written to `dist/public` (i.e. `landing/dist/public`).

## Preview a production build

```bash
pnpm --filter landing preview
```

Serves the contents of `dist/public` locally, as it would be served in production.

## Other scripts

| Command                       | Purpose                                         |
| ----------------------------- | ----------------------------------------------- |
| `pnpm --filter landing check` | TypeScript type-check (`tsc --noEmit`), no emit |

## Environment variables

The map feature (`src/components/Map.tsx`) optionally reads:

- `VITE_FRONTEND_FORGE_API_KEY` — Google Maps API key
- `VITE_FRONTEND_FORGE_API_URL` — Maps proxy base URL (optional override)

Set these in a `.env.local` file in `landing/` if the map is needed.

## Deployment

Deployed to Azure Static Web Apps via `.github/workflows/azure-static-web-apps-icy-beach-0ba33b71e.yml` (`app_location: landing`, `output_location: dist/public`) on push/PR to `main`.

## Project structure

```
landing/
  src/
    pages/       Route-level pages
    components/  UI components (src/components/ui is shadcn/radix-based)
    lib/         Content and utility helpers
  shared/        Constants shared between client code (e.g. cookie name)
  legacy-site/   Previous static HTML/CSS site, kept for reference
```
