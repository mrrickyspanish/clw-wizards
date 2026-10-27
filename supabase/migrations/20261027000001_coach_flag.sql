-- Coaches (Tyler, Oct 27): Tony and Tyler tick "Coach" on a parent, the
-- account owner or a second parent, and Communications can email everyone
-- ticked. Only an admin (or the site's server) can change it: a parent editing
-- their own profile or contacts cannot mark anyone a coach.

ALTER TABLE public.profiles ADD COLUMN is_coach BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.family_contacts ADD COLUMN is_coach BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.keep_is_coach_admin_only()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_coach := false;
  ELSE
    NEW.is_coach := OLD.is_coach;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.keep_is_coach_admin_only() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_is_coach_admin_only
  BEFORE INSERT OR UPDATE OF is_coach ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.keep_is_coach_admin_only();
CREATE TRIGGER family_contacts_is_coach_admin_only
  BEFORE INSERT OR UPDATE OF is_coach ON public.family_contacts
  FOR EACH ROW EXECUTE FUNCTION public.keep_is_coach_admin_only();
