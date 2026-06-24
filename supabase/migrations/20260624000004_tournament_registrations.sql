CREATE TABLE public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'withdrawn', 'no_show')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (tournament_id, athlete_id)
);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_own_registrations" ON public.tournament_registrations
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "admin_staff_all_registrations" ON public.tournament_registrations
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "admin_write_registrations" ON public.tournament_registrations
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_registrations" ON public.tournament_registrations
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_delete_registrations" ON public.tournament_registrations
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
