#!/usr/bin/env node
/**
 * Visual regression runner for the light theme.
 *
 * Usage:
 *   node visual-regression/run.mjs snapshot     # write baselines (first run / accept changes)
 *   node visual-regression/run.mjs compare      # compare current against baselines (CI mode)
 *   node visual-regression/run.mjs update <name># refresh a single baseline
 *
 * Env:
 *   VR_BASE_URL   default http://localhost:8080
 *   VR_UPDATE=1   force `compare` to overwrite baselines on mismatch
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BASE_URL,
  TARGETS,
  GLOBAL_MASKS,
  PIXEL_DIFF_THRESHOLD,
  PIXELMATCH_THRESHOLD,
} from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_DIR = path.join(__dirname, 'baselines');
const CURRENT_DIR = path.join(__dirname, 'current');
const DIFF_DIR = path.join(__dirname, 'diffs');

const MODE = process.argv[2] || 'compare';
const ONLY = process.argv[3];

async function ensureDirs() {
  for (const d of [BASELINE_DIR, CURRENT_DIR, DIFF_DIR]) await mkdir(d, { recursive: true });
}

async function capture(browser, target) {
  const context = await browser.newContext({
    viewport: target.viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce', // freezes framer-motion / CSS transitions
  });
  const page = await context.newPage();
  const url = new URL(target.path, BASE_URL).toString();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });

  // Kill animations and stabilize fonts.
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }`,
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    // Scroll to bottom then top to trigger any lazy images, then wait a beat.
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 250));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 150));
  });

  if (target.waitFor) await page.waitForSelector(target.waitFor, { timeout: 10_000 });

  // Resolve masks into element handles.
  const maskSelectors = [...GLOBAL_MASKS, ...(target.mask || [])];
  const maskLocators = [];
  for (const sel of maskSelectors) {
    const loc = page.locator(sel);
    if (await loc.count().catch(() => 0)) maskLocators.push(loc);
  }

  const buffer = await page.screenshot({
    fullPage: !!target.fullPage,
    animations: 'disabled',
    caret: 'hide',
    mask: maskLocators,
    maskColor: '#000000',
    type: 'png',
  });

  await context.close();
  return buffer;
}

function loadPng(buf) {
  return PNG.sync.read(buf);
}

async function diff(baselinePath, currentBuf, diffPath) {
  const baseline = loadPng(await readFile(baselinePath));
  const current = loadPng(currentBuf);

  if (baseline.width !== current.width || baseline.height !== current.height) {
    return {
      ok: false,
      reason: `size mismatch: baseline ${baseline.width}x${baseline.height} vs current ${current.width}x${current.height}`,
      diffPixels: Infinity,
      totalPixels: baseline.width * baseline.height,
    };
  }

  const { width, height } = baseline;
  const diffPng = new PNG({ width, height });
  const diffPixels = pixelmatch(
    baseline.data,
    current.data,
    diffPng.data,
    width,
    height,
    { threshold: PIXELMATCH_THRESHOLD, includeAA: false },
  );
  await writeFile(diffPath, PNG.sync.write(diffPng));
  const total = width * height;
  return { ok: diffPixels / total <= PIXEL_DIFF_THRESHOLD, diffPixels, totalPixels: total };
}

async function main() {
  await ensureDirs();
  const targets = ONLY ? TARGETS.filter((t) => t.name === ONLY) : TARGETS;
  if (targets.length === 0) {
    console.error(`No matching target: ${ONLY}`);
    process.exit(2);
  }

  const browser = await chromium.launch();
  const results = [];
  try {
    for (const target of targets) {
      process.stdout.write(`• ${target.name} … `);
      const buf = await capture(browser, target);
      const currentPath = path.join(CURRENT_DIR, `${target.name}.png`);
      await writeFile(currentPath, buf);
      const baselinePath = path.join(BASELINE_DIR, `${target.name}.png`);
      const hasBaseline = existsSync(baselinePath);

      if (MODE === 'snapshot' || MODE === 'update') {
        await writeFile(baselinePath, buf);
        console.log('baseline written');
        results.push({ target: target.name, status: 'baseline' });
        continue;
      }

      if (!hasBaseline) {
        console.log('MISSING BASELINE (run `snapshot` first)');
        results.push({ target: target.name, status: 'missing' });
        continue;
      }

      const diffPath = path.join(DIFF_DIR, `${target.name}.png`);
      const r = await diff(baselinePath, buf, diffPath);
      if (r.ok) {
        console.log(`ok (${r.diffPixels}/${r.totalPixels} px)`);
        results.push({ target: target.name, status: 'ok', ...r });
      } else if (process.env.VR_UPDATE === '1') {
        await writeFile(baselinePath, buf);
        console.log(`updated baseline (was ${r.diffPixels}px off)`);
        results.push({ target: target.name, status: 'updated', ...r });
      } else {
        console.log(`FAIL ${r.reason || `${r.diffPixels}/${r.totalPixels} px differ`} — see ${path.relative(process.cwd(), diffPath)}`);
        results.push({ target: target.name, status: 'fail', ...r });
      }
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => r.status === 'fail' || r.status === 'missing');
  console.log('');
  console.log(`Summary: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length && MODE === 'compare') process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
