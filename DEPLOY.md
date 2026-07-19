# Emailsly — cPanel Deployment Guide

**Stack:** React (Vite build) + PHP 8.4 API + MySQL 8.x, all on the same cPanel account.
**Domain assumption:** `emailsly.com` (main site) and `api.emailsly.com` OR `/api` sub-path (same host).

This guide gets you from zero to a live site. Follow the steps in order — later steps assume earlier ones are done.

---

## 1. Provision on cPanel

1. **PHP version:** In cPanel → *Select PHP Version*, pick **8.4**. Enable extensions: `pdo_mysql`, `mbstring`, `curl`, `openssl`, `fileinfo`, `zip`, `intl`.
2. **MySQL database:** cPanel → *MySQL Databases*:
   - Create DB: `emailsly_prod` (cPanel prepends your account name, e.g. `youracct_emailsly_prod`).
   - Create user: `emailsly_user` with a strong password.
   - Add user to DB with **ALL PRIVILEGES**.
3. **Email accounts:** cPanel → *Email Accounts* — create four mailboxes with strong passwords each:
   - `no-reply@mail.emailsly.com` (auth: OTP, password reset)
   - `orders@mail.emailsly.com` (order confirmations)
   - `support@mail.emailsly.com` (ticket replies)
   - `hello@emailsly.com` (contact form)
4. **SSL:** cPanel → *SSL/TLS Status* — run **AutoSSL** on the domain. HTTPS is mandatory (Stripe webhooks and modern browsers require it).

---

## 2. Upload the PHP API

Upload the `backend-php/` folder to `/home/<user>/api-emailsly/` (or wherever — **NOT inside public_html**). Then in cPanel:

1. **Composer install (SSH or Terminal):**
   ```bash
   cd ~/api-emailsly
   composer install --no-dev --optimize-autoloader
   ```
   No SSH? Use cPanel *Terminal* — same commands. Or upload a pre-built `vendor/` from local.

2. **Set the API document root.** In cPanel → *Domains* → *Create A Domain* (or *Subdomains*):
   - **Domain:** `api.emailsly.com`
   - **Document root:** `/home/<user>/api-emailsly/public`

   Alternative (single-domain setup with `/api` sub-path): symlink `public_html/api → /home/<user>/api-emailsly/public`.

3. **Environment file.** Copy `.env.example` to `.env` inside `~/api-emailsly/` and fill in real values:
   - `DB_HOST=localhost`, `DB_NAME=<account>_emailsly_prod`, `DB_USER=<account>_emailsly_user`, `DB_PASS=…`
   - `JWT_SECRET` — run `openssl rand -hex 32`, paste result.
   - `SMTP_*_PASS` — the four cPanel mailbox passwords.
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard.
   - `UPLOADS_DIR=/home/<user>/public_html/uploads`
   - `UPLOADS_PUBLIC_URL=https://emailsly.com/uploads`
   - `APP_URL=https://emailsly.com`, `API_URL=https://api.emailsly.com`
   - `CORS_ORIGINS=https://emailsly.com,https://www.emailsly.com`
   - `ADMIN_EMAIL=admin@yourdomain.com`

4. **Permissions:**
   ```bash
   chmod 600 ~/api-emailsly/.env
   mkdir -p ~/public_html/uploads
   cp ~/api-emailsly/uploads.htaccess ~/public_html/uploads/.htaccess
   chmod 755 ~/public_html/uploads
   ```

---

## 3. Import the database

**Fresh install (new database):**

1. cPanel → *phpMyAdmin* → select your DB.
2. **Import** `backend-php/database/schema.sql` (creates all tables — includes every column and helper table the app needs).
3. **Import** `backend-php/database/seed.sql` (creates the seed admin `admin@emailsly.com` / `ChangeMe!2026`, default pricing, site settings, chatbot config).
4. **Immediately** log in and change the admin password (or update the row before importing seed).

Do **NOT** run `schema_patch.sql` on a fresh install — everything it adds is already in `schema.sql`.

**Upgrading an existing database created before the gap-closure batch:**

1. cPanel → *phpMyAdmin* → select your DB → **Import** `backend-php/database/schema_patch.sql`.
2. On re-run you may see "Duplicate column name" errors for columns that already exist — those are expected and safe. Use phpMyAdmin's "Continue on error" checkbox, or via CLI: `mysql --force -u user -p dbname < schema_patch.sql`.

> **⚠️ SECURITY: The seed admin password `ChangeMe!2026` MUST be rotated before the site goes live.** Anyone with the deploy guide knows this credential — rotate it in `Profile → Security` (or via phpMyAdmin) as your first action after import.

Verify with a test call:
```
curl https://api.emailsly.com/api/health
# → {"ok":true,"ts":"2026-…"}
```

---

## 4. Build & upload the frontend

Locally:
```bash
# In the repo root
echo 'VITE_API_BASE=https://api.emailsly.com' > .env.production
bun install
bun run build          # emits dist/
```

Upload the **contents of `dist/`** into `~/public_html/`. Do NOT nest into `dist/`.

