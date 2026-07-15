-- Public bucket for sponsor logos. Public so the uploaded logo can render in the
-- homepage/sponsorship lazy-river marquee; writes are admin-only. Mirrors the
-- tournament-flyers bucket policies.
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_sponsor_logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'sponsor-logos');

CREATE POLICY "admin_insert_sponsor_logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sponsor-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_sponsor_logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'sponsor-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_delete_sponsor_logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'sponsor-logos' AND public.has_role(auth.uid(), 'admin'));
