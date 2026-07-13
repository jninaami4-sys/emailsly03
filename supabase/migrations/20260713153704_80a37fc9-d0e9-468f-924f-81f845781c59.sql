
CREATE TABLE public.product_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  long_description text NOT NULL DEFAULT '',
  extra_info text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT '',
  cta_url text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_details TO anon, authenticated;
GRANT ALL ON public.product_details TO service_role;

ALTER TABLE public.product_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read enabled product details"
  ON public.product_details FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

CREATE TRIGGER product_details_set_updated_at
BEFORE UPDATE ON public.product_details
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
