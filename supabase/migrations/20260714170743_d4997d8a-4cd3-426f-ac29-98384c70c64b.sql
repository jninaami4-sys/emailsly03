
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles(referred_by_user_id);

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  tries int := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
    tries := tries + 1;
    IF tries > 10 THEN
      code := code || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$;

UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

CREATE OR REPLACE FUNCTION public.profiles_set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_referral_code_trg ON public.profiles;
CREATE TRIGGER profiles_set_referral_code_trg
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_set_referral_code();

DO $$ BEGIN
  CREATE TYPE public.referral_status AS ENUM ('pending','qualified','rewarded','paid_out','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.referral_payout_method AS ENUM ('credit','cash');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  reward_referrer_cents integer NOT NULL DEFAULT 0,
  reward_referred_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status public.referral_status NOT NULL DEFAULT 'pending',
  payout_method public.referral_payout_method,
  paid_out_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON public.referrals(status);
CREATE INDEX IF NOT EXISTS referrals_order_idx ON public.referrals(order_id);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals: user sees own (either side)"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "referrals: admin full write"
  ON public.referrals FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS referrals_set_updated_at ON public.referrals;
CREATE TRIGGER referrals_set_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.profiles_create_pending_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referred_by_user_id IS NOT NULL
     AND NEW.referred_by_user_id <> NEW.user_id THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, status)
    VALUES (NEW.referred_by_user_id, NEW.user_id, 'pending')
    ON CONFLICT (referred_user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_create_pending_referral_trg ON public.profiles;
CREATE TRIGGER profiles_create_pending_referral_trg
AFTER INSERT OR UPDATE OF referred_by_user_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_create_pending_referral();

CREATE OR REPLACE FUNCTION public.orders_qualify_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_row public.referrals%ROWTYPE;
  reward_pct numeric := 0.10;
BEGIN
  IF NEW.payment_status <> 'paid' THEN RETURN NEW; END IF;
  IF (TG_OP = 'UPDATE' AND OLD.payment_status = 'paid') THEN RETURN NEW; END IF;
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO ref_row FROM public.referrals
   WHERE referred_user_id = NEW.user_id AND status = 'pending'
   LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  UPDATE public.referrals
     SET status = 'qualified',
         order_id = NEW.id,
         reward_referrer_cents = FLOOR((NEW.total_cents) * reward_pct),
         reward_referred_cents = FLOOR((NEW.total_cents) * reward_pct),
         currency = COALESCE(NEW.currency, 'USD')
   WHERE id = ref_row.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_qualify_referral_trg ON public.orders;
CREATE TRIGGER orders_qualify_referral_trg
AFTER INSERT OR UPDATE OF payment_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.orders_qualify_referral();