Add SPA fallback at `~/public_html/.htaccess`:
```apache
Options -MultiViews
RewriteEngine On
RewriteBase /

# Never rewrite these
RewriteRule ^(api|uploads)(/|$) - [L]

# Everything else → index.html (client-side router handles it)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# Cache the hashed static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 30 days"
</IfModule>
```

---

## 5. Wire Stripe webhook

1. Stripe Dashboard → *Developers* → *Webhooks* → **Add endpoint**.
2. URL: `https://api.emailsly.com/api/stripe/webhook`
3. Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.
4. Copy the **Signing secret** (`whsec_…`) into `.env` as `STRIPE_WEBHOOK_SECRET`.
5. Test with `stripe listen --forward-to https://api.emailsly.com/api/stripe/webhook` or Stripe's built-in "Send test event".

The PHP `StripeController` verifies the signature, marks the order `paid`, records `stripe_events.event_id` for idempotency, and emails the customer + admin from `orders@mail.emailsly.com`.

---

## 6. First-time admin login

1. Visit `https://emailsly.com/login`
2. Sign in with `admin@emailsly.com` / `ChangeMe!2026`.
3. Immediately change the password in *Profile → Security*.
4. Go to *Admin → Brand settings* and re-upload your logo / favicon / invoice logo (they now go to `/uploads/brand-assets/…`).

---

## 7. Ongoing operations

- **Backup:** cPanel → *Backup Wizard* nightly for both `public_html` and the MySQL DB. The admin panel also has a *Backup / Restore* JSON export.
- **Logs:** cPanel → *Errors* for PHP errors. API logs go to `error_log` inside `~/api-emailsly/public/`.
- **Update code:**
  ```bash
  # Frontend
  bun run build
  # then upload dist/ contents (overwrite public_html/*.js, *.css, index.html)

  # Backend
  # upload changed files under ~/api-emailsly/
  # if composer.json changed:
  composer install --no-dev --optimize-autoloader
  ```
- **Rotate JWT_SECRET** only when you accept that every user must sign in again.

---

## Directory layout (final state on cPanel)

```
/home/<user>/
├── api-emailsly/                ← PHP API (uploaded)
│   ├── .env                     ← chmod 600, NEVER commit
│   ├── composer.json
│   ├── vendor/
│   ├── database/schema.sql
│   ├── database/seed.sql
│   ├── src/                     ← Controllers, Auth, Router
│   └── public/
│       ├── .htaccess            ← rewrites /api/* → index.php
│       └── index.php            ← front controller
│
└── public_html/                 ← Web root for emailsly.com
    ├── .htaccess                ← SPA fallback (from step 4)
    ├── index.html               ← Vite build output
    ├── assets/                  ← hashed JS/CSS
    └── uploads/                 ← user + admin uploads
        ├── .htaccess            ← blocks .php execution
        ├── avatars/…
        ├── brand-assets/…
        ├── announcement-media/…
        ├── blog-images/…
        ├── product-images/…
        └── sample-datasets/…
```

Subdomain `api.emailsly.com` document root = `/home/<user>/api-emailsly/public`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `500` on every API call | Check `~/api-emailsly/public/error_log`. Almost always: PHP version < 8.4, or missing `vendor/` from Composer. |
| CORS error in browser | Add the exact origin (with `https://`, no trailing slash) to `CORS_ORIGINS` in `.env`. Restart is not needed; PHP re-reads `.env` per request. |
| Uploads return 200 but the URL 404s | `UPLOADS_DIR` and `UPLOADS_PUBLIC_URL` don't point at the same folder. |
| Emails not delivered | cPanel *Email Deliverability* — verify SPF, DKIM, DMARC for `mail.emailsly.com`. |
| Stripe webhook returns 400 | `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint's signing secret. |
| Login fails immediately after import | You forgot to rotate the seed password before going live. Reset in phpMyAdmin: `UPDATE users SET password_hash = '<new bcrypt hash>' WHERE email='admin@emailsly.com'`. Generate a hash with `php -r "echo password_hash('newpass', PASSWORD_BCRYPT, ['cost'=>12]);"`. |

---

## Migration status (as of this deployment guide)

**What's ready on the PHP side (turn 1 of migration):**
- Full MySQL schema (44 tables) including custom_products, store_offers, telegram_bots, campaigns, legacy_order_imports, otp_codes.
- File uploads under `/uploads/{bucket}/{yyyy}/{mm}/*` with MIME whitelist and per-bucket ACL.
- All customer endpoints: auth, orders, invoices, blog, reviews, contact, referrals, support tickets, chatbot, samples.
- All admin endpoints: orders (CRUD + bulk archive/restore/delete/cancel/deliver + timeline + messages), pricing, blog + SEO overrides + analytics, announcements, reviews, tickets, leads, referrals, users/roles, site content + settings + social links, samples, chatbot KB, analytics overview, products, offers, telegram bots, campaigns, legacy imports, test-email.
- Stripe checkout + signed webhook.
- 4-channel SMTP via cPanel mailboxes.

**What's next (turn 2 of migration — pending):**
- Rewire the React app to call the PHP API instead of Supabase (53 files still import `@/integrations/supabase/client`). This will be done component-by-component in follow-up turns so intermediate builds keep passing.
