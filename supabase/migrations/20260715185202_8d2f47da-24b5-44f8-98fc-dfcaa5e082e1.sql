-- Audit log for admin actions on sample datasets
CREATE TABLE public.sample_dataset_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sample_dataset_audit_created_at_idx ON public.sample_dataset_audit (created_at DESC);
CREATE INDEX sample_dataset_audit_source_idx ON public.sample_dataset_audit (source);
CREATE INDEX sample_dataset_audit_actor_idx ON public.sample_dataset_audit (actor_id);

GRANT SELECT ON public.sample_dataset_audit TO authenticated;
GRANT ALL ON public.sample_dataset_audit TO service_role;

ALTER TABLE public.sample_dataset_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log; writes go through service role (server fns)
CREATE POLICY "Admins can view sample dataset audit"
  ON public.sample_dataset_audit
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));