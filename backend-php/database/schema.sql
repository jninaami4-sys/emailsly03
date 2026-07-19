-- Emailsly MySQL 8 schema
-- All timestamps UTC. All IDs are CHAR(36) UUIDs.
-- Import via phpMyAdmin or `mysql -u user -p dbname < schema.sql`

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- USERS + PROFILES + ROLES
-- =========================================================
CREATE TABLE users (
  id                CHAR(36) NOT NULL PRIMARY KEY,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  email_verified    TINYINT(1) NOT NULL DEFAULT 0,
  email_verified_at DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at     DATETIME NULL
) ENGINE=InnoDB;

CREATE TABLE password_resets (
  token       CHAR(64) NOT NULL PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  expires_at  DATETIME NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id)
) ENGINE=InnoDB;

CREATE TABLE profiles (
  user_id             CHAR(36) NOT NULL PRIMARY KEY,
  email               VARCHAR(255) NULL,
  full_name           VARCHAR(255) NULL,
  avatar_url          VARCHAR(500) NULL,
  company             VARCHAR(255) NULL,
  phone               VARCHAR(50) NULL,
  bio                 TEXT NULL,
  referral_code       VARCHAR(16) NULL UNIQUE,
  referred_by_user_id CHAR(36) NULL,
  metadata            JSON NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (referred_by_user_id)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  id       CHAR(36) NOT NULL PRIMARY KEY,
  user_id  CHAR(36) NOT NULL,
  role     ENUM('admin','moderator','user') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_role (user_id, role),
  INDEX (user_id)
) ENGINE=InnoDB;

-- =========================================================
-- ORDERS
-- =========================================================
CREATE TABLE orders (
  id                CHAR(36) NOT NULL PRIMARY KEY,
  user_id           CHAR(36) NULL,
  status            VARCHAR(32) NOT NULL DEFAULT 'pending',
  payment_status    VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  payment_provider  VARCHAR(32) NULL,
  payment_ref       VARCHAR(255) NULL,
  service           VARCHAR(255) NULL,
  service_id        VARCHAR(64) NULL,
  quantity          INT NOT NULL DEFAULT 1,
  unit_cents        INT NOT NULL DEFAULT 0,
  subtotal_cents    INT NOT NULL DEFAULT 0,
  discount_cents    INT NOT NULL DEFAULT 0,
  total_cents       INT NOT NULL DEFAULT 0,
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  customer_email    VARCHAR(255) NULL,
  customer_name     VARCHAR(255) NULL,
  notes             TEXT NULL,
  metadata          JSON NULL,
  cancel_reason     VARCHAR(255) NULL,
  refund_reason     VARCHAR(255) NULL,
  paid_at           DATETIME NULL,
  cancelled_at      DATETIME NULL,
  refunded_at       DATETIME NULL,
  delivered_at      DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (user_id), INDEX (status), INDEX (payment_status), INDEX (created_at)
) ENGINE=InnoDB;

CREATE TABLE order_events (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  order_id   CHAR(36) NOT NULL,
  actor_id   CHAR(36) NULL,
  event_type VARCHAR(64) NOT NULL,
  message    TEXT NULL,
  metadata   JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (order_id)
) ENGINE=InnoDB;

CREATE TABLE order_messages (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  order_id   CHAR(36) NOT NULL,
  sender_id  CHAR(36) NULL,
  sender_role ENUM('customer','admin','system') NOT NULL DEFAULT 'customer',
  body       TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (order_id)
) ENGINE=InnoDB;

