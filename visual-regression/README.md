# Light-theme visual regression

Automated pixel snapshots of key routes rendered in the light theme, so any future CSS change that shifts colors or breaks the glass styling is caught before it ships.

## What it covers

Configured in `visual-regression/config.mjs`:

- `/` — desktop + mobile
- `/store` — desktop
- `/blog` — desktop
- `/light-preview` — desktop + mobile (the dedicated QA canvas: cards, buttons, tables, modals, forms, badges, tokens)

All routes are visited with `?theme=light`, which forces the SSR pipeline in `src/server.ts` to render the light theme regardless of cookie/localStorage.

## Install (one-time)

```bash
bun add -D playwright pixelmatch pngjs
bunx playwright install chromium
```

## Usage

Start the dev server in one terminal, then:

```bash
# 1) First run — capture baselines
node visual-regression/run.mjs snapshot

# 2) Later runs — compare current against baselines (CI mode, exits 1 on drift)
node visual-regression/run.mjs compare

# 3) Refresh a single baseline after an intentional change
node visual-regression/run.mjs update home-desktop

# 4) Bulk-accept all changes
VR_UPDATE=1 node visual-regression/run.mjs compare
```

Point at a non-default host with `VR_BASE_URL=https://staging.example.com`.

## Output layout

```
visual-regression/
  baselines/   # committed — the source of truth
  current/     # last run's screenshots (gitignored)
  diffs/       # red-highlighted pixel diffs (gitignored)
```

## Stability features

- Forces `colorScheme: 'light'` + `reducedMotion: 'reduce'` on every context.
- Injects a stylesheet that disables all `animation` / `transition` and hides the caret.
- Waits for `document.fonts.ready` and scrolls the page to trigger lazy content before shooting.
- Masks volatile elements (`time`, `.animate-pulse`, `canvas`, `video`, plus anything you tag with `data-vr-mask`) with solid black so they never cause false diffs.
- Failure threshold: 0.1% of pixels (`PIXEL_DIFF_THRESHOLD` in `config.mjs`); per-pixel color sensitivity is `PIXELMATCH_THRESHOLD` (0.1 by default).

## CI

Add a step that boots the app and runs `node visual-regression/run.mjs compare`. On failure, upload `visual-regression/diffs/**` as an artifact so reviewers can eyeball the drift.
