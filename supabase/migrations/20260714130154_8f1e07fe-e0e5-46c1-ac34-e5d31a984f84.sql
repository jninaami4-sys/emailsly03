
-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role text,
  country text,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  media_kind text NOT NULL CHECK (media_kind IN ('text','video')),
  video_path text,
  video_poster_path text,
  duration_sec int,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reject_reason text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reviews_status_created_idx ON public.reviews (status, created_at DESC);
CREATE INDEX reviews_user_idx ON public.reviews (user_id);
-- Only one pending review per user at a time.
CREATE UNIQUE INDEX reviews_one_pending_per_user ON public.reviews (user_id) WHERE status = 'pending';

-- GRANTs (Data API requires these)
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "Approved reviews are public"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

-- Authenticated users can read their own reviews (any status)
CREATE POLICY "Users can read own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert own reviews, always as pending
CREATE POLICY "Users can submit own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users cannot update or delete once submitted; only admins can.
CREATE POLICY "Admins can update reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger reuses existing set_updated_at()
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Stamp approved_at when status transitions to approved.
CREATE OR REPLACE FUNCTION public.reviews_touch_approved_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_stamp_approved_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_touch_approved_at();

-- Storage policies for the 'reviews' bucket.
-- Object path convention: {user_id}/{uuid}.{ext}
CREATE POLICY "Users can upload own review media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reviews'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own review media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reviews'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own review media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reviews'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins manage all review media"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'reviews' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'reviews' AND public.has_role(auth.uid(), 'admin'));
