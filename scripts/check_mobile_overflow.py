#!/usr/bin/env python3
"""
Mobile viewport overflow guard.

Boots headless Chromium at 3 mobile widths against a running dev/preview
server and asserts:
  1. document.scrollWidth <= viewport width (no page-level horizontal scroll)
  2. No non-decorative element renders past the viewport's right edge

Decorative absolutely-positioned blur/glow layers (`pointer-events: none`)
and fixed elements are ignored — they're intentionally offset.

Usage:
    BASE_URL=http://localhost:8080 python3 scripts/check_mobile_overflow.py
    BASE_URL=https://project--<id>.lovable.app python3 scripts/check_mobile_overflow.py

Auth (optional, for dashboard routes):
    Set LOVABLE_BROWSER_SUPABASE_STORAGE_KEY + _SESSION_JSON
    (matches the sandbox's browser-use env). Without them, only public
    routes in ROUTES are checked.

Exit codes:
    0 — all clean
    1 — overflow violations found (details printed)
    2 — infra error (server unreachable, etc.)
"""
import asyncio
import json
import os
import sys
import time

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")

# Add routes as pages are built. auth=True requires session env.
ROUTES = [
    {"path": "/", "auth": False},
    {"path": "/store", "auth": False},
    {"path": "/pricing", "auth": False},
    {"path": "/blog", "auth": False},
    {"path": "/contact", "auth": False},
    {"path": "/dashboard", "auth": True},
    {"path": "/dashboard?tab=downloads", "auth": True},
    {"path": "/dashboard?tab=invoices", "auth": True},
]

VIEWPORTS = [
    {"name": "iPhone SE", "width": 320, "height": 568},
    {"name": "iPhone 12", "width": 390, "height": 844},
    {"name": "Pixel 7",   "width": 412, "height": 915},
]

TOLERANCE_PX = 1

STORAGE_KEY = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
SESSION_JSON = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
COOKIES_JSON = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
HAS_AUTH = bool(STORAGE_KEY and SESSION_JSON)

PROBE_JS = """
(tolerance) => {
  const html = document.documentElement;
  const clientW = html.clientWidth;
  const scrollW = html.scrollWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (s.pointerEvents === 'none') continue;
    if (s.position === 'fixed') continue;
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > clientW + tolerance) {
      offenders.push({
        tag: el.tagName,
        cls: (el.className && el.className.toString().slice(0, 100)) || '',
        overhang: Math.round(r.right - clientW),
      });
    }
  }
  return { clientW, scrollW, offenders: offenders.slice(0, 5), offenderCount: offenders.length };
}
"""


async def prime_auth(context, page):
    if not HAS_AUTH:
        return
    if COOKIES_JSON:
        cookies = json.loads(COOKIES_JSON)
        for c in cookies:
            c["url"] = BASE_URL
        await context.add_cookies(cookies)
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    await page.evaluate(
        "([k, v]) => window.localStorage.setItem(k, v)",
        [STORAGE_KEY, SESSION_JSON],
    )


async def check_route(page, route, viewport):
    sep = "&" if "?" in route["path"] else "?"
    url = f"{BASE_URL}{route['path']}{sep}_mob={int(time.time() * 1000)}"
    await page.goto(url, wait_until="networkidle", timeout=30_000)
    await page.wait_for_timeout(400)
    r = await page.evaluate(PROBE_JS, TOLERANCE_PX)
    page_scroll = r["scrollW"] - r["clientW"]
    failed = page_scroll > TOLERANCE_PX or r["offenderCount"] > 0
    return {**r, "path": route["path"], "viewport": viewport["name"], "pageScroll": page_scroll, "failed": failed}


async def main():
    print(f"\n mobile overflow guard → {BASE_URL}")
    print(f"  auth: {'session injected' if HAS_AUTH else 'public routes only'}\n")

    failures = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        try:
            for vp in VIEWPORTS:
                context = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
                page = await context.new_page()
                await prime_auth(context, page)
                for route in ROUTES:
                    if route["auth"] and not HAS_AUTH:
                        print(f"  ⏭  {vp['name']:<10}  {route['path']}  (skipped — no session)")
                        continue
                    try:
                        r = await check_route(page, route, vp)
                        if r["failed"]:
                            failures.append(r)
                            print(f"  ✗  {vp['name']:<10}  {route['path']:<28} scroll={r['pageScroll']}px  offenders={r['offenderCount']}")
                            for o in r["offenders"]:
                                print(f"       +{o['overhang']}px  <{o['tag']}> .{o['cls']}")
                        else:
                            print(f"  ✓  {vp['name']:<10}  {route['path']}")
                    except Exception as e:
                        failures.append({"path": route["path"], "viewport": vp["name"], "error": str(e)})
                        print(f"  !  {vp['name']:<10}  {route['path']}  ERROR: {e}")
                await context.close()
        finally:
            await browser.close()

    print("")
    if failures:
        print(f"✗ {len(failures)} viewport/route combination(s) failed.")
        sys.exit(1)
    print("✓ all viewport/route combinations passed.")
    sys.exit(0)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except SystemExit:
        raise
    except Exception as e:
        print(f"infra error: {e}", file=sys.stderr)
        sys.exit(2)
