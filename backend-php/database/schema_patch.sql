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
