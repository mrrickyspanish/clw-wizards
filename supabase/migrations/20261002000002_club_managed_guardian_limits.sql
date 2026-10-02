-- What a co-guardian on a club-locked link may change.
--
-- 20261002000001 let staff lock a link (family_guardians.locked) for parents
-- who share a wrestler but not a household. Locking stopped them removing each
-- other; it did not stop one undoing the other's work. A locked-link guardian
-- now keeps everything that only adds -- seeing the wrestler, paying dues,
-- uploading documents, signing waivers, tournament entries -- but the season
-- registration, the wrestler's details and the emergency contacts are changed
-- by the account that owns the wrestler, or by the club.
--
-- Also gives each side of a link the other's name: profiles are readable by
-- self only, so the Family page showed "Guardian" for both parents.

-- manages_athlete(a): may I change wrestler a's own records? Their parent, or a
-- guardian whose link covers a and is not locked.
CREATE OR REPLACE FUNCTION public.manages_athlete(_athlete UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id = _athlete
      AND (
        a.parent_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.family_guardians g
          WHERE g.owner_id = a.parent_id
            AND g.guardian_id = auth.uid()
            AND NOT g.locked
            AND (g.athlete_ids IS NULL OR a.id = ANY (g.athlete_ids))
        )
      )
  );
$$;

-- Wrestler details: guardians edit only where they manage.
DROP POLICY "athletes_guardian_update" ON public.athletes;
CREATE POLICY "athletes_guardian_update" ON public.athletes
  FOR UPDATE USING (public.manages_athlete(id)) WITH CHECK (public.manages_athlete(id));

-- Emergency contacts: every guardian of the wrestler reads them; only a
-- manager changes them.
DROP POLICY "family_manage_athlete_guardians" ON public.athlete_guardians;
CREATE POLICY "family_read_athlete_guardians" ON public.athlete_guardians
  FOR SELECT USING (public.guards_athlete(athlete_id));
CREATE POLICY "family_manage_athlete_guardians" ON public.athlete_guardians
  FOR ALL USING (public.manages_athlete(athlete_id)) WITH CHECK (public.manages_athlete(athlete_id));

-- Season registrations are written only by SECURITY DEFINER functions
-- (submit/withdraw), which check guards_athlete. Rather than restate those
-- long functions, refuse the write itself when the signed-in caller does not
-- manage the wrestler. auth.uid() is the caller even inside those functions;
-- it is NULL for the service role (Stripe webhook, staff tools), which passes.
CREATE OR REPLACE FUNCTION public.enforce_enrollment_manager()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NOT public.has_role(auth.uid(), 'staff')
     AND NOT public.manages_athlete(NEW.athlete_id) THEN
    RAISE EXCEPTION 'This wrestler''s registration is managed from the other parent''s account. Contact the club to change it.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER season_enrollments_manager
  BEFORE INSERT OR UPDATE ON public.season_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_enrollment_manager();

-- Names of the people on the other end of my family links, and nothing else
-- of their profiles.
CREATE OR REPLACE FUNCTION public.family_link_names()
RETURNS TABLE (id UUID, full_name TEXT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name FROM public.profiles p
  WHERE p.id IN (
    SELECT guardian_id FROM public.family_guardians WHERE owner_id = auth.uid()
    UNION
    SELECT owner_id FROM public.family_guardians WHERE guardian_id = auth.uid()
  );
$$;
