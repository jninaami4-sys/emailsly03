
CREATE TABLE public.stripe_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  event_id text,
  event_type text,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  http_status integer NOT NULL,
  outcome text,
  error_message text,
  duration_ms integer,
  stripe_ref text,
  matched_order_id uuid,
  source_ip text,
  signature_present boolean NOT NULL DEFAULT false,
  payload_bytes integer
);
CREATE INDEX stripe_webhook_deliveries_received_at_idx ON public.stripe_webhook_deliveries (received_at DESC);
CREATE INDEX stripe_webhook_deliveries_event_id_idx ON public.stripe_webhook_deliveries (event_id);
CREATE INDEX stripe_webhook_deliveries_status_idx ON public.stripe_webhook_deliveries (status);

GRANT ALL ON public.stripe_webhook_deliveries TO service_role;

ALTER TABLE public.stripe_webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- No policies: table is written by the webhook (service role) and read by
-- admin server functions using supabaseAdmin. Regular users have no access.
