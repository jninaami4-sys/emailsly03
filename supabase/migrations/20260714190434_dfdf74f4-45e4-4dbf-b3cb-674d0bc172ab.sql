
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS signup_ip inet,
  ADD COLUMN IF NOT EXISTS signup_ua_hash text,
  ADD COLUMN IF NOT EXISTS flag_reasons text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS admin_review_state text NOT NULL DEFAULT 'auto';

ALTER TABLE public.referrals
  DROP CONSTRAINT IF EXISTS referrals_admin_review_state_check;
ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_admin_review_state_check
  CHECK (admin_review_state IN ('auto','flagged','approved','rejected'));

CREATE INDEX IF NOT EXISTS referrals_review_state_idx ON public.referrals(admin_review_state);

ALTER TABLE public.referral_credits
  ADD COLUMN IF NOT EXISTS payout_batch_id uuid,
  ADD COLUMN IF NOT EXISTS paid_out_at timestamptz;
CREATE INDEX IF NOT EXISTS referral_credits_payout_batch_idx ON public.referral_credits(payout_batch_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_ip inet,
  ADD COLUMN IF NOT EXISTS signup_ua_hash text;

CREATE TABLE IF NOT EXISTS public.referral_settings (
  id boolean PRIMARY KEY DEFAULT true,
  min_order_cents integer NOT NULL DEFAULT 2000,
  monthly_cap_cents integer NOT NULL DEFAULT 50000,
  reward_percent numeric(5,4) NOT NULL DEFAULT 0.10,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_settings_singleton CHECK (id = true)
);
GRANT SELECT ON public.referral_settings TO authenticated, anon;
GRANT ALL ON public.referral_settings TO service_role;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referral_settings: everyone reads" ON public.referral_settings;
CREATE POLICY "referral_settings: everyone reads" ON public.referral_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "referral_settings: admin writes" ON public.referral_settings;
CREATE POLICY "referral_settings: admin writes" ON public.referral_settings FOR ALL
  TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.referral_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  visitor_hash text NOT NULL,
  click_day date NOT NULL DEFAULT current_date,
  landing_url text,
  referer text,
  ua_hash text,
  ip inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS referral_clicks_daily_dedupe
  ON public.referral_clicks (code, visitor_hash, click_day);
CREATE INDEX IF NOT EXISTS referral_clicks_code_idx ON public.referral_clicks(code);
CREATE INDEX IF NOT EXISTS referral_clicks_created_idx ON public.referral_clicks(created_at DESC);
GRANT SELECT ON public.referral_clicks TO authenticated;
GRANT ALL ON public.referral_clicks TO service_role;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referral_clicks: admin reads" ON public.referral_clicks;
CREATE POLICY "referral_clicks: admin reads" ON public.referral_clicks FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);
GRANT ALL ON public.stripe_events TO service_role;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.referral_payout_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.referral_payout_batches TO authenticated;
GRANT ALL ON public.referral_payout_batches TO service_role;
ALTER TABLE public.referral_payout_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payout_batches: admin only" ON public.referral_payout_batches;
CREATE POLICY "payout_batches: admin only" ON public.referral_payout_batches FOR ALL
  TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.orders_qualify_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  ref_row public.referrals%ROWTYPE;
  settings public.referral_settings%ROWTYPE;
  reward_pct numeric := 0.10;
  net_cents integer;
  reward_amt integer;
  month_start timestamptz := date_trunc('month', now());
  earned_this_month integer := 0;
  flags text[] := '{}';
  next_state text := 'auto';
