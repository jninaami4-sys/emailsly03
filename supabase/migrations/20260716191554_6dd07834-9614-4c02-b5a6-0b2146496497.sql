
CREATE TABLE public.blog_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  event_type TEXT NOT NULL,
  session_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  referrer TEXT,
  path TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX blog_analytics_events_slug_idx ON public.blog_analytics_events (slug);
CREATE INDEX blog_analytics_events_created_at_idx ON public.blog_analytics_events (created_at DESC);
CREATE INDEX blog_analytics_events_slug_type_idx ON public.blog_analytics_events (slug, event_type);

GRANT SELECT, INSERT ON public.blog_analytics_events TO anon;
GRANT SELECT, INSERT ON public.blog_analytics_events TO authenticated;
GRANT ALL ON public.blog_analytics_events TO service_role;

ALTER TABLE public.blog_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log blog analytics"
  ON public.blog_analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read blog analytics"
  ON public.blog_analytics_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
