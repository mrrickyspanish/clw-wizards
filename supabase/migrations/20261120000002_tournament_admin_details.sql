-- Admin-only tournament details (Tyler, Nov 14 video: B5 and B6).
--
-- The tournaments table is readable by everyone, including visitors who are
-- not signed in, and the public pages select every column. So the club's
-- TrackWrestling club-registrations link (B5) and the number of spots the club
-- was given (B6) live here, one row per tournament, readable and writable by
-- admins only. Not staff, not parents, not the public.

CREATE TABLE public.tournament_admin_details (
  tournament_id UUID PRIMARY KEY REFERENCES public.tournaments(id) ON DELETE CASCADE,
  club_registrations_url TEXT
    CONSTRAINT tournament_admin_details_url_https CHECK (
      club_registrations_url IS NULL
      OR (club_registrations_url LIKE 'https://%' AND char_length(club_registrations_url) <= 500)
    ),
  spots_allotted INTEGER
    CONSTRAINT tournament_admin_details_spots_range CHECK (spots_allotted IS NULL OR spots_allotted BETWEEN 1 AND 500),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TRIGGER update_tournament_admin_details_updated_at
  BEFORE UPDATE ON public.tournament_admin_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tournament_admin_details ENABLE ROW LEVEL SECURITY;

-- The only policy: admins read and write. No staff, parent or public policy.
CREATE POLICY "admins_manage_tournament_admin_details" ON public.tournament_admin_details
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Second layer: visitors who are not signed in get no table privileges at all.
REVOKE ALL ON TABLE public.tournament_admin_details FROM anon;
