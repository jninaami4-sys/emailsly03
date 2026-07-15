
CREATE POLICY "Admins upload sample datasets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sample-datasets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update sample datasets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'sample-datasets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete sample datasets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sample-datasets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read sample datasets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'sample-datasets' AND public.has_role(auth.uid(), 'admin'));