-- =========================================================
-- PRICING
-- =========================================================
CREATE TABLE pricing_settings (
  id            CHAR(36) NOT NULL PRIMARY KEY,
  service_id    VARCHAR(64) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  category      VARCHAR(64) NULL,
  rate          DECIMAL(10,4) NOT NULL DEFAULT 0,
  min_qty       INT NOT NULL DEFAULT 1,
  min_order     INT NOT NULL DEFAULT 0,
  helper        TEXT NULL,
  currency      CHAR(3) NOT NULL DEFAULT 'USD',
  published     TINYINT(1) NOT NULL DEFAULT 1,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE pricing_settings_audit (
  id                CHAR(36) NOT NULL PRIMARY KEY,
  service_id        VARCHAR(64) NOT NULL,
  service_name      VARCHAR(255) NULL,
  changed_by        CHAR(36) NULL,
  changed_by_email  VARCHAR(255) NULL,
  changes           JSON NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (service_id)
) ENGINE=InnoDB;

-- =========================================================
-- BLOG
-- =========================================================
CREATE TABLE blog_posts (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  slug            VARCHAR(255) NOT NULL UNIQUE,
  title           VARCHAR(255) NOT NULL,
  excerpt         TEXT NULL,
  body_markdown   MEDIUMTEXT NULL,
  body_blocks     JSON NULL,
  cover_image     VARCHAR(500) NULL,
  author_name     VARCHAR(255) NULL,
  author_avatar   VARCHAR(500) NULL,
  category        VARCHAR(64) NULL,
  tags            JSON NULL,
  reading_minutes INT NOT NULL DEFAULT 0,
  status          ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at    DATETIME NULL,
  meta_title      VARCHAR(255) NULL,
  meta_description VARCHAR(500) NULL,
  og_image        VARCHAR(500) NULL,
  canonical_url   VARCHAR(500) NULL,
  faq             JSON NULL,
  created_by      CHAR(36) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status), INDEX (published_at)
) ENGINE=InnoDB;

