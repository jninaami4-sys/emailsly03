DROP POLICY IF EXISTS "Announcement media authenticated write" ON storage.objects;
DROP POLICY IF EXISTS "Announcement media authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Announcement media authenticated delete" ON storage.objects;

CREATE POLICY "Announcement media admin write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'announcement-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Announcement media admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'announcement-media' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'announcement-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Announcement media admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'announcement-media' AND public.has_role(auth.uid(), 'admin'));