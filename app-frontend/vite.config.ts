import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// base: '/static/' matches Django's STATIC_URL — asset references in the
// built index.html need this prefix for whitenoise to serve them correctly.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/static/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    // manifest.json lets Django find hashed filenames if ever needed.
    manifest: true,
  },
  server: {
    // Lets `vite dev` talk to a separately-running `manage.py runserver`
    // (localhost:8000) for authenticated API/admin/auth calls during
    // frontend-only iteration, without needing the full Docker build.
    proxy: {
      "/api": "http://localhost:8000",
      "/admin": "http://localhost:8000",
      "/healthz": "http://localhost:8000",
      "/logout": "http://localhost:8000",
      "/dev-login": "http://localhost:8000",
      "/.auth": "http://localhost:8000",
    },
  },
});
