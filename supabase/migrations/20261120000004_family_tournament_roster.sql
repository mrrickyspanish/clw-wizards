-- Tournament rosters for families, own kids only (Tyler, Nov 14 video: B7).
--
-- tournament_entries (pasted TrackWrestling rosters) stays admin only. This
-- function gives a signed-in parent or co-parent just their own wrestlers'
-- tournaments, from two places:
--   (a) registrations made on the club site (registered or confirmed), with
--       the division and weight the family entered, and
--   (b) TrackWrestling rows an admin matched to the wrestler, with no
--       TrackWrestling name, division or weight (a wrong match must not show
--       another child's details).
-- Every row passes guards_athlete(), which covers the wrestler's parent,
-- whole-family co-parents, and links limited to certain wrestlers (locked or
-- not). There is no admin bypass: an admin sees only wrestlers they guard.
-- Covers tournaments from 30 days ago onward.
--
-- registration_state is the site registration's payment state, checked in
-- this order: 'waived'; 'free' when the effective fee (the registration's
-- locked fee_cents, else the tournament's entry_fee_cents) is missing or 0;
-- 'paid' when paid_cents covers it; otherwise 'due'. src/lib's
-- registrationPaymentState uses the same order. NULL for TrackWrestling rows.

CREATE OR REPLACE FUNCTION public.family_tournament_roster()
RETURNS TABLE (
  tournament_id UUID,
  tournament_name TEXT,
  date DATE,
  location TEXT,
  city TEXT,
  state TEXT,
  street_address TEXT,
  athlete_id UUID,
  athlete_first_name TEXT,
  athlete_last_name TEXT,
  source TEXT,
  division TEXT,
  weight TEXT,
  registration_state TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.name, t.date, t.location, t.city, t.state, t.street_address,
    a.id, a.first_name, a.last_name,
    'site'::TEXT, r.division, r.weight,
    CASE
      WHEN r.payment_method = 'waived' THEN 'waived'
      WHEN coalesce(r.fee_cents, t.entry_fee_cents, 0) = 0 THEN 'free'
      WHEN r.paid_cents >= coalesce(r.fee_cents, t.entry_fee_cents) THEN 'paid'
      ELSE 'due'
    END
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
  JOIN public.athletes a ON a.id = r.athlete_id
  WHERE auth.uid() IS NOT NULL
    AND r.status IN ('registered', 'confirmed')
    AND t.date >= current_date - 30
    AND public.guards_athlete(r.athlete_id)
  UNION ALL
  SELECT t.id, t.name, t.date, t.location, t.city, t.state, t.street_address,
    a.id, a.first_name, a.last_name,
    'trackwrestling'::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT
  FROM public.tournament_entries e
  JOIN public.tournaments t ON t.id = e.tournament_id
  JOIN public.athletes a ON a.id = e.athlete_id
  WHERE auth.uid() IS NOT NULL
    AND e.athlete_id IS NOT NULL
    AND t.date >= current_date - 30
    AND public.guards_athlete(e.athlete_id)
  ORDER BY 3, 2, 10, 9;
$$;

REVOKE EXECUTE ON FUNCTION public.family_tournament_roster() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.family_tournament_roster() TO authenticated;
