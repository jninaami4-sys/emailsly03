# Emailsly PHP API — cPanel / FTP deployment guide

PHP 8.4 + MySQL 8 backend for emailsly.com. This guide walks a shared-cPanel
deploy step by step — no SSH required (SSH is optional; used only for
`composer install` if your host allows it).

---

## 0. What you need before you start

- A cPanel account on your Bangladeshi host with:
  - PHP 8.4 available (cPanel > *Select PHP Version*)
  - MySQL 8.x (cPanel > *MySQL Databases*)
  - AutoSSL / Let's Encrypt (cPanel > *SSL/TLS Status*)
- An FTP or File Manager login.
- Your domain `emailsly.com` pointed at the host (DNS A record).
- A subdomain for the API — recommended: `api.emailsly.com`.
- Stripe account keys (test + live).

---

## 1. Create the MySQL database (cPanel)

1. cPanel > **MySQL Databases**.
2. *Create New Database* — name it `emailsly_prod`. cPanel prefixes it with
   your account name, so the real name will be something like
   `cpuser_emailsly_prod`. Write that down.
3. *Add New User* — `emailsly_user`, strong password. Real name will be
   `cpuser_emailsly_user`.
4. *Add User To Database* — grant **ALL PRIVILEGES**.

---

## 2. Import the schema

1. cPanel > **phpMyAdmin** > pick `cpuser_emailsly_prod` on the left.
2. *Import* tab > choose file `backend-php/database/schema.sql` > **Go**.
3. Repeat for `backend-php/database/seed.sql` (creates default admin +
   demo pricing).

If you're migrating from an existing Supabase project, also import the
dump produced by `backend-php/migrate/export-supabase.mjs` — see
`backend-php/migrate/README.md`.

---

## 3. Create the API subdomain

1. cPanel > **Domains** > *Create A New Domain*.
2. Domain: `api.emailsly.com`.
3. **Document Root**: `/home/<cpuser>/backend-php/public`
   *(recommended — puts the front controller directly at web root and makes
   the root `.htaccess` unnecessary)*.
4. cPanel > **SSL/TLS Status** > *Run AutoSSL* so HTTPS is issued for the
   new subdomain within a few minutes.

> Can't set a custom document root? Point it at
> `/home/<cpuser>/backend-php` instead — the root `.htaccess` handles the
> rewrite into `public/`.

---

## 4. Upload the backend (FTP or File Manager)

Upload the entire `backend-php/` folder to `/home/<cpuser>/backend-php/`
so the final tree looks like:

```text
/home/<cpuser>/
  backend-php/
    public/          <- document root for api.emailsly.com
      .htaccess
      index.php
    src/
    database/
    migrate/
    uploads/         <- writable, 755
    vendor/          <- created in step 6
    composer.json
    .env             <- created in step 5 (NOT .env.example)
    .htaccess        <- only needed if doc root is backend-php/, not public/
```

File permissions:

