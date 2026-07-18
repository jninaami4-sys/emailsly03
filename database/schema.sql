-- ============================================================================
-- Emailsly MySQL schema — full backend for the PHP API.
-- Import once on your host:  mysql -u USER -p DBNAME < schema.sql
-- Then run seeds.sql for default rows.
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ---------------------------------------------------------------------------
-- Users & auth
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              CHAR(36)      NOT NULL PRIMARY KEY,
  email           VARCHAR(255)  NOT NULL,
  password_hash   VARCHAR(255)  NULL,
  email_verified  TINYINT(1)    NOT NULL DEFAULT 0,
  full_name       VARCHAR(255)  NULL,
  avatar_url      TEXT          NULL,
  disabled        TINYINT(1)    NOT NULL DEFAULT 0,
  last_login_at   DATETIME      NULL,
  meta            JSON          NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id   CHAR(36)                            NOT NULL,
  role      ENUM('admin','moderator','user')    NOT NULL,
  created_at DATETIME                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_otps (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255)  NOT NULL,
  code_hash    CHAR(64)      NOT NULL,
  purpose      VARCHAR(32)   NOT NULL DEFAULT 'signup',
  expires_at   DATETIME      NOT NULL,
  consumed_at  DATETIME      NULL,
  attempts     INT           NOT NULL DEFAULT 0,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_email_purpose (email, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  token_hash  CHAR(64)     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  consumed_at DATETIME     NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pr_token (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  user_id             CHAR(36)     NOT NULL PRIMARY KEY,
  email               VARCHAR(255) NOT NULL,
  full_name           VARCHAR(255) NULL,
  company             VARCHAR(255) NULL,
  phone               VARCHAR(64)  NULL,
  country             VARCHAR(64)  NULL,
  avatar_url          TEXT         NULL,
  referral_code       VARCHAR(16)  NULL,
  referred_by_user_id CHAR(36)     NULL,
  bio                 TEXT         NULL,
  preferences         JSON         NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_profiles_email (email),
  UNIQUE KEY uq_profiles_referral (referral_code),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                   CHAR(36)     NOT NULL PRIMARY KEY,
  user_id              CHAR(36)     NULL,
  email                VARCHAR(255) NULL,
  status               VARCHAR(32)  NOT NULL DEFAULT 'pending',
  payment_status       VARCHAR(32)  NOT NULL DEFAULT 'unpaid',
  payment_provider     VARCHAR(32)  NULL,
  payment_ref          VARCHAR(191) NULL,
  service_id           VARCHAR(64)  NULL,
  service_label        VARCHAR(255) NULL,
  quantity             INT          NOT NULL DEFAULT 1,
  currency             VARCHAR(8)   NOT NULL DEFAULT 'USD',
  subtotal_cents       INT          NOT NULL DEFAULT 0,
  discount_cents       INT          NOT NULL DEFAULT 0,
  tax_cents            INT          NOT NULL DEFAULT 0,
  total_cents          INT          NOT NULL DEFAULT 0,
  promo_code           VARCHAR(64)  NULL,
  notes                TEXT         NULL,
  delivery_url         TEXT         NULL,
  delivery_path        TEXT         NULL,
  filters              JSON         NULL,
  items                JSON         NULL,
  metadata             JSON         NULL,
  archived_at          DATETIME     NULL,
  delivered_at         DATETIME     NULL,
  cancelled_at         DATETIME     NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_orders_user (user_id),
  KEY idx_orders_email (email),
  KEY idx_orders_status (status),
  KEY idx_orders_archived (archived_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_events (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id   CHAR(36)     NOT NULL,
  event_type VARCHAR(64)  NOT NULL,
  actor_id   CHAR(36)     NULL,
  actor_role VARCHAR(32)  NULL,
  message    TEXT         NULL,
  payload    JSON         NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_oe_order (order_id),
  CONSTRAINT fk_oe_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_messages (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id   CHAR(36)     NOT NULL,
  sender_id  CHAR(36)     NULL,
  sender_role VARCHAR(32) NOT NULL DEFAULT 'customer',
  body       TEXT         NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_om_order (order_id),
  CONSTRAINT fk_om_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Products / pricing / site content
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_products (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  slug          VARCHAR(120) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  description   TEXT         NULL,
  price_cents   INT          NOT NULL DEFAULT 0,
  currency      VARCHAR(8)   NOT NULL DEFAULT 'USD',
  category      VARCHAR(64)  NULL,
  image_url     TEXT         NULL,
  features      JSON         NULL,
  metadata      JSON         NULL,
  visible       TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_products_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_details (
  service_id  VARCHAR(64)  NOT NULL PRIMARY KEY,
  content     JSON         NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pricing_settings (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  service_id   VARCHAR(64)  NOT NULL,
  name         VARCHAR(255) NOT NULL,
  rate         DECIMAL(10,4) NOT NULL DEFAULT 0,
  min_qty      INT          NOT NULL DEFAULT 1,
  min_order    DECIMAL(10,2) NOT NULL DEFAULT 0,
  helper       TEXT         NULL,
  published    TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order   INT          NOT NULL DEFAULT 0,
  meta         JSON         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pricing_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_settings (
  id                    TINYINT(1)   NOT NULL PRIMARY KEY DEFAULT 1,
  brand_name            VARCHAR(255) NULL,
  logo_url              TEXT         NULL,
  favicon_url           TEXT         NULL,
  invoice_logo_url      TEXT         NULL,
  footer_logo_url       TEXT         NULL,
  primary_color         VARCHAR(32)  NULL,
  contact_email         VARCHAR(255) NULL,
  meta                  JSON         NULL,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_content (
  section    VARCHAR(64) NOT NULL PRIMARY KEY,
  content    JSON        NOT NULL,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS social_links (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  platform   VARCHAR(64)  NOT NULL,
  url        TEXT         NOT NULL,
  icon       VARCHAR(64)  NULL,
  label      VARCHAR(120) NULL,
  visible    TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Reviews / support / contact / announcements / offers / campaigns / bots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  user_id       CHAR(36)     NULL,
  email         VARCHAR(255) NULL,
  display_name  VARCHAR(120) NULL,
  rating        TINYINT      NOT NULL DEFAULT 5,
  title         VARCHAR(255) NULL,
  body          TEXT         NULL,
  status        VARCHAR(32)  NOT NULL DEFAULT 'pending',
  image_url     TEXT         NULL,
  approved_at   DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_reviews_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  user_id        CHAR(36)     NULL,
  email          VARCHAR(255) NULL,
  subject        VARCHAR(255) NOT NULL,
  status         VARCHAR(32)  NOT NULL DEFAULT 'open',
  priority       VARCHAR(32)  NOT NULL DEFAULT 'normal',
  assignee_id    CHAR(36)     NULL,
  last_message_at DATETIME    NULL,
  meta           JSON         NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tickets_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id   CHAR(36)    NOT NULL,
  sender_id   CHAR(36)    NULL,
  sender_role VARCHAR(32) NOT NULL DEFAULT 'customer',
  body        TEXT        NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_stm_ticket (ticket_id),
  CONSTRAINT fk_stm_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_leads (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  name         VARCHAR(255) NULL,
  email        VARCHAR(255) NULL,
  phone        VARCHAR(64)  NULL,
  company      VARCHAR(255) NULL,
  message      TEXT         NULL,
  source       VARCHAR(64)  NULL,
  status       VARCHAR(32)  NOT NULL DEFAULT 'new',
  notes        TEXT         NULL,
  meta         JSON         NULL,
  ip           VARCHAR(64)  NULL,
  user_agent   TEXT         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  body         TEXT         NULL,
  image_url    TEXT         NULL,
  video_url    TEXT         NULL,
  cta_label    VARCHAR(120) NULL,
  cta_url      TEXT         NULL,
  placement    VARCHAR(32)  NOT NULL DEFAULT 'modal',
  audience     VARCHAR(32)  NOT NULL DEFAULT 'all',
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  starts_at    DATETIME     NULL,
  ends_at      DATETIME     NULL,
  priority     INT          NOT NULL DEFAULT 0,
  meta         JSON         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_offers (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  subtitle     VARCHAR(255) NULL,
  badge        VARCHAR(64)  NULL,
  discount_pct INT          NULL,
  cta_label    VARCHAR(120) NULL,
  cta_url      TEXT         NULL,
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  starts_at    DATETIME     NULL,
  ends_at      DATETIME     NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  meta         JSON         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaigns (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  channel      VARCHAR(64)  NOT NULL DEFAULT 'email',
  subject      VARCHAR(255) NULL,
  content      LONGTEXT     NULL,
  audience     VARCHAR(64)  NULL,
  status       VARCHAR(32)  NOT NULL DEFAULT 'draft',
  scheduled_at DATETIME     NULL,
  sent_at      DATETIME     NULL,
  stats        JSON         NULL,
  meta         JSON         NULL,
  created_by   CHAR(36)     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS telegram_bots (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  token        VARCHAR(255) NOT NULL,
  chat_id      VARCHAR(120) NULL,
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  notify_on    JSON         NULL,
  meta         JSON         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS legacy_order_imports (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  batch_ref    VARCHAR(120) NULL,
  row_count    INT          NOT NULL DEFAULT 0,
  ok_count     INT          NOT NULL DEFAULT 0,
  error_count  INT          NOT NULL DEFAULT 0,
  errors       JSON         NULL,
  created_by   CHAR(36)     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  slug           VARCHAR(191) NOT NULL,
  title          VARCHAR(255) NOT NULL,
  excerpt        TEXT         NULL,
  body_md        LONGTEXT     NULL,
  body_html      LONGTEXT     NULL,
  cover_url      TEXT         NULL,
  author_id      CHAR(36)     NULL,
  author_name    VARCHAR(255) NULL,
  tags           JSON         NULL,
  status         VARCHAR(32)  NOT NULL DEFAULT 'draft',
  published_at   DATETIME     NULL,
  reading_minutes INT         NULL,
  meta           JSON         NULL,
  seo_title      VARCHAR(255) NULL,
  seo_description VARCHAR(500) NULL,
  seo_og_image   TEXT         NULL,
  seo_canonical  TEXT         NULL,
  view_count     INT          NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_blog_slug (slug),
  KEY idx_blog_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_analytics_events (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_slug  VARCHAR(191) NOT NULL,
  event_type VARCHAR(64)  NOT NULL,
  visitor_id VARCHAR(64)  NULL,
  session_id VARCHAR(64)  NULL,
  referrer   TEXT         NULL,
  path       TEXT         NULL,
  meta       JSON         NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_bae_slug (post_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_seo_overrides (
  slug            VARCHAR(191) NOT NULL PRIMARY KEY,
  title           VARCHAR(255) NULL,
  description     VARCHAR(500) NULL,
  og_image        TEXT         NULL,
  canonical       TEXT         NULL,
  robots          VARCHAR(64)  NULL,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Chatbot / KB / conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chatbot_config (
  id         TINYINT(1)   NOT NULL PRIMARY KEY DEFAULT 1,
  enabled    TINYINT(1)   NOT NULL DEFAULT 1,
  greeting   TEXT         NULL,
  persona    TEXT         NULL,
  model      VARCHAR(120) NULL,
  temperature DECIMAL(4,2) NULL,
  meta       JSON         NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chatbot_kb (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  content    LONGTEXT     NOT NULL,
  tags       JSON         NULL,
  source     VARCHAR(64)  NULL,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  meta       JSON         NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  user_id     CHAR(36)     NULL,
  email       VARCHAR(255) NULL,
  status      VARCHAR(32)  NOT NULL DEFAULT 'open',
  channel     VARCHAR(32)  NOT NULL DEFAULT 'web',
  handoff_to  VARCHAR(120) NULL,
  meta        JSON         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id CHAR(36)     NOT NULL,
  sender          VARCHAR(32)  NOT NULL,
  body            LONGTEXT     NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cm_conv (conversation_id),
  CONSTRAINT fk_cm_conv FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chatbot_tickets (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  conversation_id CHAR(36)     NULL,
  email           VARCHAR(255) NULL,
  subject         VARCHAR(255) NULL,
  body            TEXT         NULL,
  status          VARCHAR(32)  NOT NULL DEFAULT 'open',
  ip              VARCHAR(64)  NULL,
  meta            JSON         NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chatbot_orders (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  conversation_id CHAR(36)     NULL,
  email           VARCHAR(255) NULL,
  payload         JSON         NOT NULL,
  status          VARCHAR(32)  NOT NULL DEFAULT 'pending',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Referrals / promos / payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
  id                    CHAR(36)     NOT NULL PRIMARY KEY,
  referrer_id           CHAR(36)     NOT NULL,
  referred_user_id      CHAR(36)     NOT NULL,
  order_id              CHAR(36)     NULL,
  status                VARCHAR(32)  NOT NULL DEFAULT 'pending',
  admin_review_state    VARCHAR(32)  NOT NULL DEFAULT 'auto',
  reward_referrer_cents INT          NOT NULL DEFAULT 0,
  reward_referred_cents INT          NOT NULL DEFAULT 0,
  currency              VARCHAR(8)   NOT NULL DEFAULT 'USD',
  flag_reasons          JSON         NULL,
  meta                  JSON         NULL,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ref_referred (referred_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referral_credits (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      CHAR(36)     NOT NULL,
  delta_cents  INT          NOT NULL,
  currency     VARCHAR(8)   NOT NULL DEFAULT 'USD',
  source       VARCHAR(64)  NOT NULL,
  referral_id  CHAR(36)     NULL,
  order_id     CHAR(36)     NULL,
  notes        TEXT         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rc_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referral_settings (
  id                TINYINT(1)   NOT NULL PRIMARY KEY DEFAULT 1,
  reward_percent    DECIMAL(6,4) NOT NULL DEFAULT 0.1000,
  min_order_cents   INT          NULL,
  monthly_cap_cents INT          NULL,
  meta              JSON         NULL,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referral_clicks (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(16)  NOT NULL,
  ip         VARCHAR(64)  NULL,
  user_agent TEXT         NULL,
  referrer   TEXT         NULL,
  landing    TEXT         NULL,
  visitor_id VARCHAR(64)  NULL,
  meta       JSON         NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rcl_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promos (
  code             VARCHAR(64)  NOT NULL PRIMARY KEY,
  kind             VARCHAR(32)  NOT NULL DEFAULT 'percent',
  value            INT          NOT NULL DEFAULT 0,
  min_subtotal_cents INT        NULL,
  applies_to       VARCHAR(64)  NULL,
  usage_limit      INT          NULL,
  used_count       INT          NOT NULL DEFAULT 0,
  starts_at        DATETIME     NULL,
  ends_at          DATETIME     NULL,
  active           TINYINT(1)   NOT NULL DEFAULT 1,
  meta             JSON         NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stripe_events (
  id           VARCHAR(191) NOT NULL PRIMARY KEY,
  type         VARCHAR(120) NOT NULL,
  payload      LONGTEXT     NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Analytics / tracking / audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversion_events (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type    VARCHAR(64)  NOT NULL,
  event_id      VARCHAR(120) NULL,
  order_id      CHAR(36)     NULL,
  user_id       CHAR(36)     NULL,
  email         VARCHAR(255) NULL,
  value_cents   INT          NULL,
  currency      VARCHAR(8)   NULL,
  channel       VARCHAR(64)  NULL,
  meta          JSON         NULL,
  ip            VARCHAR(64)  NULL,
  user_agent    TEXT         NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS server_tracking_config (
  id                    TINYINT(1)  NOT NULL PRIMARY KEY DEFAULT 1,
  meta_pixel_id         VARCHAR(120) NULL,
  meta_access_token     VARCHAR(255) NULL,
  ga4_measurement_id    VARCHAR(120) NULL,
  ga4_api_secret        VARCHAR(255) NULL,
  google_ads_id         VARCHAR(120) NULL,
  google_ads_label      VARCHAR(120) NULL,
  test_event_code       VARCHAR(64)  NULL,
  meta                  JSON         NULL,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS server_event_log (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  provider     VARCHAR(64)  NOT NULL,
  event_type   VARCHAR(120) NOT NULL,
  status       VARCHAR(32)  NOT NULL,
  request      JSON         NULL,
  response     JSON         NULL,
  error        TEXT         NULL,
  meta         JSON         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Sample datasets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sample_datasets (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT         NULL,
  storage_path VARCHAR(500) NOT NULL,
  size_bytes   BIGINT       NULL,
  visible      TINYINT(1)   NOT NULL DEFAULT 1,
  meta         JSON         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sample_dataset_audit (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  dataset_id   CHAR(36)     NULL,
  actor_id     CHAR(36)     NULL,
  actor_email  VARCHAR(255) NULL,
  action       VARCHAR(64)  NOT NULL,
  meta         JSON         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
