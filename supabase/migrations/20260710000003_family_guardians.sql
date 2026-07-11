-- Multi-guardian families. Today athletes.parent_id ties a wrestler to one
-- account. This lets a second guardian (co-parent, grandparent) join an
-- existing family via an invite code and co-manage the same wrestlers, without
-- re-adding them. Directional: an owner invites guardians into THEIR family.

-- Person-level link so future wrestlers the owner adds are covered automatically.
CREATE TABLE public.family_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, guardian_id),
  CHECK (owner_id <> guardian_id)
);
ALTER TABLE public.family_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_guardians_owner_all" ON public.family_guardians
  FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "family_guardians_guardian_read" ON public.family_guardians
  FOR SELECT USING (guardian_id = auth.uid());
CREATE POLICY "family_guardians_admin_read" ON public.family_guardians
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Single-use invite codes an owner generates to bring a guardian into the family.
CREATE TABLE public.family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_invites_owner_all" ON public.family_invites
  FOR ALL USING (inviter_id = auth.uid());

-- guards_owner(o): am I (auth.uid()) an owner or a guardian of owner o's family?
CREATE OR REPLACE FUNCTION public.guards_owner(_owner UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_guardians g
      WHERE g.owner_id = _owner AND g.guardian_id = auth.uid()
    );
$$;

-- guards_athlete(a): do I guard the family that owns athlete a?
CREATE OR REPLACE FUNCTION public.guards_athlete(_athlete UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id = _athlete AND public.guards_owner(a.parent_id)
  );
$$;

-- Co-guardians can see and edit the family's wrestlers (not delete — owner only).
CREATE POLICY "athletes_guardian_read" ON public.athletes
  FOR SELECT USING (public.guards_owner(parent_id));
CREATE POLICY "athletes_guardian_update" ON public.athletes
  FOR UPDATE USING (public.guards_owner(parent_id));

-- ...register the family's wrestlers and see the family's registrations.
CREATE POLICY "treg_guardian_all" ON public.tournament_registrations
  FOR ALL USING (public.guards_athlete(athlete_id)) WITH CHECK (public.guards_athlete(athlete_id));

-- ...see athlete-linked dues (read only for now).
CREATE POLICY "dues_guardian_read" ON public.dues_payments
  FOR SELECT USING (athlete_id IS NOT NULL AND public.guards_athlete(athlete_id));