CREATE TABLE blog_seo_overrides (
  id               CHAR(36) NOT NULL PRIMARY KEY,
  post_slug        VARCHAR(255) NOT NULL UNIQUE,
  meta_title       VARCHAR(255) NULL,
  meta_description VARCHAR(500) NULL,
  og_image         VARCHAR(500) NULL,
  canonical_url    VARCHAR(500) NULL,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE blog_analytics_events (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  post_slug   VARCHAR(255) NOT NULL,
  event_type  VARCHAR(32) NOT NULL, -- view, scroll_25, scroll_50, scroll_75, scroll_100, cta_click
  session_id  VARCHAR(64) NULL,
  user_id     CHAR(36) NULL,
  ref_url     VARCHAR(500) NULL,
  country     CHAR(2) NULL,
  metadata    JSON NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (post_slug), INDEX (event_type), INDEX (created_at)
) ENGINE=InnoDB;

-- =========================================================
-- ANNOUNCEMENTS + SITE CONTENT
-- =========================================================
CREATE TABLE announcements (
  id            CHAR(36) NOT NULL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  body          TEXT NULL,
  emoji         VARCHAR(16) NULL,
  card_design   ENUM('glass','solid','gradient','minimal') NOT NULL DEFAULT 'glass',
  cta_label     VARCHAR(64) NULL,
  cta_url       VARCHAR(500) NULL,
  media_url     VARCHAR(500) NULL,
  bg_color      VARCHAR(16) NULL,
  text_color    VARCHAR(16) NULL,
  audience      VARCHAR(32) NOT NULL DEFAULT 'all',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  start_at      DATETIME NULL,
  end_at        DATETIME NULL,
  priority      INT NOT NULL DEFAULT 0,
  dismissible   TINYINT(1) NOT NULL DEFAULT 1,
  frequency     VARCHAR(16) NOT NULL DEFAULT 'once',
  metadata      JSON NULL,
  created_by    CHAR(36) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (is_active), INDEX (start_at), INDEX (end_at)
) ENGINE=InnoDB;

CREATE TABLE site_content (
  `key`      VARCHAR(128) NOT NULL PRIMARY KEY,
  value      JSON NULL,
  updated_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE site_settings (
  id                       INT NOT NULL PRIMARY KEY DEFAULT 1,
  brand_name               VARCHAR(255) NULL,
  brand_tagline            VARCHAR(255) NULL,
  brand_logo_url           VARCHAR(500) NULL,
  brand_logo_white_url     VARCHAR(500) NULL,
  invoice_logo_url         VARCHAR(500) NULL,
  footer_logo_url          VARCHAR(500) NULL,
  favicon_url              VARCHAR(500) NULL,
  support_show_category    TINYINT(1) NOT NULL DEFAULT 0,
  contact_email            VARCHAR(255) NULL,
  contact_phone            VARCHAR(64) NULL,
  metadata                 JSON NULL,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE social_links (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  platform    VARCHAR(32) NOT NULL,
  url         VARCHAR(500) NOT NULL,
  label       VARCHAR(128) NULL,
  icon        VARCHAR(64) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  metadata    JSON NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE reviews (
  id                CHAR(36) NOT NULL PRIMARY KEY,
  user_id           CHAR(36) NULL,
  order_id          CHAR(36) NULL,
  author_name       VARCHAR(255) NULL,
  author_email      VARCHAR(255) NULL,
  author_avatar     VARCHAR(500) NULL,
  rating            TINYINT NOT NULL DEFAULT 5,
  title             VARCHAR(255) NULL,
  body              TEXT NULL,
  media_url         VARCHAR(500) NULL,
  status            ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  featured          TINYINT(1) NOT NULL DEFAULT 0,
  service_id        VARCHAR(64) NULL,
  moderation_reason VARCHAR(500) NULL,
  metadata          JSON NULL,
  approved_at       DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status), INDEX (rating)
) ENGINE=InnoDB;

-- =========================================================
-- CONTACT LEADS
-- =========================================================
CREATE TABLE contact_leads (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  name         VARCHAR(255) NULL,
  email        VARCHAR(255) NULL,
  phone        VARCHAR(64) NULL,
  company      VARCHAR(255) NULL,
  subject      VARCHAR(255) NULL,
  message      TEXT NULL,
  source       VARCHAR(64) NULL,
  status       VARCHAR(32) NOT NULL DEFAULT 'new',
  assigned_to  CHAR(36) NULL,
  metadata     JSON NULL,
  ip_address   VARCHAR(64) NULL,
  user_agent   VARCHAR(255) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status)
) ENGINE=InnoDB;

-- =========================================================
-- SUPPORT TICKETS
-- =========================================================
CREATE TABLE support_tickets (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  user_id         CHAR(36) NULL,
  order_id        CHAR(36) NULL,
  subject         VARCHAR(255) NOT NULL,
  description     TEXT NULL,
  category        VARCHAR(64) NULL,
  priority        ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  status          ENUM('open','in_progress','waiting_customer','resolved','closed') NOT NULL DEFAULT 'open',
  assigned_to     CHAR(36) NULL,
  last_message_at DATETIME NULL,
  metadata        JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status), INDEX (user_id)
) ENGINE=InnoDB;

CREATE TABLE support_ticket_messages (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  ticket_id    CHAR(36) NOT NULL,
  sender_id    CHAR(36) NULL,
  sender_role  ENUM('customer','admin','system') NOT NULL DEFAULT 'customer',
  body         TEXT NOT NULL,
  attachments  JSON NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (ticket_id)
) ENGINE=InnoDB;

-- =========================================================
-- REFERRALS
-- =========================================================
CREATE TABLE referrals (
  id                    CHAR(36) NOT NULL PRIMARY KEY,
  referrer_id           CHAR(36) NOT NULL,
  referred_user_id      CHAR(36) NOT NULL UNIQUE,
  order_id              CHAR(36) NULL,
  status                ENUM('pending','qualified','rewarded','cancelled') NOT NULL DEFAULT 'pending',
  admin_review_state    ENUM('auto','flagged','approved','rejected') NOT NULL DEFAULT 'auto',
  flag_reasons          JSON NULL,
  reward_referrer_cents INT NOT NULL DEFAULT 0,
  reward_referred_cents INT NOT NULL DEFAULT 0,
  currency              CHAR(3) NOT NULL DEFAULT 'USD',
  notes                 TEXT NULL,
  metadata              JSON NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (referrer_id), INDEX (status)
) ENGINE=InnoDB;

CREATE TABLE referral_credits (
  id            CHAR(36) NOT NULL PRIMARY KEY,
  user_id       CHAR(36) NOT NULL,
  delta_cents   INT NOT NULL,
  currency      CHAR(3) NOT NULL DEFAULT 'USD',
  source        VARCHAR(64) NOT NULL,
  referral_id   CHAR(36) NULL,
  order_id      CHAR(36) NULL,
  batch_id      CHAR(36) NULL,
  notes         VARCHAR(500) NULL,
  metadata      JSON NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id), INDEX (referral_id)
) ENGINE=InnoDB;

