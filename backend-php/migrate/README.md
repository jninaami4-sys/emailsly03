# Supabase → MySQL migration

One-time flow that copies every row from your live Supabase project into the
MySQL database defined by `backend-php/database/schema.sql`.

## What it does

1. Connects to Supabase using standard `PG*` env vars (same ones `psql` uses).
2. Streams each `public.*` table (in FK-safe order) and writes MySQL-shaped
   `INSERT IGNORE` statements to stdout — so re-runs never duplicate rows.
3. Joins `public.profiles` with `auth.users` so email + existing bcrypt
   password hash land in the MySQL `profiles` table. Users keep their
   current passwords.

Postgres types are normalised: `bool → 0/1`, `jsonb`/arrays → JSON strings,
`timestamp` → `'YYYY-MM-DD HH:MM:SS'` UTC, `uuid` stays as `CHAR(36)`.

## Prereqs

- Node 18+ on the machine running the export (only `pg` is needed).
- Network access to Supabase Postgres.
- MySQL 8.x target already created and empty.

```bash
cd backend-php/migrate
npm init -y >/dev/null && npm i pg
```

## 1. Get Supabase connection details

Cloud → Advanced settings → Database → Connection string (session pooler).
Set the standard env vars:

```bash
export PGHOST=aws-0-...pooler.supabase.com
export PGPORT=5432
export PGUSER=postgres.<project-ref>
export PGPASSWORD='...'
export PGDATABASE=postgres
```

## 2. Export

```bash
node backend-php/migrate/export-supabase.mjs > /mnt/documents/emailsly-data.sql
```

Progress (row counts per table) is printed to stderr. The generated file
starts with `SET FOREIGN_KEY_CHECKS = 0` so tables can be loaded in any order.

## 3. Load into MySQL

```bash
# a. Create schema
mysql -u emailsly -p emailsly < backend-php/database/schema.sql

# b. Load data
mysql -u emailsly -p emailsly < /mnt/documents/emailsly-data.sql

# c. (Optional) seed defaults for anything empty — safe to run any time,
#    every row is upserted / INSERT IGNORE.
mysql -u emailsly -p emailsly < backend-php/database/seed.sql
```

## 4. Verify

```sql
SELECT 'orders'         AS t, COUNT(*) FROM orders
UNION ALL SELECT 'profiles',      COUNT(*) FROM profiles
UNION ALL SELECT 'blog_posts',    COUNT(*) FROM blog_posts
UNION ALL SELECT 'pricing',       COUNT(*) FROM pricing_settings
UNION ALL SELECT 'reviews',       COUNT(*) FROM reviews
UNION ALL SELECT 'referrals',     COUNT(*) FROM referrals;
```

Compare against the same counts on Supabase:

```bash
psql -c "SELECT 'orders', COUNT(*) FROM orders
         UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
         UNION ALL SELECT 'blog_posts', COUNT(*) FROM blog_posts
         UNION ALL SELECT 'pricing_settings', COUNT(*) FROM pricing_settings
         UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
         UNION ALL SELECT 'referrals', COUNT(*) FROM referrals"
```

## 5. Safety notes

- **Idempotent.** Re-running the export + load is safe — every insert is
  `INSERT IGNORE` and every `id` is preserved from Supabase, so foreign keys
  stay intact.
- **Passwords.** Supabase stores bcrypt hashes in `auth.users.encrypted_password`
  (same format PHP's `password_verify()` uses), so imported users can log in
  with their current password. Users created only via magic link / OAuth have
  no password hash — they need to hit "Forgot password" after cutover.
- **User IDs stable.** Supabase `auth.users.id` → MySQL `profiles.user_id`,
  so every FK that referenced a user still resolves.
- **Storage buckets** (`avatars`, `reviews`, `announcement-media`,
  `sample-datasets`) live in Supabase Storage — the SQL dump does NOT copy
  files. Download those buckets separately and drop them into
  `backend-php/uploads/<bucket>/` before flipping DNS.
- **Realtime / triggers** don't come across. The MySQL schema already
  implements the equivalent business rules in PHP controllers.
- **Cutover.** Do a dry-run migration first, verify counts, then repeat during
  a short maintenance window with the app in read-only mode so no rows are
  written to Supabase after the export starts.