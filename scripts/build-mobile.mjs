#!/usr/bin/env node
/**
 * Capacitor / Android build helper.
 *
 * Capacitor needs a static `dist/mobile/index.html` and cannot hydrate a
 * TanStack Start SSR document without the server bootstrap payload. This script
 * builds a dedicated client-only Android bundle and writes a WebView-safe shell.
 */
import { execSync } from "node:child_process";
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const clientDir = join(root, "dist", "mobile");
const assetsDir = join(clientDir, "assets");

console.log("→ Running Capacitor mobile build…");
execSync("npx vite build --config vite.mobile.config.ts", { stdio: "inherit" });

if (!existsSync(assetsDir)) {
  throw new Error(`Build output missing: ${assetsDir}`);
}

const files = readdirSync(assetsDir);
const entryJs = files.find((f) => /^mobile-[^.]+\.js$/.test(f));
const entryCss = files.find((f) => /^mobile-[^.]+\.css$/.test(f));

if (!entryJs) throw new Error("Could not find mobile client entry assets/mobile-*.js");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#4F46E5" />
    <title>FlashMaster</title>
    ${entryCss ? `<link rel="stylesheet" href="./assets/${entryCss}" />` : ""}
    <link rel="manifest" href="./manifest.webmanifest" />
    <link rel="icon" href="./icon-192.png" type="image/png" />
    <link rel="apple-touch-icon" href="./icon-192.png" />
    <style>
      html, body, #root { min-height: 100%; margin: 0; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./assets/${entryJs}"></script>
  </body>
</html>
`;

writeFileSync(join(clientDir, "index.html"), html);
console.log(`✔ Wrote dist/mobile/index.html (entry: ${entryJs})`);
