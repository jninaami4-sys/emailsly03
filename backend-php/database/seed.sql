-- Seed data: admin user + demo pricing + defaults
-- Import AFTER schema.sql

-- Default admin: admin@emailsly.com / ChangeMe!2026
-- (bcrypt cost 12)
INSERT INTO users (id, email, password_hash, email_verified) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'admin@emailsly.com',
   '$2b$12$4qJwKBHZU2i5qdhA35XXLu5RabAocVoZ1E6AnEmnUb.n5ygaBfKdO',
   1);

INSERT INTO profiles (user_id, email, full_name, referral_code) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@emailsly.com', 'Emailsly Admin', 'ADMIN001');

INSERT INTO user_roles (id, user_id, role) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin');

-- Site settings singleton
INSERT INTO site_settings (id, brand_name, brand_tagline, contact_email, support_show_category)
VALUES (1, 'Emailsly', 'Prospect data that actually converts', 'hello@emailsly.com', 0);

-- Chatbot config singleton
INSERT INTO chatbot_config (id, welcome_message, bot_name, enabled)
VALUES (1, 'Hi! I''m Emailsly. How can I help you find better leads today?', 'Emailsly', 1);

-- Referral defaults
INSERT INTO referral_settings (id, reward_percent, min_order_cents, monthly_cap_cents)
VALUES (1, 0.1000, 5000, 50000);

-- Demo pricing (10 services)
INSERT INTO pricing_settings (id, service_id, name, category, rate, min_qty, min_order, helper, currency, published, sort_order) VALUES
  (UUID(), 'apollo-leads',     'Apollo Verified Leads',    'leads',     0.0300, 1000, 30, 'Per verified contact', 'USD', 1, 1),
  (UUID(), 'linkedin-leads',   'LinkedIn Sales Nav Leads', 'leads',     0.0500, 500,  25, 'Sales Nav filtered',   'USD', 1, 2),
  (UUID(), 'zoominfo-leads',   'ZoomInfo Enriched Leads',  'leads',     0.0800, 500,  40, 'Full enrichment',      'USD', 1, 3),
  (UUID(), 'email-verify',     'Email Verification',       'quality',   0.0040, 1000, 4,  'Bounce-safe',          'USD', 1, 4),
  (UUID(), 'phone-append',     'Apollo Mobile Numbers',    'quality',   0.2500, 100,  25, 'Mobile + direct',      'USD', 1, 5),
  (UUID(), 'icp-research',     'ICP Research Package',     'strategy',  199.00,   1, 199, 'Done-for-you',         'USD', 1, 6),
  (UUID(), 'cold-email-setup', 'Cold Email Infra Setup',   'infra',     299.00,   1, 299, 'DKIM + DMARC + warmup','USD', 1, 7),
  (UUID(), 'copywriting',      'Cold Email Copywriting',   'copy',      149.00,   1, 149, '3 sequences',          'USD', 1, 8),
  (UUID(), 'campaign-mgmt',    'Campaign Management',      'service',   799.00,   1, 799, 'Monthly retainer',     'USD', 1, 9),
  (UUID(), 'audit',            'Deliverability Audit',     'audit',      99.00,   1,  99, 'Report + action plan', 'USD', 1, 10);
