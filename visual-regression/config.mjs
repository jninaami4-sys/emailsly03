// Visual regression config — light theme snapshots.
// Add or remove targets here; each becomes a baseline PNG.

export const BASE_URL = process.env.VR_BASE_URL || 'http://localhost:8080';

// Force light theme via the ?theme=light SSR query supported by src/server.ts.
const withLight = (path) => {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}theme=light`;
};

/** @type {{ name: string, path: string, viewport: {width:number,height:number}, waitFor?: string, fullPage?: boolean, mask?: string[] }[]} */
export const TARGETS = [
  // Full-page shots of key public routes.
  { name: 'home-desktop',        path: withLight('/'),               viewport: { width: 1440, height: 1800 }, fullPage: true },
  { name: 'home-mobile',         path: withLight('/'),               viewport: { width: 390,  height: 1800 }, fullPage: true },
  { name: 'store-desktop',       path: withLight('/store'),          viewport: { width: 1440, height: 1800 }, fullPage: true },
  { name: 'blog-desktop',        path: withLight('/blog'),           viewport: { width: 1440, height: 1600 }, fullPage: true },

  // Dedicated light-theme QA page — the most sensitive canvas for glass/color drift.
  { name: 'light-preview-full',  path: withLight('/light-preview'),  viewport: { width: 1440, height: 2400 }, fullPage: true },
  { name: 'light-preview-mobile',path: withLight('/light-preview'),  viewport: { width: 390,  height: 2400 }, fullPage: true },
];

// Selectors whose contents change every run (dates, counters, animations, avatars).
// They render as solid black boxes in both baseline and current so diffs ignore them.
export const GLOBAL_MASKS = [
  '[data-vr-mask]',
  'time',
  '.animate-pulse',
  'canvas',
  'video',
];

// Tolerance (0..1) — fraction of pixels allowed to differ before a target fails.
export const PIXEL_DIFF_THRESHOLD = 0.001; // 0.1%
// Per-pixel color sensitivity (0..1). Lower = stricter.
export const PIXELMATCH_THRESHOLD = 0.1;
