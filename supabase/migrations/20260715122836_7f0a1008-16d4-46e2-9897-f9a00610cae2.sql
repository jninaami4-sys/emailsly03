
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS image_style text NOT NULL DEFAULT 'cover';

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_image_style_check;
ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_image_style_check
  CHECK (image_style IN ('cover','thumbnail','none'));

DROP POLICY IF EXISTS "Announcement media public read" ON storage.objects;
CREATE POLICY "Announcement media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-media');

DROP POLICY IF EXISTS "Announcement media authenticated write" ON storage.objects;
CREATE POLICY "Announcement media authenticated write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'announcement-media');

DROP POLICY IF EXISTS "Announcement media authenticated update" ON storage.objects;
CREATE POLICY "Announcement media authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'announcement-media');

DROP POLICY IF EXISTS "Announcement media authenticated delete" ON storage.objects;
CREATE POLICY "Announcement media authenticated delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'announcement-media');
