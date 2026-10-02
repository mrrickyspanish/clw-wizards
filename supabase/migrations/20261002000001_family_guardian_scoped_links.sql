-- Club-managed guardian links, for co-parents who share one wrestler and
-- nothing else.
--
-- A family_guardians row has so far meant "this guardian sees every wrestler
-- the owner has, now and in future". Two additions:
--
--   athlete_ids  NULL keeps that meaning. A list limits the link to exactly
--                those wrestlers: a child the owner adds later stays private,
--                and so do the owner's family-level records.
--   locked       Set by the club. Neither parent can remove a locked link
--                from the portal; staff change it by hand.
--
-- Parents never write these columns: links are created by invite redemption
-- (service role) or by staff, so owners lose the blanket write policy they
-- had and keep only read and remove-unlocked.

ALTER TABLE public.family_guardians
  ADD COLUMN athlete_ids UUID[],
  ADD COLUMN locked BOOLEAN NOT NULL DEFAULT false;

-- guards_owner(o): am I owner o, or a guardian of o's WHOLE family? Still used
-- for records that belong to the family rather than one wrestler, so a
-- wrestler-limited guardian no longer passes it.
CREATE OR REPLACE FUNCTION public.guards_owner(_owner UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_guardians g
      WHERE g.owner_id = _owner AND g.guardian_id = auth.uid() AND g.athlete_ids IS NULL
    );
$$;

-- guards_athlete(a): may I act for wrestler a? Their parent, a whole-family
-- guardian, or a guardian whose link lists this wrestler. Registration, dues,
-- documents, waivers, tournament entries and file storage all check this.
CREATE OR REPLACE FUNCTION public.guards_athlete(_athlete UUID)
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
            AND (g.athlete_ids IS NULL OR a.id = ANY (g.athlete_ids))
        )
      )
  );
$$;

-- A wrestler's current parent, read past RLS so an athletes policy can compare
-- against it without querying athletes recursively.
CREATE OR REPLACE FUNCTION public.athlete_parent(_athlete UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT parent_id FROM public.athletes WHERE id = _athlete;
$$;

-- Guardians see and edit wrestlers one by one rather than by family. The edit
-- may not change parent_id: before this, a co-guardian could move a shared
-- wrestler onto their own account and out of the other parent's.
DROP POLICY "athletes_guardian_read" ON public.athletes;
CREATE POLICY "athletes_guardian_read" ON public.athletes
  FOR SELECT USING (public.guards_athlete(id));

DROP POLICY "athletes_guardian_update" ON public.athletes;
CREATE POLICY "athletes_guardian_update" ON public.athletes
  FOR UPDATE USING (public.guards_athlete(id))
  WITH CHECK (public.guards_athlete(id) AND parent_id = public.athlete_parent(id));

DROP POLICY "family_guardians_owner_all" ON public.family_guardians;
CREATE POLICY "family_guardians_owner_read" ON public.family_guardians
  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "family_guardians_owner_remove" ON public.family_guardians
  FOR DELETE USING (owner_id = auth.uid() AND NOT locked);

DROP POLICY "family_guardians_guardian_leave" ON public.family_guardians;
CREATE POLICY "family_guardians_guardian_leave" ON public.family_guardians
  FOR DELETE USING (guardian_id = auth.uid() AND NOT locked);
