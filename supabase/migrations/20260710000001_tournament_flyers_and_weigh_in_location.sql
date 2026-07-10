-- Weigh-in location (can differ from the tournament venue — sometimes the
-- club facility, sometimes the event site).
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS weigh_in_location TEXT;

-- Public bucket for tournament flyers. Public so the uploaded flyer can be the
-- homepage event preview; writes are admin-only.
INSERT INTO storage.buckets (id, name, public)
VALUES ('tournament-flyers', 'tournament-flyers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_tournament_flyers" ON storage.objects
  FOR SELECT USING (bucket_id = 'tournament-flyers');

CREATE POLICY "admin_insert_tournament_flyers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'tournament-flyers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_tournament_flyers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'tournament-flyers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_delete_tournament_flyers" ON storage.objects
  FOR DELETE USING (bucket_id = 'tournament-flyers' AND public.has_role(auth.uid(), 'admin'));
