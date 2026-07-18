-- Minimal seed rows. Safe to re-run.
INSERT INTO site_settings (id, brand_name, primary_color, contact_email)
VALUES (1, 'Emailsly', '#2563eb', 'support@example.com')
ON DUPLICATE KEY UPDATE brand_name = VALUES(brand_name);

INSERT INTO chatbot_config (id, enabled, greeting, model, temperature)
VALUES (1, 1, 'Hi! How can I help?', 'gpt-4o-mini', 0.30)
ON DUPLICATE KEY UPDATE enabled = VALUES(enabled);

INSERT INTO referral_settings (id, reward_percent, min_order_cents, monthly_cap_cents)
VALUES (1, 0.10, 2000, 100000)
ON DUPLICATE KEY UPDATE reward_percent = VALUES(reward_percent);

INSERT INTO server_tracking_config (id) VALUES (1)
ON DUPLICATE KEY UPDATE id = 1;
