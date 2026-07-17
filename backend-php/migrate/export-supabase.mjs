#!/usr/bin/env node
/**
 * Export current Supabase (Postgres) public-schema data + auth.users to a
 * MySQL-compatible .sql dump that can be loaded straight into the
 * emailsly MySQL database created by database/schema.sql.
 *
 * Usage:
 *   # source (Supabase) — use the same PG* env vars psql uses
 *   export PGHOST=... PGPORT=5432 PGUSER=... PGPASSWORD=... PGDATABASE=postgres
 *   node backend-php/migrate/export-supabase.mjs > /mnt/documents/emailsly-data.sql
 *
 * Then on the MySQL side:
 *   mysql -u USER -p emailsly < backend-php/database/schema.sql
 *   mysql -u USER -p emailsly < /mnt/documents/emailsly-data.sql
 *   mysql -u USER -p emailsly < backend-php/database/seed.sql   # optional
 *
 * Notes:
 *  - Postgres arrays and jsonb are emitted as MySQL JSON.
 *  - booleans become 0/1, timestamps become 'YYYY-MM-DD HH:MM:SS' UTC.
 *  - Rows are inserted with INSERT IGNORE so re-runs are safe.
 *  - auth.users → profiles.password_hash carries the existing bcrypt hash
 *    from Supabase, so users can keep their current passwords.
 */

import pg from "pg";
import process from "node:process";

// Order matters: parents before children to satisfy FKs.
const TABLES = [
  // identity first
  { name: "profiles", source: "profiles_from_auth" },
  { name: "user_roles" },

  // commerce
  { name: "pricing_settings" },
  { name: "pricing_settings_audit" },
  { name: "product_details" },
  { name: "orders" },
  { name: "order_events" },
  { name: "order_messages" },

  // content
  { name: "site_content" },
  { name: "site_settings" },
  { name: "social_links" },
  { name: "announcements" },
  { name: "blog_posts" },
  { name: "blog_seo_overrides" },
  { name: "blog_analytics_events" },

  // crm
  { name: "contact_leads" },
  { name: "reviews" },
  { name: "sample_datasets" },
  { name: "sample_dataset_audit" },

  // support
  { name: "support_tickets" },
  { name: "support_ticket_messages" },

  // chatbot
  { name: "chatbot_config" },
  { name: "chatbot_conversations" },
  { name: "chatbot_messages" },
  { name: "chatbot_kb" },
  { name: "chatbot_orders" },
  { name: "chatbot_tickets" },
  { name: "chatbot_telegram_map" },

  // referrals
  { name: "referral_settings" },
  { name: "referrals" },
  { name: "referral_credits" },
  { name: "referral_clicks" },
  { name: "referral_payout_batches" },

  // analytics + logs
  { name: "conversion_events" },
  { name: "server_event_log" },
  { name: "server_tracking_config" },
  { name: "stripe_events" },
];

const BATCH = 500;

function escapeMysql(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (v instanceof Date) {
    // 'YYYY-MM-DD HH:MM:SS' UTC
    return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
  }
  if (Array.isArray(v) || (typeof v === "object")) {
    return `'${JSON.stringify(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  }
  const s = String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `'${s}'`;
}

async function getColumns(client, schema, table) {
  const r = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, table],
  );
  return r.rows.map((x) => x.column_name);
}

async function dumpTable(client, table) {
  const cols = await getColumns(client, "public", table);
  if (!cols.length) {
    process.stderr.write(`skip: public.${table} not found\n`);
    return;
  }
  const quoted = cols.map((c) => `\`${c}\``).join(",");
  process.stdout.write(`\n-- ${table}\n`);

  const cursor = await client.query({
    text: `SELECT ${cols.map((c) => `"${c}"`).join(",")} FROM public."${table}"`,
    rowMode: "array",
  });

  let count = 0;
  for (let i = 0; i < cursor.rows.length; i += BATCH) {
    const chunk = cursor.rows.slice(i, i + BATCH);
    const values = chunk
      .map((row) => `(${row.map(escapeMysql).join(",")})`)
      .join(",\n  ");
    process.stdout.write(
      `INSERT IGNORE INTO \`${table}\` (${quoted}) VALUES\n  ${values};\n`,
    );
    count += chunk.length;
  }
  process.stderr.write(`  ${table}: ${count} rows\n`);
}

/**
 * Build profiles rows by joining public.profiles with auth.users so we
 * carry the existing email + bcrypt password hash into the MySQL profiles
 * table. Any public.profiles row without a matching auth.users row is
 * still exported (password_hash = NULL — user must reset).
 */
async function dumpProfilesFromAuth(client) {
  const cols = await getColumns(client, "public", "profiles");
  const authFields = new Set(["email", "password_hash"]);
  // Ensure profiles table has email + password_hash columns (schema.sql does).
  const targetCols = Array.from(new Set([...cols, ...authFields]));
  const quoted = targetCols.map((c) => `\`${c}\``).join(",");

  const selectExprs = targetCols.map((c) => {
    if (c === "email") return `COALESCE(u.email, p.email) AS email`;
    if (c === "password_hash") return `u.encrypted_password AS password_hash`;
    return `p."${c}" AS "${c}"`;
  });

  const q = `
    SELECT ${selectExprs.join(", ")}
      FROM public.profiles p
      LEFT JOIN auth.users u ON u.id = p.user_id
  `;
  const r = await client.query({ text: q, rowMode: "array" });

  process.stdout.write(`\n-- profiles (joined with auth.users)\n`);
  let count = 0;
  for (let i = 0; i < r.rows.length; i += BATCH) {
    const chunk = r.rows.slice(i, i + BATCH);
    const values = chunk
      .map((row) => `(${row.map(escapeMysql).join(",")})`)
      .join(",\n  ");
    process.stdout.write(
      `INSERT IGNORE INTO \`profiles\` (${quoted}) VALUES\n  ${values};\n`,
    );
    count += chunk.length;
  }
  process.stderr.write(`  profiles: ${count} rows (with auth.users join)\n`);
}

async function main() {
  const client = new pg.Client();
  await client.connect();

  process.stdout.write(
    `-- Emailsly Supabase → MySQL data export\n` +
      `-- Generated: ${new Date().toISOString()}\n` +
      `SET NAMES utf8mb4;\n` +
      `SET FOREIGN_KEY_CHECKS = 0;\n` +
      `SET UNIQUE_CHECKS = 0;\n`,
  );

  try {
    for (const t of TABLES) {
      if (t.source === "profiles_from_auth") {
        await dumpProfilesFromAuth(client);
      } else {
        await dumpTable(client, t.name);
      }
    }
  } finally {
    process.stdout.write(
      `\nSET FOREIGN_KEY_CHECKS = 1;\nSET UNIQUE_CHECKS = 1;\n`,
    );
    await client.end();
  }
}

main().catch((e) => {
  process.stderr.write(`error: ${e?.stack || e}\n`);
  process.exit(1);
});