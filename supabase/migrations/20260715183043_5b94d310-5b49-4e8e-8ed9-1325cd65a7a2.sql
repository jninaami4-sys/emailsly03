
CREATE TABLE public.sample_datasets (
  source text PRIMARY KEY,
  source_type text NOT NULL DEFAULT 'builtin' CHECK (source_type IN ('builtin','gdrive','upload')),
  gdrive_url text,
  storage_path text,
  display_name text NOT NULL,
  row_count_hint integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sample_datasets TO anon, authenticated;
GRANT ALL ON public.sample_datasets TO service_role;

ALTER TABLE public.sample_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read sample datasets"
  ON public.sample_datasets FOR SELECT
  USING (true);

CREATE POLICY "Admins manage sample datasets"
  ON public.sample_datasets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER sample_datasets_set_updated_at
  BEFORE UPDATE ON public.sample_datasets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.sample_datasets (source, source_type, display_name) VALUES
  ('apollo',   'builtin', 'Apollo'),
  ('linkedin', 'builtin', 'LinkedIn Sales Navigator'),
  ('zoominfo', 'builtin', 'ZoomInfo');