CREATE TABLE referral_clicks (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  referral_code  VARCHAR(16) NOT NULL,
  visitor_id     VARCHAR(64) NULL,
  referrer_url   VARCHAR(500) NULL,
  landing_url    VARCHAR(500) NULL,
  utm            JSON NULL,
  ip_address     VARCHAR(64) NULL,
  user_agent     VARCHAR(255) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (referral_code)
) ENGINE=InnoDB;

CREATE TABLE referral_settings (
  id                  TINYINT(1) NOT NULL PRIMARY KEY DEFAULT 1,
  reward_percent      DECIMAL(5,4) NOT NULL DEFAULT 0.1000,
  min_order_cents     INT NULL,
  monthly_cap_cents   INT NULL,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE referral_payout_batches (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  status         VARCHAR(32) NOT NULL DEFAULT 'draft',
  total_cents    INT NOT NULL DEFAULT 0,
  currency       CHAR(3) NOT NULL DEFAULT 'USD',
  processed_at   DATETIME NULL,
  created_by     CHAR(36) NULL,
  notes          TEXT NULL,
  metadata       JSON NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- CHATBOT
-- =========================================================
CREATE TABLE chatbot_conversations (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  session_token   CHAR(64) NOT NULL UNIQUE,
  visitor_name    VARCHAR(255) NULL,
  visitor_email   VARCHAR(255) NULL,
  status          VARCHAR(32) NOT NULL DEFAULT 'active',
  channel         VARCHAR(32) NOT NULL DEFAULT 'web',
  assigned_to     CHAR(36) NULL,
  metadata        JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status)
) ENGINE=InnoDB;

CREATE TABLE chatbot_messages (
  id               CHAR(36) NOT NULL PRIMARY KEY,
  conversation_id  CHAR(36) NOT NULL,
  sender           ENUM('bot','user','admin','system') NOT NULL DEFAULT 'user',
  body             TEXT NOT NULL,
  metadata         JSON NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (conversation_id)
) ENGINE=InnoDB;

CREATE TABLE chatbot_orders (
  id               CHAR(36) NOT NULL PRIMARY KEY,
  conversation_id  CHAR(36) NULL,
  order_id         CHAR(36) NULL,
  user_id          CHAR(36) NULL,
  customer_name    VARCHAR(255) NULL,
  customer_email   VARCHAR(255) NULL,
  service          VARCHAR(255) NULL,
  amount_cents     INT NOT NULL DEFAULT 0,
  currency         CHAR(3) NOT NULL DEFAULT 'USD',
  notes            TEXT NULL,
  status           VARCHAR(32) NOT NULL DEFAULT 'new',
  payload          JSON NULL,
  metadata         JSON NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE chatbot_tickets (
  id               CHAR(36) NOT NULL PRIMARY KEY,
  conversation_id  CHAR(36) NULL,
  subject          VARCHAR(255) NULL,
  description      TEXT NULL,
  status           VARCHAR(32) NOT NULL DEFAULT 'open',
  priority         VARCHAR(16) NOT NULL DEFAULT 'normal',
  assigned_to      CHAR(36) NULL,
  metadata         JSON NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE chatbot_kb (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  body           TEXT NULL,
  tags           JSON NULL,
  category       VARCHAR(64) NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  language       CHAR(5) NOT NULL DEFAULT 'en',
  metadata       JSON NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE chatbot_config (
  id             TINYINT(1) NOT NULL PRIMARY KEY DEFAULT 1,
  welcome_message TEXT NULL,
  bot_name       VARCHAR(64) NOT NULL DEFAULT 'Emailsly',
  bot_avatar     VARCHAR(500) NULL,
  enabled        TINYINT(1) NOT NULL DEFAULT 1,
  metadata       JSON NULL,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE chatbot_telegram_map (
  id                CHAR(36) NOT NULL PRIMARY KEY,
  conversation_id   CHAR(36) NOT NULL,
  telegram_chat_id  VARCHAR(64) NOT NULL,
  telegram_msg_id   VARCHAR(64) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- SAMPLE DATASETS
-- =========================================================
CREATE TABLE sample_datasets (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  slug         VARCHAR(64) NOT NULL UNIQUE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT NULL,
  file_url     VARCHAR(500) NOT NULL,
  file_type    VARCHAR(16) NOT NULL DEFAULT 'csv',
  is_public    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE sample_dataset_audit (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  dataset_id   CHAR(36) NULL,
  user_id      CHAR(36) NULL,
  ip_address   VARCHAR(64) NULL,
  user_agent   VARCHAR(255) NULL,
  action       VARCHAR(32) NOT NULL DEFAULT 'download',
  metadata     JSON NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- MISC ANALYTICS + TRACKING
-- =========================================================
CREATE TABLE conversion_events (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  event_name   VARCHAR(64) NOT NULL,
  session_id   VARCHAR(64) NULL,
  user_id      CHAR(36) NULL,
  value_cents  INT NULL,
  currency     CHAR(3) NULL,
  page_url     VARCHAR(500) NULL,
  ref_url      VARCHAR(500) NULL,
  utm          JSON NULL,
  ip_address   VARCHAR(64) NULL,
  user_agent   VARCHAR(255) NULL,
  metadata     JSON NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (event_name), INDEX (created_at)
) ENGINE=InnoDB;

CREATE TABLE stripe_events (
  id           VARCHAR(128) NOT NULL PRIMARY KEY,
  type         VARCHAR(64) NOT NULL,
  payload      JSON NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE server_event_log (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  event_type   VARCHAR(64) NOT NULL,
  severity     VARCHAR(16) NOT NULL DEFAULT 'info',
  actor_id     CHAR(36) NULL,
  route        VARCHAR(255) NULL,
  ip_address   VARCHAR(64) NULL,
  message      TEXT NULL,
  metadata     JSON NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (event_type), INDEX (created_at)
) ENGINE=InnoDB;

CREATE TABLE server_tracking_config (
  id                    TINYINT(1) NOT NULL PRIMARY KEY DEFAULT 1,
  ga4_measurement_id    VARCHAR(64) NULL,
  ga4_api_secret        VARCHAR(255) NULL,
  meta_pixel_id         VARCHAR(64) NULL,
  meta_access_token     VARCHAR(500) NULL,
  meta_test_event_code  VARCHAR(64) NULL,
  tiktok_pixel_id       VARCHAR(64) NULL,
  tiktok_access_token   VARCHAR(500) NULL,
  linkedin_partner_id   VARCHAR(64) NULL,
  linkedin_conversion_id VARCHAR(64) NULL,
  linkedin_access_token VARCHAR(500) NULL,
  reddit_pixel_id       VARCHAR(64) NULL,
  reddit_conversion_token VARCHAR(500) NULL,
  enabled               TINYINT(1) NOT NULL DEFAULT 0,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- PRODUCT DETAILS (per service extended copy)
-- =========================================================
CREATE TABLE product_details (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  service_id     VARCHAR(64) NOT NULL UNIQUE,
  headline       VARCHAR(255) NULL,
  subheadline    VARCHAR(500) NULL,
  bullets        JSON NULL,
  hero_image     VARCHAR(500) NULL,
  gallery        JSON NULL,
  faq            JSON NULL,
  metadata       JSON NULL,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- CUSTOM PRODUCTS (admin-editable product catalogue)
-- =========================================================
CREATE TABLE custom_products (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  slug           VARCHAR(255) NOT NULL UNIQUE,
  name           VARCHAR(255) NOT NULL,
  short_desc     VARCHAR(500) NULL,
  long_desc      LONGTEXT NULL,
  price_cents    INT NOT NULL DEFAULT 0,
  compare_at_cents INT NULL,
  currency       CHAR(3) NOT NULL DEFAULT 'USD',
  status         VARCHAR(32) NOT NULL DEFAULT 'draft',
  category       VARCHAR(100) NULL,
  tags           JSON NULL,
  image_url      VARCHAR(500) NULL,
  gallery        JSON NULL,
  bullets        JSON NULL,
  metadata       JSON NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  is_featured    TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status), INDEX (category)
) ENGINE=InnoDB;

-- =========================================================
-- STORE OFFERS (promo banners)
-- =========================================================
CREATE TABLE store_offers (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  subtitle       VARCHAR(500) NULL,
  cta_label      VARCHAR(100) NULL,
  cta_url        VARCHAR(500) NULL,
  coupon_code    VARCHAR(64) NULL,
  discount_pct   DECIMAL(5,2) NULL,
  bg_color       VARCHAR(16) NULL,
  fg_color       VARCHAR(16) NULL,
  starts_at      DATETIME NULL,
  ends_at        DATETIME NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  sort_order     INT NOT NULL DEFAULT 0,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (is_active)
) ENGINE=InnoDB;

-- =========================================================
-- TELEGRAM BOTS
-- =========================================================
CREATE TABLE telegram_bots (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  bot_token      VARCHAR(255) NOT NULL,
  chat_id        VARCHAR(64) NULL,
  purpose        VARCHAR(64) NOT NULL DEFAULT 'notifications',
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- CAMPAIGNS (marketing / email campaigns)
-- =========================================================
CREATE TABLE campaigns (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  slug           VARCHAR(255) NOT NULL UNIQUE,
  status         VARCHAR(32) NOT NULL DEFAULT 'draft',
  channel        VARCHAR(64) NULL,
  subject        VARCHAR(500) NULL,
  body           LONGTEXT NULL,
  audience_query JSON NULL,
  scheduled_at   DATETIME NULL,
  sent_at        DATETIME NULL,
  stats          JSON NULL,
  metadata       JSON NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status)
) ENGINE=InnoDB;

-- =========================================================
-- LEGACY ORDER IMPORTS (CSV imports of pre-launch orders)
-- =========================================================
CREATE TABLE legacy_order_imports (
  id             CHAR(36) NOT NULL PRIMARY KEY,
  batch_ref      VARCHAR(64) NULL,
  imported_by    CHAR(36) NULL,
  row_count      INT NOT NULL DEFAULT 0,
  success_count  INT NOT NULL DEFAULT 0,
  error_count    INT NOT NULL DEFAULT 0,
  errors         JSON NULL,
  metadata       JSON NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (imported_by)
) ENGINE=InnoDB;

-- =========================================================
-- OTP CODES (email verification 6-digit codes)
-- =========================================================
CREATE TABLE otp_codes (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  code       VARCHAR(10) NOT NULL,
  purpose    VARCHAR(32) NOT NULL DEFAULT 'verify_email',
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  attempts   INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (email), INDEX (expires_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