- Folders: `755`
- Files: `644`
- `backend-php/uploads/` and every subfolder inside it: `755` and writable
  by the PHP-FPM user (cPanel's File Manager > *Permissions* dialog).

---

## 5. Configure `.env`

1. Copy `backend-php/.env.example` to `backend-php/.env`
   (File Manager > right-click > *Copy* > rename).
2. Edit `backend-php/.env` in File Manager > *Edit* and fill in:
   - `APP_URL=https://emailsly.com`
   - `API_URL=https://api.emailsly.com`
   - `DB_NAME`, `DB_USER`, `DB_PASS` from step 1
     (use the **prefixed** names, e.g. `cpuser_emailsly_prod`)
   - `JWT_SECRET` — generate once with `openssl rand -hex 32` on any
     machine and paste the 64-char value; keep it stable.
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `SMTP_*` from cPanel > *Email Accounts* > *Connect Devices*
   - `CORS_ORIGINS=https://emailsly.com,https://www.emailsly.com`
     (add `http://localhost:5173` while developing).

Never place `.env` inside `public/`. The provided `.htaccess` files also
block direct HTTP reads of it, but the safest posture is "don't put
secrets in the web root at all".

---

## 6. Install PHP dependencies

### Option A — cPanel Terminal / SSH (easiest)

```bash
cd ~/backend-php
composer install --no-dev --optimize-autoloader
```

### Option B — no shell access

Run `composer install --no-dev --optimize-autoloader` on your own
machine, then FTP the entire generated `vendor/` folder to
`/home/<cpuser>/backend-php/vendor/`.

---

## 7. Point PHP at 8.4

cPanel > **Select PHP Version** > pick **8.4** for the domain
`api.emailsly.com`. Enable these extensions (usually on by default):
`pdo_mysql`, `mbstring`, `openssl`, `curl`, `json`, `fileinfo`, `gd`.

Recommended `php.ini` overrides (cPanel > *MultiPHP INI Editor*):

```ini
upload_max_filesize = 10M
post_max_size       = 12M
memory_limit        = 256M
max_execution_time  = 60
expose_php          = Off
```

---

## 8. Smoke test

Open in a browser:

```text
https://api.emailsly.com/api/health
```

Expected JSON response:

```json
{ "ok": true, "ts": "2026-07-17T..." }
```

If you see a 500 or a blank page:

- cPanel > **Errors** — read the last few lines.
- Confirm `.env` is present and readable.
- Confirm `vendor/autoload.php` exists.
- Confirm the document root really points at `backend-php/public/` (or
  at `backend-php/` with the root `.htaccess` in place).

Then log in with the seeded admin:

```bash
curl -X POST https://api.emailsly.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@emailsly.com","password":"ChangeMe!2026"}'
```

**Change that password immediately** from the admin panel after first login.

---

## 9. Wire up the Stripe webhook

1. Stripe dashboard > **Developers** > **Webhooks** > *Add endpoint*.
2. Endpoint URL: `https://api.emailsly.com/api/stripe/webhook`
3. Events to send:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
4. Copy the **Signing secret** (`whsec_...`) into `.env` as
   `STRIPE_WEBHOOK_SECRET` and reload the page (`.env` is re-read on
   every request).
5. Send a test event from the Stripe dashboard — it should return `200
   {"ok":true}` and appear in the `stripe_events` MySQL table.

---

## 10. Point the React frontend at the new API

In your Lovable frontend project:

```bash
VITE_API_BASE_URL=https://api.emailsly.com/api
```

Rebuild and republish the site. `src/lib/api-client.ts` (already in the
repo) reads that variable and talks to this PHP backend.

---

## 11. Backups and maintenance

- cPanel > **Backup Wizard** — schedule a weekly *Home Directory + MySQL*
  backup and download it off-server.
- Rotate `JWT_SECRET` only when you accept that every user is logged out.
- After every deploy, hit `/api/health` and log in as a real user before
  closing the maintenance window.

---

## Troubleshooting cheatsheet

| Symptom                                        | Fix |
| ---------------------------------------------- | --- |
| `500` on every request                          | Check cPanel *Errors*; usually missing `vendor/` or wrong PHP version. |
| `Access-Control-Allow-Origin` errors in browser | Add the frontend origin to `CORS_ORIGINS` in `.env`. |
| `No authorization header provided`              | Apache is stripping the header — the shipped `public/.htaccess` already re-injects it; make sure the file wasn't overwritten. |
| Uploads fail with `413`                         | Raise `upload_max_filesize` + `post_max_size` in MultiPHP INI Editor. |
| Stripe webhook returns `401 Bad signature`      | `STRIPE_WEBHOOK_SECRET` doesn't match Stripe > Webhooks > *Signing secret*, or your host is behind a proxy adjusting the body. |
| `SQLSTATE[HY000] [1045] Access denied`          | Wrong DB credentials in `.env`; remember cPanel prefixes DB / user names. |

---

Default admin credentials (change on first login):
`admin@emailsly.com` / `ChangeMe!2026`.