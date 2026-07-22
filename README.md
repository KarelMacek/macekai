# karel-macek-coach

Static single-page site built with React 19, Vite 7, TypeScript, and Tailwind CSS. There is no backend — the app is a client-only build served as static files.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (pinned via `packageManager` in `package.json`; a dependency patch in `patches/wouter@3.7.1.patch` is applied automatically by pnpm on install)

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
```

## Install

```bash
pnpm install
```

## Develop

```bash
pnpm dev
```

Starts the Vite dev server (with `--host`) and serves the app with hot reload.

## Build

```bash
pnpm build
```

Type-checked, production-optimized static output is written to `dist/public`.

## Preview a production build

```bash
pnpm preview
```

Serves the contents of `dist/public` locally, as it would be served in production.

## Other scripts

| Command | Purpose |
|---|---|
| `pnpm check` | TypeScript type-check (`tsc --noEmit`), no emit |
| `pnpm format` | Format the codebase with Prettier |

## Environment variables

The map feature (`client/src/components/Map.tsx`) optionally reads:

- `VITE_FRONTEND_FORGE_API_KEY` — Google Maps API key
- `VITE_FRONTEND_FORGE_API_URL` — Maps proxy base URL (optional override)

Set these in a `.env.local` file at the project root if the map is needed.

## Deployment

Deploy the static contents of `dist/public` to any static host (the repo's `.github/workflows/` currently targets Azure Static Web Apps).

## Project structure

```
client/          React SPA source (Vite root)
  src/
    pages/       Route-level pages
    components/  UI components (client/src/components/ui is shadcn/radix-based)
    lib/         Content and utility helpers
shared/          Constants shared between client code (e.g. cookie name)
legacy-site/     Previous static HTML/CSS site, kept for reference
```
