CREATE TABLE public.athlete_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('birth_certificate', 'usa_wrestling_card', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.athlete_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_own_athlete_docs" ON public.athlete_documents
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "admin_staff_all_athlete_docs" ON public.athlete_documents
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "admin_write_athlete_docs" ON public.athlete_documents
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for athlete documents (birth certificates, USA Wrestling cards).
-- Private — not the public 'documents' bucket driver-hub already created.
INSERT INTO storage.buckets (id, name, public)
VALUES ('athlete-documents', 'athlete-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "parents_upload_own_athlete_docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'athlete-documents' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "parents_read_own_athlete_docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'athlete-documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'staff')
    )
  );

CREATE POLICY "admin_delete_athlete_docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'athlete-documents' AND public.has_role(auth.uid(), 'admin')
  );
