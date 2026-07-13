
CREATE TABLE public.server_tracking_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  ga4_measurement_id text NOT NULL DEFAULT '',
  ga4_api_secret text NOT NULL DEFAULT '',
  ga4_enabled boolean NOT NULL DEFAULT false,
  meta_pixel_id text NOT NULL DEFAULT '',
  meta_access_token text NOT NULL DEFAULT '',
  meta_test_event_code text NOT NULL DEFAULT '',
  meta_enabled boolean NOT NULL DEFAULT false,
  tiktok_pixel_id text NOT NULL DEFAULT '',
  tiktok_access_token text NOT NULL DEFAULT '',
  tiktok_test_event_code text NOT NULL DEFAULT '',
  tiktok_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.server_tracking_config TO service_role;
ALTER TABLE public.server_tracking_config ENABLE ROW LEVEL SECURITY;
-- Table is admin-only; no policies for anon/authenticated. Access happens
-- through server functions using the service role.

CREATE TRIGGER server_tracking_config_touch
BEFORE UPDATE ON public.server_tracking_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.server_tracking_config (singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE public.server_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  event_key text NOT NULL,
  providers jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'ok',
  error text,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX server_event_log_event_id_key_idx
  ON public.server_event_log (event_id, event_key);
CREATE INDEX server_event_log_created_at_idx
  ON public.server_event_log (created_at DESC);

GRANT ALL ON public.server_event_log TO service_role;
ALTER TABLE public.server_event_log ENABLE ROW LEVEL SECURITY;
-- Admin-only reads via server functions using the service role.
