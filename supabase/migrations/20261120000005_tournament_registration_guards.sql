-- Tighter rules on tournament_registrations (operator decision, Nov 20).
--
-- The original policy parents_own_registrations is FOR ALL USING
-- (parent_id = auth.uid()) with no separate check, so any signed-in user could
-- add a registration for ANY wrestler by putting their own id in parent_id,
-- and could delete their own registration rows through the API even after
-- paying. Restrictive policies apply on top of every permissive one, so these
-- close both gaps without changing the existing policies:
--   * INSERT and UPDATE need an admin or someone who guards the wrestler
--     (the parent, a whole-family co-parent, or a co-parent whose link lists
--     this wrestler, locked or not).
--   * DELETE by a non-admin only works on a row with no payment on it.
-- The service role (the site's server, the Stripe webhook) is not subject to
-- RLS, so it is unaffected.

CREATE POLICY "treg_guarded_insert" ON public.tournament_registrations
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.guards_athlete(athlete_id));

CREATE POLICY "treg_guarded_update" ON public.tournament_registrations
  AS RESTRICTIVE FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.guards_athlete(athlete_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.guards_athlete(athlete_id));

CREATE POLICY "treg_unpaid_delete" ON public.tournament_registrations
  AS RESTRICTIVE FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR (paid_cents = 0 AND payment_method IS NULL));
