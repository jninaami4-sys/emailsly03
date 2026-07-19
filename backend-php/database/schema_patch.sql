-- =========================================================
-- Emailsly schema UPGRADE PATCH
--
-- ⚠️  DO NOT RUN THIS ON A FRESH INSTALL.
--     Fresh installs need ONLY schema.sql + seed.sql, both of which
--     already contain every column and table added below.
--
-- Run this file ONCE against databases that were created BEFORE the
-- gap-closure batch shipped and are missing the newer columns / tables.
--
-- On re-run, MySQL will complain "Duplicate column name ..." for columns
-- that already exist. Those errors are expected and safe to ignore — the
-- CREATE TABLE IF NOT EXISTS blocks and any successful ALTERs still apply.
-- Import with phpMyAdmin's "Continue on error" or:
--     mysql --force -u user -p dbname < schema_patch.sql
-- =========================================================

-- New tables (safe on both fresh and upgraded databases).
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket        VARCHAR(64) NOT NULL,
  ip            VARCHAR(64) NOT NULL,
  action        VARCHAR(64) NOT NULL,
  window_start  BIGINT NOT NULL,
  count         INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, ip, action, window_start),
  KEY idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mail_logs (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  kind         VARCHAR(32) NOT NULL,
  to_email     VARCHAR(255) NOT NULL,
  subject      VARCHAR(500) NULL,
  status       VARCHAR(32) NOT NULL DEFAULT 'sent',
  error        TEXT NULL,
  metadata     JSON NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_kind_created (kind, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stripe_webhook_deliveries (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  event_id        VARCHAR(128) NULL,
  event_type      VARCHAR(128) NULL,
  status          VARCHAR(32) NOT NULL,
  http_status     INT NULL,
  error           TEXT NULL,
  payload_snippet TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_type (event_type),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Column additions. Each on its own line so a duplicate-column error on
-- one line does not skip the others. Portable ADD COLUMN syntax (no
-- IF NOT EXISTS — that is MariaDB-only, real MySQL 8.x rejects it).

ALTER TABLE users            ADD COLUMN email_verified_at DATETIME NULL;

ALTER TABLE site_settings    ADD COLUMN invoice_logo_url VARCHAR(500) NULL;
ALTER TABLE site_settings    ADD COLUMN footer_logo_url  VARCHAR(500) NULL;

ALTER TABLE chatbot_config   ADD COLUMN greeting         TEXT NULL;
ALTER TABLE chatbot_config   ADD COLUMN human_hours_note VARCHAR(500) NULL;
ALTER TABLE chatbot_config   ADD COLUMN config           JSON NULL;

ALTER TABLE chatbot_orders   ADD COLUMN user_id  CHAR(36) NULL;
ALTER TABLE chatbot_orders   ADD COLUMN payload  JSON     NULL;

ALTER TABLE chatbot_tickets  ADD COLUMN user_id   CHAR(36)    NULL;
ALTER TABLE chatbot_tickets  ADD COLUMN ticket_no VARCHAR(32) NULL;
ALTER TABLE chatbot_tickets  ADD COLUMN body      TEXT        NULL;

ALTER TABLE sample_datasets  ADD COLUMN source       VARCHAR(64)  NULL;
ALTER TABLE sample_datasets  ADD COLUMN filename     VARCHAR(255) NULL;
ALTER TABLE sample_datasets  ADD COLUMN storage_path VARCHAR(500) NULL;
ALTER TABLE sample_datasets  ADD COLUMN data         JSON NULL;
ALTER TABLE sample_datasets  ADD COLUMN meta         JSON NULL;
ALTER TABLE sample_datasets  ADD COLUMN is_active    TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE sample_dataset_audit ADD COLUMN actor_id CHAR(36) NULL;

ALTER TABLE product_details  ADD COLUMN slug VARCHAR(128) NULL;
ALTER TABLE product_details  ADD COLUMN data JSON NULL;
CREATE INDEX product_details_slug_idx ON product_details (slug);

ALTER TABLE reviews          ADD COLUMN moderation_reason VARCHAR(500) NULL;

ALTER TABLE conversion_events ADD COLUMN name        VARCHAR(255) NULL;
ALTER TABLE conversion_events ADD COLUMN event_type  VARCHAR(64)  NULL;
ALTER TABLE conversion_events ADD COLUMN sort_order  INT NOT NULL DEFAULT 0;
ALTER TABLE conversion_events ADD COLUMN is_active   TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE conversion_events ADD COLUMN config      JSON NULL;

ALTER TABLE server_tracking_config ADD COLUMN is_enabled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE server_tracking_config ADD COLUMN config     JSON NULL;

ALTER TABLE referral_credits         ADD COLUMN batch_id CHAR(36) NULL;
ALTER TABLE referral_payout_batches  ADD COLUMN created_by CHAR(36) NULL;
ALTER TABLE referral_payout_batches  ADD COLUMN notes      TEXT NULL;

-- ---------------------------------------------------------
-- Seed / refresh static store catalogue in custom_products.
-- Idempotent — safe to re-run. Ids match src/lib/products.ts.
-- ---------------------------------------------------------
INSERT INTO custom_products
  (id, slug, name, short_desc, price_cents, compare_at_cents, currency, status, category, image_url, metadata, sort_order, is_featured)
VALUES
  ('p1','saas-founders-decision-makers','SaaS Founders & Decision Makers — 5,000 Contacts','Founders and C-suite decision makers at growing SaaS companies. Verified within the last 30 days.',7900,14900,'USD','published','SaaS Leads',NULL,JSON_OBJECT('records',5000,'geography','USA, UK, Canada','fileFormat','CSV','source','static-catalog'),1,1),
  ('p2','shopify-plus-owners','Shopify Plus Store Owners — 3,200 Contacts','Owners and founders running Shopify Plus stores doing $1M+ ARR.',6900,12900,'USD','published','Ecommerce Leads',NULL,JSON_OBJECT('records',3200,'geography','Global','fileFormat','CSV','source','static-catalog'),2,1),
  ('p3','fortune-1000-execs','Fortune 1000 Executive List — 2,500 Contacts','VP+ decision makers at Fortune 1000 companies. Includes direct-dial mobiles where available.',9900,19900,'USD','published','Executive Lists',NULL,JSON_OBJECT('records',2500,'geography','USA','fileFormat','CSV','source','static-catalog'),3,1),
  ('p4','series-a-founders-nyc','Series A Startup Founders in NYC — 1,240 Contacts','Recently funded Series-A founders based in NYC.',5900,NULL,'USD','published','Startup Founders',NULL,JSON_OBJECT('records',1240,'geography','New York Metro','fileFormat','CSV','source','static-catalog'),4,0),
  ('p5','us-real-estate-agents','US Real Estate Agents (Top Producers) — 4,800 Contacts','Top-producing real estate agents across the US, filtered by transaction volume.',6500,12000,'USD','published','Real Estate Agents',NULL,JSON_OBJECT('records',4800,'geography','United States','fileFormat','CSV','source','static-catalog'),5,0),
  ('p6','us-healthcare-decision-makers','US Healthcare Decision Makers — 1,900 Contacts','Practice owners, hospital admins, and clinic directors across the US healthcare sector.',8900,NULL,'USD','published','Healthcare Providers',NULL,JSON_OBJECT('records',1900,'geography','USA','fileFormat','CSV','source','static-catalog'),6,0),
  ('p7','european-ecom-cmos','European E-commerce CMOs — 1,650 Contacts','Chief Marketing Officers at European e-commerce brands with €10M+ revenue.',7500,NULL,'USD','published','Ecommerce Leads',NULL,JSON_OBJECT('records',1650,'geography','Europe','fileFormat','CSV','source','static-catalog'),7,0),
  ('p8','b2b-agency-owners','B2B Agency Owners & Founders — 2,100 Contacts','Owners and founders of independent B2B marketing agencies with 10–200 employees.',5500,9900,'USD','published','B2B Leads',NULL,JSON_OBJECT('records',2100,'geography','Global','fileFormat','CSV','source','static-catalog'),8,0),
  ('p9','vp-growth-fintech','VP Growth at Fintech Series B — 1,400 Contacts','Growth and revenue leaders at Series-B fintech companies with $10M–$50M ARR.',8500,NULL,'USD','published','B2B Leads',NULL,JSON_OBJECT('records',1400,'geography','USA + Canada','fileFormat','CSV','source','static-catalog'),9,0)
ON DUPLICATE KEY UPDATE
  slug=VALUES(slug), name=VALUES(name), short_desc=VALUES(short_desc),
  price_cents=VALUES(price_cents), compare_at_cents=VALUES(compare_at_cents),
  currency=VALUES(currency), status=VALUES(status), category=VALUES(category),
  metadata=VALUES(metadata), sort_order=VALUES(sort_order), is_featured=VALUES(is_featured);
