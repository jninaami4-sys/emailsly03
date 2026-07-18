
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_archived_idx ON public.orders (archived_at) WHERE archived_at IS NOT NULL;

-- Hide archived orders from customer reads; admins still see everything (has_role branch).
DROP POLICY IF EXISTS "orders: client reads own" ON public.orders;
CREATE POLICY "orders: client reads own" ON public.orders
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      archived_at IS NULL
      AND (
        user_id = auth.uid()
        OR lower(email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))
      )
    )
  );
