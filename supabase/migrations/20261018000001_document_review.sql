-- Document review (Tony, Oct 18): an email when a family uploads a USA card or
-- birth certificate, a To review page, and a way to reject an upload that
-- isn't right.
--
-- Rejecting removes the upload's athlete_documents row, so every list and page
-- that asks "is it on file?" (missing-document emails, Registrations, Families,
-- the parent's Documents page) treats the wrestler as missing again with no
-- extra rule to keep in sync. The rejection itself is kept here: what was
-- rejected, why, by whom and when. The file stays in storage (file_url).

CREATE TABLE public.document_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('birth_certificate', 'usa_wrestling_card')),
  reason TEXT NOT NULL CHECK (btrim(reason) <> ''),
  file_name TEXT,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX document_rejections_athlete_idx ON public.document_rejections (athlete_id, doc_type, rejected_at DESC);

ALTER TABLE public.document_rejections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_document_rejections" ON public.document_rejections
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- The family sees why, so they know what to upload instead.
CREATE POLICY "family_read_document_rejections" ON public.document_rejections
  FOR SELECT USING (parent_id = auth.uid() OR public.guards_athlete(athlete_id));

-- Upload notices: who gets an email when a family uploads a card or birth
-- certificate. Same shape and rules as payment_notice_recipients; managed in
-- Admin -> Communications -> Upload notices.
CREATE TABLE public.upload_notice_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (btrim(name) <> ''),
  email TEXT NOT NULL CHECK (position('@' IN email) > 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX upload_notice_recipients_email_key ON public.upload_notice_recipients (lower(email));

ALTER TABLE public.upload_notice_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_upload_notice_recipients" ON public.upload_notice_recipients
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tony asked (Oct 18) for himself.
INSERT INTO public.upload_notice_recipients (name, email) VALUES
  ('Tony Fontanetta', 'arfont37@sbcglobal.net');
