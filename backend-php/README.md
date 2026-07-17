# Emailsly PHP Backend (v1)

A drop-in REST API for `Emailsly.com`, built for **PHP 8.4 + MySQL 8** on
shared cPanel SSD hosting. Replaces the Lovable Cloud (Supabase) backend
used by the React frontend.

## What's inside

```
backend-php/
├── public/            ← webroot (point cPanel "Document Root" here OR upload to public_html/api/)
│   ├── index.php      ← single entry, routes all /api/* requests
│   └── .htaccess      ← pretty URLs + CORS
├── src/
│   ├── Database.php   ← PDO singleton
│   ├── Auth.php       ← JWT + password hashing
│   ├── Response.php   ← JSON helpers
│   ├── Router.php     ← tiny router
│   └── Controllers/   ← one file per domain (Auth, Orders, Blog, Admin, ...)
├── database/
│   ├── schema.sql     ← full MySQL 8 schema (all 39 tables)
│   └── seed.sql       ← demo pricing + admin user
├── uploads/           ← file storage (avatars, reviews, announcements, samples)
├── composer.json      ← firebase/php-jwt only
└── .env.example       ← copy to .env, fill in
```

## Install on cPanel (30 minutes)

1. **Create the MySQL database** in cPanel → MySQL Databases.
   Note the DB name, user, password.
2. **Import the schema**:
   - cPanel → phpMyAdmin → select the DB → Import → upload
     `database/schema.sql` → Go.
   - Then import `database/seed.sql` the same way (creates the first admin
     user and demo pricing).
3. **Create a subdomain** `api.emailsly.com` in cPanel → Subdomains, with
   document root `public_html/api-root/`.
4. **Upload the backend**:
   - Zip the `backend-php/` folder locally.
   - cPanel → File Manager → upload + extract into `public_html/api-root/`
     so its `public/` becomes the subdomain's webroot. Move the contents of
     `public/` up to the subdomain root, OR set the subdomain document root
     directly to `public_html/api-root/public/`. Second option is safer.
5. **Install Composer deps** (Terminal in cPanel, or SSH):
   ```
   cd ~/public_html/api-root
   composer install --no-dev --optimize-autoloader
   ```
   If your host has no Composer, download `firebase/php-jwt` manually and
   place it under `vendor/`.
6. **Copy `.env.example` → `.env`** and fill in:
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
   - `JWT_SECRET` (generate: `openssl rand -hex 32`)
   - `APP_URL=https://emailsly.com`
   - `API_URL=https://api.emailsly.com`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (from Stripe dashboard)
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (cPanel email)
7. **Permissions**:
   ```
   chmod 750 uploads
   chmod 640 .env
   ```
8. **Test**: open `https://api.emailsly.com/api/health` → should return
   `{"ok":true}`.

## Default admin login

`seed.sql` creates:
- email: `admin@emailsly.com`
- password: `ChangeMe!2026`

**Change this immediately** after first login.

## Frontend wiring

In the React app, set `VITE_API_BASE_URL=https://api.emailsly.com` in `.env`
and rebuild with `bun run build`. The generated `dist/` folder can be
uploaded to `public_html/` on the same cPanel account.

## What's covered in v1

- ✅ Auth (email/password + JWT, password reset via email)
- ✅ Profiles + roles (admin / user)
- ✅ Orders (list, create, update, admin CRUD, events, messages)
- ✅ Pricing settings + audit log
- ✅ Blog CMS (posts, SEO overrides, analytics)
- ✅ Announcements
- ✅ Support tickets + messages
- ✅ Contact leads
- ✅ Reviews (public + admin moderation)
- ✅ Referrals (codes, credits, redemption)
- ✅ Chatbot (conversations, messages, orders, tickets, KB)
- ✅ Sample datasets (Apollo/LinkedIn/ZoomInfo)
- ✅ Site content + settings + social links
- ✅ File uploads (avatars, reviews, announcement media, datasets)
- ✅ Stripe checkout + webhooks
- ✅ CORS for the frontend origin

## Security notes

- All admin routes check `role = 'admin'` server-side (JWT claim).
- Passwords use PHP's native `password_hash()` with bcrypt.
- JWT expiry: 7 days. Refresh via `/api/auth/refresh`.
- SQL uses PDO prepared statements everywhere.
- File uploads validated by MIME + extension whitelist, stored outside
  webroot, served via `/api/files/{id}` with auth checks.
- Rate-limit login attempts via IP (see `Auth::login`).

## Migrating existing data

If you want your current Supabase data (users, orders, blog posts) migrated:
I can generate a one-off `migrate.php` script that reads a Postgres export
and inserts into your new MySQL DB. Just ask.