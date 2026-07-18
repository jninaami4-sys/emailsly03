
# Full API-based migration: React + PHP/MySQL on cPanel

Goal: the React app talks only to your PHP API on Emailsly.com. Zero Supabase at runtime. Upload `/backend-php/` to cPanel (`public_html/api/`), point React at it via `VITE_API_BASE`, done.

## Current state

- `/backend-php/` already scaffolded: Router, Auth (JWT), 30+ controllers (Auth, Orders, Pricing, Blog, Chatbot, Site, Support, Referrals, Reviews, Samples, Contact, Stripe webhook + admin variants), MySQL schema, seed, migrate script, `.htaccess`, Mailer with 4 SMTP channels.
- `src/lib/api-client.ts` exists as a thin bridge.
- 53 React files still import `@/integrations/supabase/client` directly.
- No file-upload endpoint yet, no `/uploads` handler.

## What I'll build in this pass

### 1. PHP backend — fill remaining gaps

- `FileController.php` → `POST /api/uploads` (multipart form-data, JWT-protected). Writes to `public_html/uploads/{bucket}/{yyyy}/{mm}/{uuid}.{ext}`, returns `{ url }`. Bucket whitelist: `avatars, reviews, brand-assets, announcement-media, sample-datasets, blog-images, product-images`. MIME + size guard (5 MB images, 20 MB datasets).
- `.htaccess` at `/uploads/` → static serve, deny PHP execution, 1-year cache headers.
- Add missing admin endpoints (audit each controller against Supabase tables list): brand settings, site_content, store_offers, telegram_bots, campaigns, custom_products, product_details, social_links, server_tracking_config, legacy_order_imports, reviews approve/reject, chatbot KB, orders bulk archive/restore, order_events, order_messages.
- Add missing customer endpoints: `/me/orders`, `/me/referrals`, `/me/credits`, `/me/tickets`, `/me/reviews`.
- `.env.example` refresh: DB creds, JWT secret, 4 SMTP mailers, Stripe keys+webhook, uploads path, CORS origins.
- `database/schema.sql` audit against Supabase tables (41 tables); add anything missing (esp. `custom_products`, `store_offers`, `campaigns`, `telegram_bots`, `site_content`, `blog_seo_overrides`, `chatbot_orders`, `chatbot_tickets`, `product_details`, `social_links`, `server_tracking_config`, `sample_datasets`, `legacy_order_imports`, `conversion_events`, `server_event_log`, `stripe_events`).
- `database/seed.sql`: default admin user (email + hashed password from env), pricing rows, site_content defaults, one demo product.
- Password reset flow: `/auth/forgot-password` → email token, `/auth/reset-password` → verify + update.
- OTP email verification: reuse existing 6-digit code flow on `/auth/signup` + `/auth/verify-otp`.
- Signed download for uploaded files not needed — cPanel serves them as public URLs.

### 2. React client — swap Supabase for API client

- Extend `src/lib/api-client.ts` with typed helpers: `api.auth.*`, `api.orders.*`, `api.blog.*`, `api.admin.*`, `api.uploads.upload(file, bucket)`, etc. JWT stored in `localStorage` under `emailsly_token`; auto-attached via `fetch` wrapper. On 401 → clear token + redirect `/login`.
- Replace `supabase.auth.*` calls → `api.auth.*` in ~10 files (login, signup, root, useAuth hook, admin gate, etc.).
- Replace `supabase.from('X')...` reads/writes → `api.X.*` in the 53 files. Done in batches by feature area.
- Replace `supabase.storage.from('X').upload/createSignedUrl` → `api.uploads.upload()` returning a permanent public URL under `/uploads/...`.
- Delete Supabase server functions (`.functions.ts`) that are no longer needed; keep only ones used for SSR (rewrite them to fetch the PHP API server-side using `VITE_API_BASE`).
- Remove `_authenticated/` gate's Supabase check → check `localStorage` token + call `GET /me` to validate.
- `.env` gains `VITE_API_BASE` (default `/api` for cPanel same-origin, override for preview).

### 3. Stripe webhook

- Keep existing `StripeController.php`. Route: `POST /api/webhooks/stripe` (raw body). Verifies signature with `STRIPE_WEBHOOK_SECRET`, marks order paid, emails receipt via `orders@` SMTP, records event in `stripe_events` for idempotency. React checkout returns to `/order/success?session_id=…` which polls `/api/orders/{id}` until `payment_status=paid`.

### 4. Deployment kit

- `backend-php/README.md` rewritten with cPanel steps: upload folder → set doc root to `public/` OR keep as `/api/` sub-app, create MySQL DB in cPanel → import `schema.sql` + `seed.sql` via phpMyAdmin, edit `.env`, chmod uploads. Optional: configure SMTP in cPanel Email Accounts for the 4 senders.
- `DEPLOY.md` at repo root: build React (`bun run build`), upload `dist/` to `public_html/`, upload `backend-php/` to `public_html/api/`, add `.htaccess` at root for SPA fallback (`RewriteRule ^ /index.html [L]` except `/api/*` and `/uploads/*`).

## Risk / what stops working in Lovable preview

Once Supabase is unplugged the Lovable preview cannot run auth or DB — the preview will only be useful as a static UI. You'll test the real thing against a staging domain on your cPanel host. If you want preview to keep working during migration, tell me and I'll switch to dual-mode with an env flag instead.

## Order of execution

1. Finish PHP backend (schema audit, missing endpoints, uploads, seed, docs).
2. Extend `api-client.ts` and add feature modules.
3. Swap Supabase → API in auth + root + admin gate.
4. Swap Supabase → API in customer surfaces (orders, dashboard, invoice, blog reader, reviews, contact, referrals, support).
5. Swap Supabase → API in admin panel (all `*Admin.tsx` components).
6. Delete unused Supabase server functions / `client.server`.
7. Verify build passes; write `DEPLOY.md`.

Expected size: ~60–80 file edits, multiple batches. I will not delete the Supabase integration files themselves until step 6 so intermediate builds stay green.
