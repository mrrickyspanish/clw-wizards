-- A permanent record of every family or wrestler removed from the site, for
-- the club's history. Written by the database itself, so it catches every way
-- a removal can happen: Admin -> Families -> Delete permanently, the Supabase
-- dashboard, or SQL. When the site's button is used, the app fills in which
-- admin it was (the button runs with the service role, which the database
-- cannot name).
--
-- A family removal deletes the login, which cascades to the profile and then
-- to the wrestlers. The profile trigger records the family with its wrestlers
-- (they still exist at that point); the wrestler trigger then sees the profile
-- already gone and skips, so a family is one entry. A wrestler removed on
-- their own is recorded by the wrestler trigger.

CREATE TABLE public.deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind TEXT NOT NULL CHECK (kind IN ('family', 'wrestler')),
  profile_id UUID,                    -- the family's account (no FK: it is gone)
  family_name TEXT,
  family_email TEXT,
  wrestlers JSONB NOT NULL DEFAULT '[]', -- [{name, dob, registered, status}]
  had_registration BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by UUID,                    -- the admin, when known
  deleted_by_name TEXT,
  via TEXT NOT NULL,                  -- 'site', 'admin', 'parent', or the database role (dashboard/SQL)
  note TEXT
);
CREATE INDEX deletion_log_deleted_at_idx ON public.deletion_log (deleted_at DESC);
CREATE INDEX deletion_log_profile_id_idx ON public.deletion_log (profile_id);

ALTER TABLE public.deletion_log ENABLE ROW LEVEL SECURITY;
-- Admins read it. Nobody writes it from the site: rows come from the triggers
-- below and the service role, so the record cannot be edited away.
CREATE POLICY "admin_read_deletion_log" ON public.deletion_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- The wrestlers on an account, with whether each had a season registration.
CREATE OR REPLACE FUNCTION public.deletion_log_wrestlers(_parent UUID, _only UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'name', a.first_name || ' ' || a.last_name,
      'dob', a.date_of_birth,
      'registered', e.status IS NOT NULL AND e.status <> 'withdrawn',
      'status', e.status
    ) ORDER BY a.last_name, a.first_name), '[]'::jsonb)
  FROM public.athletes a
  LEFT JOIN LATERAL (
    SELECT se.status FROM public.season_enrollments se
    WHERE se.athlete_id = a.id ORDER BY se.created_at DESC LIMIT 1
  ) e ON TRUE
  WHERE a.parent_id = _parent AND (_only IS NULL OR a.id = _only);
$$;

CREATE OR REPLACE FUNCTION public.log_profile_deletion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  kids JSONB := public.deletion_log_wrestlers(OLD.id);
BEGIN
  -- Staff logins with no wrestlers (e.g. a failed admin sign-up undoing
  -- itself) are not family history.
  IF OLD.role::text <> 'parent' AND jsonb_array_length(kids) = 0 THEN RETURN OLD; END IF;
  INSERT INTO public.deletion_log (kind, profile_id, family_name, family_email, wrestlers, had_registration,
    deleted_by, deleted_by_name, via)
  VALUES ('family', OLD.id, OLD.full_name, OLD.email, kids,
    EXISTS (SELECT 1 FROM jsonb_array_elements(kids) k WHERE (k->>'registered')::boolean),
    auth.uid(), (SELECT full_name FROM public.profiles WHERE id = auth.uid()),
    CASE WHEN auth.uid() IS NULL THEN current_user
         WHEN public.has_role(auth.uid(), 'admin') THEN 'admin' ELSE 'parent' END);
  RETURN OLD;
END;
$$;

CREATE TRIGGER profiles_log_deletion
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_deletion();

CREATE OR REPLACE FUNCTION public.log_athlete_deletion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  parent public.profiles%ROWTYPE;
  kid JSONB;
BEGIN
  SELECT * INTO parent FROM public.profiles WHERE id = OLD.parent_id;
  -- Part of a family removal: the family entry already lists this wrestler.
  IF NOT FOUND THEN RETURN OLD; END IF;
  kid := public.deletion_log_wrestlers(OLD.parent_id, OLD.id);
  INSERT INTO public.deletion_log (kind, profile_id, family_name, family_email, wrestlers, had_registration,
    deleted_by, deleted_by_name, via)
  VALUES ('wrestler', OLD.parent_id, parent.full_name, parent.email, kid,
    COALESCE((kid->0->>'registered')::boolean, FALSE),
    auth.uid(), (SELECT full_name FROM public.profiles WHERE id = auth.uid()),
    CASE WHEN auth.uid() IS NULL THEN current_user
         WHEN public.has_role(auth.uid(), 'admin') THEN 'admin' ELSE 'parent' END);
  RETURN OLD;
END;
$$;

CREATE TRIGGER athletes_log_deletion
  BEFORE DELETE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.log_athlete_deletion();

-- Only the triggers call these.
REVOKE EXECUTE ON FUNCTION public.deletion_log_wrestlers(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_profile_deletion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_athlete_deletion() FROM PUBLIC, anon, authenticated;
