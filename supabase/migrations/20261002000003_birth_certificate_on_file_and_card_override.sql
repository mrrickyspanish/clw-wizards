-- Two admin decisions the club asked to record, each with who made it and when.
--
-- 1. Birth certificate on file. The club needs a birth certificate only the
--    first time a wrestler registers. Staff mark a returning wrestler as
--    having one on file; the parent's Documents page then stops asking for it
--    and "missing birth certificate" messages leave them out.
--
-- 2. Card check override. Approval requires a verified USA Wrestling card, but
--    staff often confirm membership another way (USA Wrestling's own lookup).
--    An admin may approve without the card check; the override, who made it,
--    when, and an optional note are kept on the registration.
--
-- Parents can edit their own wrestlers and never write registrations directly,
-- so a trigger keeps the birth-certificate fields admin-only, and the override
-- fields are written only by the admin approval action (service role).

ALTER TABLE public.athletes
  ADD COLUMN birth_certificate_on_file BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN birth_certificate_on_file_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN birth_certificate_on_file_at TIMESTAMPTZ;

ALTER TABLE public.season_enrollments
  ADD COLUMN card_override_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN card_override_at TIMESTAMPTZ,
  ADD COLUMN card_override_note TEXT;

-- Only staff tools (service role, where auth.uid() is NULL) or an admin may
-- set or change the on-file fields. A parent's insert or edit keeps them as
-- they were.
CREATE OR REPLACE FUNCTION public.keep_birth_certificate_on_file_admin_only()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.birth_certificate_on_file := false;
    NEW.birth_certificate_on_file_by := NULL;
    NEW.birth_certificate_on_file_at := NULL;
  ELSE
    NEW.birth_certificate_on_file := OLD.birth_certificate_on_file;
    NEW.birth_certificate_on_file_by := OLD.birth_certificate_on_file_by;
    NEW.birth_certificate_on_file_at := OLD.birth_certificate_on_file_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER athletes_birth_certificate_on_file_admin_only
  BEFORE INSERT OR UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.keep_birth_certificate_on_file_admin_only();
