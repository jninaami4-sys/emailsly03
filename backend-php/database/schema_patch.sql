-- =========================================================
-- Emailsly schema patch (Batch: gap closure)
-- Idempotent-ish additions for endpoint coverage.
-- Requires MySQL 8.0.29+ (ADD COLUMN IF NOT EXISTS).
-- Safe to run multiple times.
-- =========================================================

-- Rate limiter (MySQL-backed, shared-hosting friendly).
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket        VARCHAR(64) NOT NULL,
  ip            VARCHAR(64) NOT NULL,
  action        VARCHAR(64) NOT NULL,
  window_start  BIGINT NOT NULL,
  count         INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, ip, action, window_start),
  KEY idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mail delivery log (used by /api/admin/mail-logs, MailLogsAdmin).
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

-- Stripe webhook delivery log (used by /api/admin/stripe/deliveries).
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

-- Users: email verification timestamp used by OTP flow.
ALTER TABLE users            ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL;

-- Site settings: extra logo asset slots the admin panel uploads.
ALTER TABLE site_settings    ADD COLUMN IF NOT EXISTS invoice_logo_url VARCHAR(500) NULL;
ALTER TABLE site_settings    ADD COLUMN IF NOT EXISTS footer_logo_url  VARCHAR(500) NULL;

-- Chatbot config: greeting / human hours + freeform config blob.
ALTER TABLE chatbot_config   ADD COLUMN IF NOT EXISTS greeting          TEXT NULL;
ALTER TABLE chatbot_config   ADD COLUMN IF NOT EXISTS human_hours_note  VARCHAR(500) NULL;
ALTER TABLE chatbot_config   ADD COLUMN IF NOT EXISTS config            JSON NULL;

-- Chatbot orders/tickets: authenticated user linkage + payload.
ALTER TABLE chatbot_orders   ADD COLUMN IF NOT EXISTS user_id  CHAR(36) NULL;
ALTER TABLE chatbot_orders   ADD COLUMN IF NOT EXISTS payload  JSON     NULL;
ALTER TABLE chatbot_tickets  ADD COLUMN IF NOT EXISTS user_id   CHAR(36) NULL;
ALTER TABLE chatbot_tickets  ADD COLUMN IF NOT EXISTS ticket_no VARCHAR(32) NULL;
ALTER TABLE chatbot_tickets  ADD COLUMN IF NOT EXISTS body      TEXT NULL;

-- Sample datasets: extended shape for the admin CMS editor.
ALTER TABLE sample_datasets  ADD COLUMN IF NOT EXISTS source       VARCHAR(64) NULL;
ALTER TABLE sample_datasets  ADD COLUMN IF NOT EXISTS filename     VARCHAR(255) NULL;
ALTER TABLE sample_datasets  ADD COLUMN IF NOT EXISTS storage_path VARCHAR(500) NULL;
ALTER TABLE sample_datasets  ADD COLUMN IF NOT EXISTS data         JSON NULL;
ALTER TABLE sample_datasets  ADD COLUMN IF NOT EXISTS meta         JSON NULL;
ALTER TABLE sample_datasets  ADD COLUMN IF NOT EXISTS is_active    TINYINT(1) NOT NULL DEFAULT 1;

-- Sample dataset audit: actor id column referenced by extras controller.
ALTER TABLE sample_dataset_audit ADD COLUMN IF NOT EXISTS actor_id CHAR(36) NULL;

-- Product details: slug + JSON blob for the new admin CMS.
ALTER TABLE product_details  ADD COLUMN IF NOT EXISTS slug VARCHAR(128) NULL;
ALTER TABLE product_details  ADD COLUMN IF NOT EXISTS data JSON NULL;
CREATE INDEX IF NOT EXISTS product_details_slug_idx ON product_details (slug);

-- Reviews: moderation reason column.
ALTER TABLE reviews          ADD COLUMN IF NOT EXISTS moderation_reason VARCHAR(500) NULL;

-- Conversion events: turn into a definitions table (admin-editable).
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS name        VARCHAR(255) NULL;
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS event_type  VARCHAR(64) NULL;
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS sort_order  INT NOT NULL DEFAULT 0;
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS is_active   TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE conversion_events ADD COLUMN IF NOT EXISTS config      JSON NULL;

-- Server tracking config: mirror admin-form field names.
ALTER TABLE server_tracking_config ADD COLUMN IF NOT EXISTS is_enabled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE server_tracking_config ADD COLUMN IF NOT EXISTS config     JSON NULL;

-- Referrals: reviewer notes + payout batch id linkage.
ALTER TABLE referral_credits         ADD COLUMN IF NOT EXISTS batch_id CHAR(36) NULL;
ALTER TABLE referral_payout_batches  ADD COLUMN IF NOT EXISTS created_by CHAR(36) NULL;
ALTER TABLE referral_payout_batches  ADD COLUMN IF NOT EXISTS notes      TEXT NULL;
