
CREATE TABLE public.conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  ga4_event_name text NOT NULL DEFAULT '',
  ga4_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta_event_name text NOT NULL DEFAULT '',
  meta_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  tiktok_event_name text NOT NULL DEFAULT '',
  tiktok_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.conversion_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversion_events TO authenticated;
GRANT ALL ON public.conversion_events TO service_role;

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read enabled conversion events"
  ON public.conversion_events FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

CREATE TRIGGER conversion_events_set_updated_at
  BEFORE UPDATE ON public.conversion_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.conversion_events (event_key, name, description, ga4_event_name, meta_event_name, tiktok_event_name, ga4_params, meta_params, tiktok_params) VALUES
  ('purchase', 'Purchase', 'Fires when an order is completed', 'purchase', 'Purchase', 'CompletePayment',
    '{"currency":"USD"}'::jsonb, '{"currency":"USD"}'::jsonb, '{"currency":"USD"}'::jsonb),
  ('lead', 'Lead / CSV download', 'Fires when a visitor downloads a sample or submits a lead form', 'generate_lead', 'Lead', 'SubmitForm',
    '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
  ('add_to_cart', 'Add to cart', 'Fires when a product is added to the cart', 'add_to_cart', 'AddToCart', 'AddToCart',
    '{"currency":"USD"}'::jsonb, '{"currency":"USD"}'::jsonb, '{"currency":"USD"}'::jsonb);
