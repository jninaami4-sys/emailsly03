
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true,
  gtm_id text NOT NULL DEFAULT '',
  ga4_id text NOT NULL DEFAULT '',
  fb_pixel_id text NOT NULL DEFAULT '',
  tiktok_pixel_id text NOT NULL DEFAULT '',
  custom_head_html text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = true)
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TRIGGER site_settings_set_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT DO NOTHING;
