
CREATE TABLE public.blog_seo_overrides (
  slug TEXT PRIMARY KEY,
  meta_description TEXT,
  canonical_url TEXT,
  og_image TEXT,
  social_title TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.blog_seo_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_seo_overrides TO authenticated;
GRANT ALL ON public.blog_seo_overrides TO service_role;

ALTER TABLE public.blog_seo_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read blog seo overrides"
  ON public.blog_seo_overrides FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "Admins manage blog seo overrides"
  ON public.blog_seo_overrides FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_blog_seo_overrides_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER blog_seo_overrides_set_updated_at
BEFORE UPDATE ON public.blog_seo_overrides
FOR EACH ROW EXECUTE FUNCTION public.touch_blog_seo_overrides_updated_at();
