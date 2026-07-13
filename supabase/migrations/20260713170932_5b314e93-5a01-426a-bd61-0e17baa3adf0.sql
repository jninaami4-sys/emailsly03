CREATE TABLE public.chatbot_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  enabled boolean NOT NULL DEFAULT true,
  greeting text NOT NULL DEFAULT 'Hi! I''m your assistant. What''s your name?',
  human_hours_note text NOT NULL DEFAULT 'Team hours: Sun–Thu, 9am–7pm (GMT+6). Outside these hours we''ll reply as soon as we''re back.',
  telegram_admin_chat_id text NOT NULL DEFAULT '',
  ticket_webhook_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.chatbot_config TO authenticated;
GRANT ALL ON public.chatbot_config TO service_role;
ALTER TABLE public.chatbot_config ENABLE ROW LEVEL SECURITY;

-- Only admins may read/write; anonymous widget reads a whitelisted subset via server function.
CREATE POLICY "Admins manage config" ON public.chatbot_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_chatbot_config_updated_at ON public.chatbot_config;
CREATE TRIGGER trg_chatbot_config_updated_at BEFORE UPDATE ON public.chatbot_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.chatbot_config (id) VALUES (true) ON CONFLICT DO NOTHING;