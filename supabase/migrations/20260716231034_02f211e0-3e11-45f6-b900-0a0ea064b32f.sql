
CREATE TABLE IF NOT EXISTS public.pricing_settings_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL,
  service_name text,
  changed_by uuid,
  changed_by_email text,
  changes jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pricing_settings_audit_changed_at_idx
  ON public.pricing_settings_audit (changed_at DESC);
CREATE INDEX IF NOT EXISTS pricing_settings_audit_service_idx
  ON public.pricing_settings_audit (service_id, changed_at DESC);

GRANT SELECT ON public.pricing_settings_audit TO authenticated;
GRANT ALL ON public.pricing_settings_audit TO service_role;

ALTER TABLE public.pricing_settings_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pricing audit"
  ON public.pricing_settings_audit
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.pricing_settings_log_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  diff jsonb := '{}'::jsonb;
  actor uuid := auth.uid();
  actor_email text := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';
BEGIN
  IF NEW.rate IS DISTINCT FROM OLD.rate THEN
    diff := diff || jsonb_build_object('rate', jsonb_build_object('old', OLD.rate, 'new', NEW.rate));
  END IF;
  IF NEW.min_qty IS DISTINCT FROM OLD.min_qty THEN
    diff := diff || jsonb_build_object('min_qty', jsonb_build_object('old', OLD.min_qty, 'new', NEW.min_qty));
  END IF;
  IF NEW.min_order IS DISTINCT FROM OLD.min_order THEN
    diff := diff || jsonb_build_object('min_order', jsonb_build_object('old', OLD.min_order, 'new', NEW.min_order));
  END IF;
  IF COALESCE(NEW.helper, '') IS DISTINCT FROM COALESCE(OLD.helper, '') THEN
    diff := diff || jsonb_build_object('helper', jsonb_build_object('old', OLD.helper, 'new', NEW.helper));
  END IF;
  IF NEW.published IS DISTINCT FROM OLD.published THEN
    diff := diff || jsonb_build_object('published', jsonb_build_object('old', OLD.published, 'new', NEW.published));
  END IF;

  IF diff <> '{}'::jsonb THEN
    INSERT INTO public.pricing_settings_audit
      (service_id, service_name, changed_by, changed_by_email, changes)
    VALUES
      (NEW.service_id, NEW.name, actor, actor_email, diff);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pricing_settings_audit_trigger ON public.pricing_settings;
CREATE TRIGGER pricing_settings_audit_trigger
AFTER UPDATE ON public.pricing_settings
FOR EACH ROW EXECUTE FUNCTION public.pricing_settings_log_change();
