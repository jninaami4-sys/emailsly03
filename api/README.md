> **⚠️ DEPRECATED — do not deploy this folder.** This `api/` folder is an early "Batch 1" prototype (auth + uploads + settings only). The production backend is **`backend-php/`** — follow **`DEPLOY.md`** in the repo root. Deploying `api/` will leave most of the site's endpoints (orders, blog, chatbot, referrals, Stripe…) missing.

# Emailsly PHP + MySQL API

Zero-dependency PHP 8.1+ backend. Drop the `api/` folder into your webroot, point Apache/Nginx to it, and the frontend can call it via `VITE_API_BASE_URL`.

## Deploy

1. **Upload** `api/` and `database/` to your host.
2. **Create DB + user**, then import schema:
   ```
   mysql -u USER -p DBNAME < database/schema.sql
   mysql -u USER -p DBNAME < database/seeds.sql
   ```
3. **Copy config**:
   ```
   cp api/config.local.example.php api/config.local.php
   nano api/config.local.php   # DB creds, JWT_SECRET (openssl rand -hex 32), SMTP, Stripe, CORS
   ```
4. **Web server**:
   - **Apache**: the included `api/.htaccess` handles routing. Ensure `AllowOverride All` is enabled for the folder.
   - **Nginx**: add
     ```
     location /api/ {
         try_files $uri $uri/ /api/index.php$is_args$args;
     }
     ```
5. **Writable folder** for uploads:
   ```
   chmod -R 775 api/uploads
   chown -R www-data:www-data api/uploads   # (or your PHP user)
   ```
6. **Test**:
   - `curl https://api.yourdomain.com/api/health` → `{"ok":true,...}`
7. **Frontend**: set `VITE_API_BASE_URL=https://api.yourdomain.com` and rebuild, OR add `<script>window.__API_BASE__="https://api.yourdomain.com";</script>` to `index.html`.

## What's here (Batch 1)

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Liveness + DB check |
| `POST /api/auth/register` | Signup → sends OTP |
| `POST /api/auth/otp/verify` | Verify OTP → returns JWT |
| `POST /api/auth/otp/resend` | Resend OTP (30s throttle) |
| `POST /api/auth/login` | Password login → JWT |
| `POST /api/auth/logout` | Client discards token |
| `GET  /api/auth/me` | Current user + profile |
| `PATCH /api/auth/me` | Update profile |
| `POST /api/auth/refresh` | Rotate token |
| `POST /api/auth/password/forgot` | Email reset link |
| `POST /api/auth/password/reset` | Consume reset token |
| `GET  /api/site-settings` | Public brand + settings |
| `PATCH /api/admin/site-settings` | Admin: update settings |
| `POST /api/uploads` | Multipart upload (buckets: brand-assets, avatars, reviews, announcement-media, sample-datasets) |
| `POST /api/uploads/sign` | Signed URL for private bucket |
| `DELETE /api/uploads` | Admin: delete stored file |

**Batch 2+** (next turns) will add: orders (customer + admin), products, pricing, reviews, chatbot, blog, referrals, promos, tickets, contact leads, announcements, offers, telegram bots, campaigns, Stripe checkout + webhook, analytics, backup/restore, CSV import.

## Making the first admin user

After signup + OTP verify, run once in MySQL:
```sql
INSERT INTO user_roles (user_id, role)
  SELECT id, 'admin' FROM users WHERE email = 'you@yourdomain.com'
  ON DUPLICATE KEY UPDATE role = 'admin';
```
Then log out and back in so the new JWT carries the admin role.
