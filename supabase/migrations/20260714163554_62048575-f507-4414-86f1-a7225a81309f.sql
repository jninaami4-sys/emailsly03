
CREATE TABLE public.pricing_settings (
  service_id text PRIMARY KEY,
  name text NOT NULL,
  rate numeric(10,4) NOT NULL,
  unit text NOT NULL,
  min_qty integer NOT NULL DEFAULT 1,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  fixed boolean NOT NULL DEFAULT false,
  helper text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pricing_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_settings TO authenticated;
GRANT ALL ON public.pricing_settings TO service_role;

ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pricing is publicly readable"
  ON public.pricing_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert pricing"
  ON public.pricing_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pricing"
  ON public.pricing_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pricing"
  ON public.pricing_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pricing_settings_set_updated_at
  BEFORE UPDATE ON public.pricing_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.pricing_settings (service_id, name, rate, unit, min_qty, min_order, fixed, helper, sort_order) VALUES
  ('apollo',    'Apollo Export',          0.0035, 'lead',   5000, 20,  false, '$20 / 5K leads · $35 / 10K+', 10),
  ('zoominfo',  'ZoomInfo Data',          0.02,   'lead',   1000, 20,  false, NULL, 20),
  ('linkedin',  'LinkedIn B2B',           0.01,   'lead',   5000, 50,  false, '~70% include emails', 30),
  ('manual',    'Manual Research',        0.35,   'lead',   100,  35,  false, NULL, 40),
  ('mobile',    'Apollo Mobiles',         0.25,   'record', 100,  25,  false, NULL, 50),
  ('pixel',     'Facebook Pixel Setup',   100,    'setup',  1,    100, true,  NULL, 60),
  ('ads',       'Google Ads Setup',       100,    'setup',  1,    100, true,  NULL, 70),
  ('tracking',  'Server-Side Tracking',   150,    'setup',  1,    150, true,  NULL, 80),
  ('logo',      'Logo Design',            50,     'design', 1,    50,  true,  NULL, 90),
  ('webdesign', 'AI Website Design',      200,    'site',   1,    200, true,  NULL, 100);
