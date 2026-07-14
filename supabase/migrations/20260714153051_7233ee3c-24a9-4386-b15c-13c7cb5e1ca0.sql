
-- =========================================================
-- CLIENTS + ORDERS: portable data model
-- =========================================================

-- Order status enum
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending','in_progress','delivered','cancelled','refunded','revision_requested'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'unpaid','paid','refunded','failed','pending'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  company       text,
  phone         text,
  country       text,
  notes         text,
  imported_from text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (lower(email));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: user reads own"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "profiles: user updates own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "profiles: user inserts own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email             text NOT NULL,
  service_id        text,
  service_label     text NOT NULL,
  quantity          integer NOT NULL DEFAULT 1,
  subtotal_cents    integer NOT NULL DEFAULT 0,
  discount_cents    integer NOT NULL DEFAULT 0,
  promo_code        text,
  total_cents       integer NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'USD',
  status            public.order_status NOT NULL DEFAULT 'pending',
  payment_status    public.payment_status NOT NULL DEFAULT 'unpaid',
  payment_provider  text,
  payment_ref       text,
  delivery_url      text,
  delivery_notes    text,
  delivered_at      timestamptz,
  delivered_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  cancel_reason     text,
  cancelled_at      timestamptz,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_from     text,
  external_id       text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_import_unique
  ON public.orders (imported_from, external_id)
  WHERE imported_from IS NOT NULL AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_user_idx     ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_email_idx    ON public.orders (lower(email));
CREATE INDEX IF NOT EXISTS orders_status_idx   ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_created_idx  ON public.orders (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: client reads own"
  ON public.orders FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email',''))
    OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "orders: admin writes"
  ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- order_events (audit / timeline) ----------
CREATE TABLE IF NOT EXISTS public.order_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text NOT NULL DEFAULT 'system',
  event_type text NOT NULL,
  message    text,
  metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_events_order_idx ON public.order_events (order_id, created_at DESC);

GRANT SELECT, INSERT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_events: read via own order"
  ON public.order_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_events.order_id
        AND (o.user_id = auth.uid()
             OR lower(o.email) = lower(coalesce(auth.jwt() ->> 'email','')))
    )
  );

CREATE POLICY "order_events: client inserts on own order"
  ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_events.order_id
        AND (o.user_id = auth.uid()
             OR lower(o.email) = lower(coalesce(auth.jwt() ->> 'email','')))
    )
  );

-- ---------- order_messages ----------
CREATE TABLE IF NOT EXISTS public.order_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_role text NOT NULL DEFAULT 'client',
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_messages_order_idx ON public.order_messages (order_id, created_at);

GRANT SELECT, INSERT ON public.order_messages TO authenticated;
GRANT ALL ON public.order_messages TO service_role;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_messages: read via own order"
  ON public.order_messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_messages.order_id
        AND (o.user_id = auth.uid()
             OR lower(o.email) = lower(coalesce(auth.jwt() ->> 'email','')))
    )
  );

CREATE POLICY "order_messages: send via own order"
  ON public.order_messages FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_messages.order_id
        AND (o.user_id = auth.uid()
             OR lower(o.email) = lower(coalesce(auth.jwt() ->> 'email','')))
    )
  );

-- ---------- helpful view: revenue rollup (used by admin) ----------
-- (No view; admin server fn computes stats to keep this migration slim.)
