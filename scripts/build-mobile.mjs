#!/usr/bin/env node
/**
 * Capacitor / Android build helper.
 *
 * TanStack Start builds an SSR worker + a client asset bundle. Capacitor needs
 * a static `dist/client/index.html` to load inside the Android WebView. This
 * script runs the normal Vite build and then writes a SPA shell that boots the
 * already-emitted client entry. All routing happens client-side via TanStack
 * Router, and localStorage / Zustand persistence behave exactly like a normal
 * SPA inside the WebView.
 */
import { execSync } from "node:child_process";
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const clientDir = join(root, "dist", "client");
const assetsDir = join(clientDir, "assets");

console.log("→ Running vite build…");
execSync("npx vite build", { stdio: "inherit" });

if (!existsSync(assetsDir)) {
  throw new Error(`Build output missing: ${assetsDir}`);
}

const files = readdirSync(assetsDir);
const entryJs = files.find((f) => /^index-[^.]+\.js$/.test(f));
const entryCss = files.find((f) => /^index-[^.]+\.css$/.test(f));

if (!entryJs) throw new Error("Could not find client entry assets/index-*.js");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0B0B12" />
    <title>FlashMaster</title>
    ${entryCss ? `<link rel="stylesheet" href="/assets/${entryCss}" />` : ""}
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="/icon-192.png" type="image/png" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <style>
      html, body { background: #0B0B12; margin: 0; }
      #__loading { position: fixed; inset: 0; display: grid; place-items: center;
        color: #fff; font-family: system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="__loading">Loading FlashMaster…</div>
    <script type="module" src="/assets/${entryJs}"></script>
  </body>
</html>
`;

writeFileSync(join(clientDir, "index.html"), html);
console.log(`✔ Wrote dist/client/index.html (entry: ${entryJs})`);
