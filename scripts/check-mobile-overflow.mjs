#!/usr/bin/env node
/**
 * Mobile viewport overflow guard.
 *
 * Boots headless Chromium at 3 mobile widths against a running dev/preview
 * server and asserts:
 *   1. document.scrollWidth === viewport width (no page-level h-scroll)
 *   2. No non-decorative element renders past the viewport right edge
 *
 * Decorative absolutely-positioned blur/glow layers (`pointer-events-none`)
 * are ignored — they're intentionally offset and clipped by parents.
 *
 * Usage:
 *   BASE_URL=http://localhost:8080 node scripts/check-mobile-overflow.mjs
 *   BASE_URL=https://project--<id>.lovable.app node scripts/check-mobile-overflow.mjs
 *
 * Auth: set LOVABLE_BROWSER_SUPABASE_STORAGE_KEY + _SESSION_JSON
 * (matches the sandbox's browser-use env) to test authenticated routes.
 * Without them, only public routes in ROUTES are checked.
 *
 * Exit codes:
 *   0 — all routes clean
 *   1 — one or more overflow violations (details printed)
 *   2 — infra error (server unreachable, auth missing for private route, etc.)
 */
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";

// Add routes as pages are built. `auth: true` requires the Supabase session env.
const ROUTES = [
  { path: "/", auth: false },
  { path: "/store", auth: false },
  { path: "/pricing", auth: false },
  { path: "/blog", auth: false },
  { path: "/contact", auth: false },
  { path: "/dashboard", auth: true },
  { path: "/dashboard?tab=downloads", auth: true },
  { path: "/dashboard?tab=invoices", auth: true },
];

const VIEWPORTS = [
  { name: "iPhone SE", width: 320, height: 568 },
  { name: "iPhone 12", width: 390, height: 844 },
  { name: "Pixel 7",   width: 412, height: 915 },
];

const OVERFLOW_TOLERANCE_PX = 1;

const {
  LOVABLE_BROWSER_SUPABASE_STORAGE_KEY: storageKey,
  LOVABLE_BROWSER_SUPABASE_SESSION_JSON: sessionJson,
  LOVABLE_BROWSER_SUPABASE_COOKIES_JSON: cookiesJson,
} = process.env;

const hasAuth = Boolean(storageKey && sessionJson);

async function checkRoute(context, page, route, viewport) {
  const url = new URL(route.path, BASE_URL).toString();
  // Cache-bust so Vite HMR reloads the latest component tree between checks.
  const bustUrl = url + (url.includes("?") ? "&" : "?") + "_mob=" + Date.now();
  await page.goto(bustUrl, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(500);

  const result = await page.evaluate((tolerance) => {
    const html = document.documentElement;
    const clientW = html.clientWidth;
    const scrollW = html.scrollWidth;
    const offenders = [];
    const all = document.querySelectorAll("*");
    for (const el of all) {
      const style = getComputedStyle(el);
      // Skip intentionally decorative floats.
      if (style.pointerEvents === "none") continue;
      if (style.position === "fixed") continue;
      if (style.display === "none" || style.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > clientW + tolerance) {
        offenders.push({
          tag: el.tagName,
          cls: (el.className && el.className.toString().slice(0, 100)) || "",
          right: Math.round(r.right),
          overhang: Math.round(r.right - clientW),
        });
      }
    }
    return {
      clientW,
      scrollW,
      offenders: offenders.slice(0, 5),
      offenderCount: offenders.length,
    };
  }, OVERFLOW_TOLERANCE_PX);

  const pageScroll = result.scrollW - result.clientW;
  const failed = pageScroll > OVERFLOW_TOLERANCE_PX || result.offenderCount > 0;
  return { url: route.path, viewport: viewport.name, ...result, pageScroll, failed };
}

async function primeAuth(context, page) {
  if (!hasAuth) return;
  if (cookiesJson) {
    const cookies = JSON.parse(cookiesJson).map((c) => ({ ...c, url: BASE_URL }));
    await context.addCookies(cookies);
  }
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ([k, v]) => window.localStorage.setItem(k, v),
    [storageKey, sessionJson],
  );
}

(async () => {
  console.log(`\n mobile overflow guard → ${BASE_URL}`);
  console.log(`  auth: ${hasAuth ? "session injected" : "public routes only"}\n`);

  const browser = await chromium.launch({ headless: true });
  const failures = [];

  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      await primeAuth(context, page);

      for (const route of ROUTES) {
        if (route.auth && !hasAuth) {
          console.log(`  ⏭  ${viewport.name.padEnd(10)}  ${route.path}  (skipped — no session)`);
          continue;
        }
        try {
          const r = await checkRoute(context, page, route, viewport);
          if (r.failed) {
            failures.push(r);
            console.log(
              `  ✗  ${viewport.name.padEnd(10)}  ${route.path.padEnd(28)} ` +
              `scroll=${r.pageScroll}px  offenders=${r.offenderCount}`,
            );
            for (const o of r.offenders) {
              console.log(`       +${o.overhang}px  <${o.tag}> .${o.cls}`);
            }
          } else {
            console.log(`  ✓  ${viewport.name.padEnd(10)}  ${route.path}`);
          }
        } catch (err) {
          failures.push({ url: route.path, viewport: viewport.name, error: err.message });
          console.log(`  !  ${viewport.name.padEnd(10)}  ${route.path}  ERROR: ${err.message}`);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log("");
  if (failures.length) {
    console.log(`✗ ${failures.length} viewport/route combination(s) failed.`);
    process.exit(1);
  }
  console.log("✓ all viewport/route combinations passed.");
  process.exit(0);
})().catch((err) => {
  console.error("infra error:", err);
  process.exit(2);
});
