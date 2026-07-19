# Emailsly — cPanel Deploy Bundle

`emailsly-dist.zip` is the full static frontend for cPanel Apache hosting.

## Deploy

1. In cPanel → *File Manager*, open `public_html/`.
2. Upload `emailsly-dist.zip` and **Extract** it directly into `public_html/`.
   The zip has files at its root (`index.html`, `assets/`, `.htaccess`, …) —
   they must land at `public_html/index.html`, `public_html/assets/`, etc.
   Do NOT nest inside a `dist/` subfolder.
3. Confirm `public_html/.htaccess` exists — it ships inside the zip and
   provides the SPA fallback + cache rules from `DEPLOY.md § 4`.

## API base URL

The client defaults to **same-origin `/api`**, which is correct for the
single-domain cPanel layout (`public_html/api` symlinked to the PHP backend's
`public/` folder — see `DEPLOY.md § 2`).

If your API lives on a separate subdomain (e.g. `api.emailsly.com`), add this
line to `public_html/index.html` **before** the app's module script — no
rebuild required:

```html
<script>window.__API_BASE__ = "https://api.emailsly.com";</script>
```

## Rebuilding

From the repo root:

```bash
bun install
bun run build          # emits dist/client + a prerendered index.html
cd dist/client && zip -rq ../../deploy/emailsly-dist.zip .
```
