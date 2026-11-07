import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import {
  SITUATION_REVIEW_CANONICALS,
  situationReviewCopy,
} from "./src/lib/situationReview";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map(entry => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", chunk => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

function vitePluginStorageProxy(): Plugin {
  return {
    name: "manus-storage-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/manus-storage", async (req, res) => {
        const key = req.url?.replace(/^\//, "");
        if (!key) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing storage key");
          return;
        }

        const forgeBaseUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(
          /\/+$/,
          ""
        );
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

        if (!forgeBaseUrl || !forgeKey) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Storage proxy not configured");
          return;
        }

        try {
          const forgeUrl = new URL(
            "v1/storage/presign/get",
            forgeBaseUrl + "/"
          );
          forgeUrl.searchParams.set("path", key);

          const forgeResp = await fetch(forgeUrl, {
            headers: { Authorization: `Bearer ${forgeKey}` },
          });

          if (!forgeResp.ok) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Storage backend error");
            return;
          }

          const { url } = (await forgeResp.json()) as { url: string };
          if (!url) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Empty signed URL");
            return;
          }

          res.writeHead(307, { Location: url, "Cache-Control": "no-store" });
          res.end();
        } catch {
          res.writeHead(502, { "Content-Type": "text/plain" });
          res.end("Storage proxy error");
        }
      });
    },
  };
}

// Emits prerendered copies of the built index.html for the offer page:
//   dist/public/situation-review/index.html     (Czech metadata)
//   dist/public/situation-review/en/index.html  (English metadata)
// so crawlers and link-preview bots that don't run JS get the right title,
// description, canonical, og:* and hreflang for each language. The same JS
// bundle loads and wouter routes by path. Static hosting can't vary HTML by
// query string, which is why the English preview needs its own path rather
// than relying on ?lang=en. Copy comes from the page's own source of truth.
function situationReviewPrerender(): Plugin {
  const esc = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return {
    name: "situation-review-prerender",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(import.meta.dirname, "dist/public");
      const src = path.join(outDir, "index.html");
      if (!fs.existsSync(src)) return;
      const base = fs.readFileSync(src, "utf-8");
      const alternates = [
        `<link rel="alternate" hreflang="cs" href="${SITUATION_REVIEW_CANONICALS.cs}" />`,
        `<link rel="alternate" hreflang="en" href="${SITUATION_REVIEW_CANONICALS.en}" />`,
        `<link rel="alternate" hreflang="x-default" href="${SITUATION_REVIEW_CANONICALS.cs}" />`,
      ].join("\n    ");

      for (const lang of ["cs", "en"] as const) {
        const title = esc(situationReviewCopy.meta.title[lang]);
        const description = esc(situationReviewCopy.meta.description[lang]);
        const url = SITUATION_REVIEW_CANONICALS[lang];
        let html = base;
        const swap = (re: RegExp, to: string) => {
          if (!re.test(html)) throw new Error(`prerender: pattern not found ${re}`);
          html = html.replace(re, to);
        };
        swap(/<html lang="[^"]*">/, `<html lang="${lang}">`);
        swap(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
        swap(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${description}$2`);
        swap(
          /<link rel="canonical" href="[^"]*" \/>/,
          `<link rel="canonical" href="${url}" />\n    ${alternates}`
        );
        swap(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${title}$2`);
        swap(
          /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
          `$1${description}$2`
        );
        swap(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
        swap(
          /<meta property="og:type" content="website" \/>/,
          `<meta property="og:type" content="website" />\n    <meta property="og:locale" content="${lang === "cs" ? "cs_CZ" : "en_US"}" />`
        );
        swap(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${title}$2`);
        swap(
          /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
          `$1${description}$2`
        );
        const dir = path.join(outDir, "situation-review", ...(lang === "en" ? ["en"] : []));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
      }
    },
  };
}

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  situationReviewPrerender(),
  vitePluginManusDebugCollector(),
  vitePluginStorageProxy(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: import.meta.dirname,
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
