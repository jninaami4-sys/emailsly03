
CREATE TABLE public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  icon TEXT NOT NULL DEFAULT 'link',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.social_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled social links"
  ON public.social_links FOR SELECT
  TO anon, authenticated
  USING (enabled = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert social links"
  ON public.social_links FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update social links"
  ON public.social_links FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete social links"
  ON public.social_links FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER social_links_set_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.social_links (platform, label, href, color, icon, sort_order) VALUES
  ('whatsapp',  'Chat on WhatsApp',       'https://wa.me/919999999999',      '#25D366', 'whatsapp',  10),
  ('email',     'Email us',                'mailto:hello@lyradata.com',      '#EA4335', 'email',     20),
  ('instagram', 'Follow on Instagram',    'https://instagram.com/lyradata',  '#E1306C', 'instagram', 30),
  ('telegram',  'Message on Telegram',    'https://t.me/lyradata',           '#229ED9', 'telegram',  40),
  ('facebook',  'Follow on Facebook',     'https://facebook.com/lyradata',   '#1877F2', 'facebook',  50);
