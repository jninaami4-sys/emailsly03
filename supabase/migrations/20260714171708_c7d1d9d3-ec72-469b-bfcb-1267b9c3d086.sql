
CREATE TABLE IF NOT EXISTS public.referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  source text NOT NULL CHECK (source IN (
    'referral_earned_referrer',
    'referral_earned_referred',
    'referral_redeemed',
    'admin_adjust',
    'signup_bonus',
    'reversal'
  )),
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_credits_user_idx ON public.referral_credits(user_id);
CREATE INDEX IF NOT EXISTS referral_credits_referral_idx ON public.referral_credits(referral_id);
CREATE INDEX IF NOT EXISTS referral_credits_order_idx ON public.referral_credits(order_id);

GRANT SELECT ON public.referral_credits TO authenticated;
GRANT ALL ON public.referral_credits TO service_role;

ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_credits: user reads own"
  ON public.referral_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "referral_credits: admin full write"
  ON public.referral_credits FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Balance helper (SECURITY DEFINER so it can read across users when called by admin fns)
CREATE OR REPLACE FUNCTION public.get_referral_balance(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta_cents), 0)::integer
  FROM public.referral_credits
  WHERE user_id = _user_id;
$$;

REVOKE ALL ON FUNCTION public.get_referral_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referral_balance(uuid) TO authenticated, service_role;

-- Atomic redemption: caller must be signed in, credit is capped by balance & subtotal
CREATE OR REPLACE FUNCTION public.redeem_referral_credit(
  _order_id uuid,
  _requested_cents integer,
  _subtotal_cents integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  balance integer;
  spend integer;
  order_owner uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _requested_cents <= 0 OR _subtotal_cents <= 0 THEN
    RETURN 0;
  END IF;

  SELECT user_id INTO order_owner FROM public.orders WHERE id = _order_id;
  IF order_owner IS NULL OR order_owner <> uid THEN
    RAISE EXCEPTION 'Order does not belong to caller';
  END IF;

  SELECT public.get_referral_balance(uid) INTO balance;
  spend := LEAST(_requested_cents, balance, _subtotal_cents);
  IF spend <= 0 THEN RETURN 0; END IF;

  INSERT INTO public.referral_credits (user_id, delta_cents, source, order_id, notes)
  VALUES (uid, -spend, 'referral_redeemed', _order_id, 'Applied at checkout');

  UPDATE public.orders
     SET discount_cents = COALESCE(discount_cents, 0) + spend,
         total_cents = GREATEST(0, COALESCE(total_cents, 0) - spend),
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('referral_credit_cents', spend)
   WHERE id = _order_id;

  RETURN spend;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_referral_credit(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_referral_credit(uuid, integer, integer) TO authenticated;

-- Auto-issue credits when a referral qualifies
CREATE OR REPLACE FUNCTION public.referrals_issue_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('qualified','rewarded')
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND OLD.status = 'pending' THEN

    IF NEW.reward_referrer_cents > 0 THEN
      INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, order_id, notes)
      VALUES (NEW.referrer_id, NEW.reward_referrer_cents, NEW.currency, 'referral_earned_referrer', NEW.id, NEW.order_id, 'Referral reward — invited friend paid');
    END IF;

    IF NEW.reward_referred_cents > 0 THEN
      INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, order_id, notes)
      VALUES (NEW.referred_user_id, NEW.reward_referred_cents, NEW.currency, 'referral_earned_referred', NEW.id, NEW.order_id, 'Welcome credit — referred signup');
    END IF;
  END IF;

  -- Reversal: cancelled → claw back any credits from this referral
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, notes)
    SELECT user_id, -delta_cents, currency, 'reversal', NEW.id, 'Referral cancelled'
    FROM public.referral_credits
    WHERE referral_id = NEW.id AND source IN ('referral_earned_referrer','referral_earned_referred');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referrals_issue_credits_trg ON public.referrals;
CREATE TRIGGER referrals_issue_credits_trg
AFTER UPDATE OF status ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.referrals_issue_credits();

-- Backfill: any referrals already qualified before this migration get their credits now
INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, order_id, notes)
SELECT r.referrer_id, r.reward_referrer_cents, r.currency, 'referral_earned_referrer', r.id, r.order_id, 'Backfill'
FROM public.referrals r
WHERE r.status IN ('qualified','rewarded')
  AND r.reward_referrer_cents > 0
  AND NOT EXISTS (SELECT 1 FROM public.referral_credits c WHERE c.referral_id = r.id AND c.source = 'referral_earned_referrer');

INSERT INTO public.referral_credits (user_id, delta_cents, currency, source, referral_id, order_id, notes)
SELECT r.referred_user_id, r.reward_referred_cents, r.currency, 'referral_earned_referred', r.id, r.order_id, 'Backfill'
FROM public.referrals r
WHERE r.status IN ('qualified','rewarded')
  AND r.reward_referred_cents > 0
  AND NOT EXISTS (SELECT 1 FROM public.referral_credits c WHERE c.referral_id = r.id AND c.source = 'referral_earned_referred');
