# Full Supabase Rip-Out → PHP/MySQL Only

You already have `database/schema.sql`, ~33 PHP controllers under `/api`, and a typed `src/lib/api-client.ts` SDK from an earlier pass. That work stays. This plan removes every remaining Supabase touchpoint from the running app and rewires everything that still calls a `*.functions.ts` server function to the PHP API instead.

## What changes

### 1. Config
- Add `VITE_API_BASE_URL` (default `https://api.yourdomain.com`) — you edit this to the real Bangladeshi host URL before build.
- Add a `config.local.php` template in `/api` for DB creds (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `JWT_SECRET`, `UPLOAD_DIR`, `PUBLIC_URL`) with `config.local.example.php` committed.
- Frontend `api-client.ts` reads the base URL from `import.meta.env.VITE_API_BASE_URL`, sends `Authorization: Bearer <jwt>` from `localStorage`.

### 2. Auth (PHP sessions + JWT)
- PHP: `/api/auth/signup`, `/login`, `/verify-otp`, `/resend-otp`, `/forgot`, `/reset`, `/me`, `/logout`. Bcrypt passwords, 6-digit email OTP (SMTP via PHPMailer, configurable), HS256 JWT (7-day), `users` + `user_roles` MySQL tables.
- Frontend: rewrite `src/routes/login.tsx`, `src/hooks/use-auth.ts`, and delete `src/integrations/supabase/*` + `src/integrations/lovable/*`. Replace with `src/lib/auth-client.ts` (login/signup/otp/logout, subscribe to token changes).
- Route gate: replace `_authenticated/route.tsx` Supabase check with a JWT-presence + `/me` validation check (still `ssr: false`).
- Google OAuth is dropped (you picked PHP sessions + JWT). Login page loses the Google button.

### 3. Data layer — delete all server functions
Every `src/lib/*.functions.ts` file gets deleted (~40 files including admin-orders, admin-extras, products-cms, pricing-settings, site-settings, reviews, chatbot, announcements, blog-cms, blog-seo, referrals, promos, contact-leads, sample-datasets, social-links, site-content, support-tickets, product-details, server-tracking, conversion-events, data-portability, orders, etc.). Every consumer switches to `apiClient.<domain>.<action>(...)` calls that hit the matching PHP controller.

PHP controllers to fill in / verify existence for all 40+ tables listed in the schema. Any missing controller gets scaffolded to mirror the deleted server function's behavior (list/get/create/update/delete + admin variants + specialty endpoints like archive/restore/bulk-delete for orders, promo validation, referral redemption, Stripe checkout session creation, Stripe webhook, Telegram webhook, KB sync, referral-click tracking).

### 4. Storage
- PHP `/api/storage/upload` (multipart, admin-gated per bucket) writes under `UPLOAD_DIR/<bucket>/<path>` and returns a public URL under `PUBLIC_URL/uploads/<bucket>/<path>`. Buckets modeled as folders: `brand-assets`, `avatars`, `reviews`, `announcement-media`, `sample-datasets` (sample-datasets stays private → signed download endpoint `/api/storage/sign?path=...` that checks order ownership).
- Frontend `BrandSettingsAdmin`, `MediaItemsEditor`, review uploads, avatar uploads all switch to `apiClient.storage.upload(bucket, file)`.

### 5. Payments
- Keep the existing PHP Stripe integration (create checkout session + webhook). Webhook path stays `/api/webhooks/stripe.php`; frontend calls `/api/checkout/session` from `OrderBuilder`. Stripe secret + webhook secret go in `config.local.php`.

### 6. Cleanups
- Delete `src/routes/api/**` (TanStack server routes for webhooks/telegram/kb/referral-click/health) — all replaced by PHP endpoints.
- Delete `src/start.ts` bearer middleware referencing Supabase; add a lightweight JWT attacher that reads `localStorage`.
- Delete `supabase/` folder, `src/integrations/supabase/`, `src/integrations/lovable/`.
- Strip `@supabase/supabase-js`, `@supabase/ssr` from `package.json`.
- Remove Supabase env vars from `.env` template; add `VITE_API_BASE_URL`.
- Admin gating switches from `has_role()` RPC to the JWT's `roles` claim + a `/api/admin/verify` fallback.
- Diagnostics drawer already uses `api-client` — no change.

## Deliverables layout

```text
/api/                    PHP endpoints (grouped by domain)
  config.local.example.php
  bootstrap.php          db, jwt, cors, error handler
  lib/                   Db.php, Jwt.php, Auth.php, Mail.php, Storage.php, Stripe.php
  auth/                  signup.php, login.php, verify-otp.php, ...
  orders/                list.php, get.php, create.php, update.php, archive.php, restore.php, bulk-delete.php
  products/, pricing/, site/, reviews/, chatbot/, blog/, referrals/, promos/, ...
  webhooks/stripe.php, webhooks/telegram.php
  storage/upload.php, storage/sign.php, uploads/<bucket>/...
/database/
  schema.sql             full MySQL schema (users, user_roles, orders, ...)
  seeds.sql              default site_settings/pricing/etc.
src/
  lib/api-client.ts      (already exists, extended)
  lib/auth-client.ts     (new)
  hooks/use-auth.ts      (rewritten)
  routes/_authenticated/route.tsx  (rewritten)
```

## Rollout order (single build, no half-states shipped)

1. Config files + `auth-client.ts` + rewritten `use-auth` + login route + `_authenticated` gate.
2. Delete all Supabase modules and `src/routes/api/**`.
3. Migrate every consumer of a deleted `*.functions.ts` to `api-client` (batched by domain).
4. Delete every `*.functions.ts` file.
5. Fill in any missing PHP controllers so the schema tables all have working endpoints.
6. Storage swap in admin uploaders.
7. Typecheck / build until clean.

## Deployment steps you'll do

1. Upload `/api` and `/database` to your Bangladeshi host.
2. Import `database/schema.sql` into MySQL, then `seeds.sql`.
3. Copy `config.local.example.php` → `config.local.php`, fill DB creds + JWT secret + SMTP + Stripe keys.
4. Point the frontend build's `VITE_API_BASE_URL` at your API host and republish.

## Heads-up (things that will break by design)

- Existing Supabase users / data won't be migrated automatically — you'll need to export from Supabase and import into MySQL (I can add a one-shot importer script if you want; not in this plan).
- Google OAuth logins will stop working (per your answer).
- Anything currently relying on Supabase Realtime (chatbot live updates, order events streaming) becomes short-interval polling.
- Row-level security moves from Postgres RLS into PHP checks — every admin controller enforces JWT `role=admin`, every user-scoped controller enforces `user_id = jwt.sub`.

Approve and I'll execute rollout in order, one batch per turn.
