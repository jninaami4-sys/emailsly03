
CREATE TABLE public.custom_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  category_color text NOT NULL DEFAULT 'violet',
  records integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  compare_at_price numeric,
  file_format text NOT NULL DEFAULT 'CSV',
  geography text NOT NULL DEFAULT 'Global',
  description text NOT NULL DEFAULT '',
  fields text[] NOT NULL DEFAULT '{}',
  sample_note text,
  featured boolean NOT NULL DEFAULT false,
  cover_image text,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.custom_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_products TO authenticated;
GRANT ALL ON public.custom_products TO service_role;

ALTER TABLE public.custom_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published products"
  ON public.custom_products FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can read all products"
  ON public.custom_products FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products"
  ON public.custom_products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.custom_products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.custom_products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER custom_products_set_updated_at
  BEFORE UPDATE ON public.custom_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
