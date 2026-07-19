#!/usr/bin/env node
// Post-build: render "/" via the built SSR handler and write dist/client/index.html.
// Required for pure-static (cPanel/Apache) hosting where no Node server exists.
import { writeFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const entry = resolve("dist/server/index.mjs");
if (!existsSync(entry)) {
  console.error("[prerender] dist/server/index.mjs missing — run `vite build` first");
  process.exit(1);
}

const mod = await import(pathToFileURL(entry).href);
const handler = mod.default || mod;
const noopCtx = { waitUntil: () => {}, passThroughOnException: () => {} };
const res = await handler.fetch(new Request("http://localhost/"), {}, noopCtx);
if (res.status !== 200) {
  console.error(`[prerender] "/" returned status ${res.status}`);
  process.exit(1);
}
const html = await res.text();
writeFileSync("dist/client/index.html", html);
console.log(`[prerender] wrote dist/client/index.html (${html.length} bytes)`);