BEGIN
  IF NEW.payment_status <> 'paid' THEN RETURN NEW; END IF;
  IF (TG_OP = 'UPDATE' AND OLD.payment_status = 'paid') THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  IF COALESCE(NEW.payment_provider,'') <> 'stripe' THEN RETURN NEW; END IF;
  IF NEW.payment_ref IS NULL OR NEW.payment_ref !~ '^(cs_|pi_|ch_)' THEN RETURN NEW; END IF;

  SELECT * INTO ref_row FROM public.referrals
    WHERE referred_user_id = NEW.user_id AND status = 'pending'
    LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT * INTO settings FROM public.referral_settings WHERE id = true;
  IF FOUND THEN reward_pct := settings.reward_percent; END IF;

  net_cents := GREATEST(0, COALESCE(NEW.total_cents,0));
  reward_amt := FLOOR(net_cents * reward_pct);

  IF settings.min_order_cents IS NOT NULL AND net_cents < settings.min_order_cents THEN
    flags := array_append(flags, 'below_min_order');
    next_state := 'flagged';
  END IF;

  SELECT COALESCE(SUM(delta_cents),0) INTO earned_this_month
    FROM public.referral_credits
    WHERE user_id = ref_row.referrer_id
      AND source = 'referral_earned_referrer'
      AND created_at >= month_start;
  IF settings.monthly_cap_cents IS NOT NULL
     AND (earned_this_month + reward_amt) > settings.monthly_cap_cents THEN
    flags := array_append(flags, 'monthly_cap');
    next_state := 'flagged';
  END IF;

  IF ref_row.flag_reasons IS NOT NULL AND array_length(ref_row.flag_reasons,1) > 0 THEN
    flags := ref_row.flag_reasons || flags;
    IF ref_row.admin_review_state <> 'approved' THEN
      next_state := 'flagged';
    ELSE
      next_state := 'approved';
    END IF;
  END IF;

  UPDATE public.referrals
     SET status = 'qualified',
         order_id = NEW.id,
         reward_referrer_cents = reward_amt,
         reward_referred_cents = reward_amt,
         currency = COALESCE(NEW.currency,'USD'),
         flag_reasons = flags,
         admin_review_state = next_state
   WHERE id = ref_row.id;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.referrals_issue_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status IN ('qualified','rewarded')
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND OLD.status = 'pending'
     AND NEW.admin_review_state IN ('auto','approved') THEN
    IF NEW.reward_referrer_cents > 0 THEN
      INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, order_id, notes)
      VALUES (NEW.referrer_id, NEW.reward_referrer_cents, NEW.currency, 'referral_earned_referrer', NEW.id, NEW.order_id, 'Referral reward — invited friend paid');
    END IF;
    IF NEW.reward_referred_cents > 0 THEN
      INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, order_id, notes)
      VALUES (NEW.referred_user_id, NEW.reward_referred_cents, NEW.currency, 'referral_earned_referred', NEW.id, NEW.order_id, 'Welcome credit — referred signup');
    END IF;
  END IF;

  IF NEW.status IN ('qualified','rewarded')
     AND OLD.admin_review_state IS DISTINCT FROM NEW.admin_review_state
     AND NEW.admin_review_state = 'approved'
     AND OLD.admin_review_state IN ('flagged','rejected')
     AND NOT EXISTS (
       SELECT 1 FROM public.referral_credits
        WHERE referral_id = NEW.id AND source IN ('referral_earned_referrer','referral_earned_referred')
     ) THEN
    IF NEW.reward_referrer_cents > 0 THEN
      INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, order_id, notes)
      VALUES (NEW.referrer_id, NEW.reward_referrer_cents, NEW.currency, 'referral_earned_referrer', NEW.id, NEW.order_id, 'Referral reward — admin approved');
    END IF;
    IF NEW.reward_referred_cents > 0 THEN
      INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, order_id, notes)
      VALUES (NEW.referred_user_id, NEW.reward_referred_cents, NEW.currency, 'referral_earned_referred', NEW.id, NEW.order_id, 'Welcome credit — admin approved');
    END IF;
  END IF;

  IF ( (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')
       OR (NEW.admin_review_state = 'rejected' AND OLD.admin_review_state IS DISTINCT FROM 'rejected') ) THEN
    INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, notes)
    SELECT user_id, -delta_cents, currency, 'reversal', NEW.id, 'Referral cancelled/rejected'
      FROM public.referral_credits
     WHERE referral_id = NEW.id AND source IN ('referral_earned_referrer','referral_earned_referred')
       AND NOT EXISTS (
         SELECT 1 FROM public.referral_credits rc2
          WHERE rc2.referral_id = NEW.id AND rc2.source = 'reversal'
       );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS referrals_issue_credits_trg ON public.referrals;
CREATE TRIGGER referrals_issue_credits_trg
  AFTER UPDATE OF status, admin_review_state ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.referrals_issue_credits();
