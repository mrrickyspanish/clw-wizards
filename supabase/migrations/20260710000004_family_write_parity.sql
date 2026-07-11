-- Round out co-guardian access: documents, dues visibility, and letting a
-- guardian leave a family. Builds on guards_owner()/guards_athlete() from
-- 20260710000003.

-- Co-guardians can see and upload the family's athlete documents (metadata rows).
CREATE POLICY "adoc_guardian_read" ON public.athlete_documents
  FOR SELECT USING (public.guards_athlete(athlete_id));
CREATE POLICY "adoc_guardian_insert" ON public.athlete_documents
  FOR INSERT WITH CHECK (public.guards_athlete(athlete_id));

-- ...and the underlying files. Paths are `<uploader_uid>/<athlete_id>/<file>`,
-- so the athlete id is the 2nd path segment.
CREATE POLICY "guardians_read_athlete_docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'athlete-documents'
    AND public.guards_athlete(((storage.foldername(name))[2])::uuid)
  );
CREATE POLICY "guardians_upload_athlete_docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'athlete-documents'
    AND public.guards_athlete(((storage.foldername(name))[2])::uuid)
  );

-- Co-guardians can see all of the family's dues (not only athlete-linked ones).
CREATE POLICY "dues_guardian_owner_read" ON public.dues_payments
  FOR SELECT USING (public.guards_owner(parent_id));

-- A guardian can remove themselves from a family they joined.
CREATE POLICY "family_guardians_guardian_leave" ON public.family_guardians
  FOR DELETE USING (guardian_id = auth.uid());
