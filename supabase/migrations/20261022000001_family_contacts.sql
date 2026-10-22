-- Family contacts (Tyler, Oct 22): other people who get the club's messages
-- for a family, such as a second parent, without a login of their own. The
-- account owner manages them on Profile; admins on the family's page.
--
-- Most families already gave a second parent on the registration form
-- (athlete_guardians), so the list starts from those and keeps picking up new
-- ones from later forms. A contact the family removed stays as a removed row,
-- so a later form or resubmission does not quietly add it back.
--
-- Emails go out with Communications sends. The phone is kept for texts, but
-- nothing texts it yet: that person has to agree to club texts themselves.

CREATE TABLE public.family_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT CHECK (email IS NULL OR position('@' IN email) > 1),
  phone TEXT,
  -- null: every wrestler on the family. A list: only messages about those
  -- wrestlers (a second parent listed on one child's form, not a sibling's).
  athlete_ids UUID[],
  source TEXT NOT NULL DEFAULT 'family' CHECK (source IN ('family', 'form', 'admin')),
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE INDEX family_contacts_owner_idx ON public.family_contacts (owner_id);
CREATE UNIQUE INDEX family_contacts_owner_email_key
  ON public.family_contacts (owner_id, lower(email))
  WHERE email IS NOT NULL AND removed_at IS NULL;

CREATE TRIGGER update_family_contacts_updated_at
  BEFORE UPDATE ON public.family_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.family_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_read_family_contacts" ON public.family_contacts
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owner_insert_family_contacts" ON public.family_contacts
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
-- Removing one is an update (removed_at), never a delete.
CREATE POLICY "owner_update_family_contacts" ON public.family_contacts
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "admin_manage_family_contacts" ON public.family_contacts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Plain 10 digits for a US number, else what was typed; null when empty.
CREATE OR REPLACE FUNCTION public.contact_phone(_raw TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN nullif(btrim(_raw), '') IS NULL THEN NULL
    WHEN length(regexp_replace(_raw, '\D', '', 'g')) = 10 THEN regexp_replace(_raw, '\D', '', 'g')
    WHEN length(regexp_replace(_raw, '\D', '', 'g')) = 11 AND regexp_replace(_raw, '\D', '', 'g') LIKE '1%'
      THEN substr(regexp_replace(_raw, '\D', '', 'g'), 2)
    ELSE btrim(_raw)
  END;
$$;

-- Adds a guardian from a wrestler's form to that family's contacts, unless it
-- is the account owner, is already there (then the wrestler is added to it),
-- or the family removed it.
CREATE OR REPLACE FUNCTION public.add_family_contact_from_guardian(
  _athlete UUID, _name TEXT, _email TEXT, _phone TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner UUID;
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_owner_phone TEXT;
  v_email TEXT := nullif(lower(btrim(_email)), '');
  v_phone TEXT := public.contact_phone(_phone);
  v_name TEXT := nullif(btrim(_name), '');
  v_contact public.family_contacts%ROWTYPE;
BEGIN
  SELECT a.parent_id, lower(btrim(p.email)), lower(btrim(p.full_name)), public.contact_phone(p.phone)
    INTO v_owner, v_owner_email, v_owner_name, v_owner_phone
  FROM public.athletes a JOIN public.profiles p ON p.id = a.parent_id
  WHERE a.id = _athlete;
  IF v_owner IS NULL THEN RETURN; END IF;

  -- The owner themselves: same email, or their own name with another address.
  IF v_email IS NOT NULL AND v_email = v_owner_email THEN RETURN; END IF;
  IF v_name IS NOT NULL AND lower(v_name) = v_owner_name THEN RETURN; END IF;
  IF v_email IS NULL AND (v_phone IS NULL OR v_phone = v_owner_phone) THEN RETURN; END IF;

  IF v_email IS NOT NULL THEN
    SELECT * INTO v_contact FROM public.family_contacts
    WHERE owner_id = v_owner AND lower(email) = v_email
    ORDER BY removed_at NULLS FIRST LIMIT 1;
  ELSE
    SELECT * INTO v_contact FROM public.family_contacts
    WHERE owner_id = v_owner AND phone = v_phone
    ORDER BY removed_at NULLS FIRST LIMIT 1;
  END IF;

  IF v_contact.id IS NULL THEN
    INSERT INTO public.family_contacts (owner_id, name, email, phone, athlete_ids, source)
    VALUES (v_owner, v_name, v_email, v_phone, ARRAY[_athlete], 'form');
  ELSIF v_contact.removed_at IS NULL THEN
    UPDATE public.family_contacts SET
      athlete_ids = CASE
        WHEN athlete_ids IS NULL OR _athlete = ANY (athlete_ids) THEN athlete_ids
        ELSE athlete_ids || _athlete
      END,
      name = coalesce(name, v_name),
      phone = coalesce(phone, v_phone)
    WHERE id = v_contact.id;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.add_family_contact_from_guardian(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_family_contact_from_guardian()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.add_family_contact_from_guardian(NEW.athlete_id, NEW.name, NEW.email, NEW.phone);
  RETURN NEW;
-- A contact problem must never fail the registration or form import that saved the guardian.
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'family contact not added for athlete %: %', NEW.athlete_id, SQLERRM;
  RETURN NEW;
END;
$$;

-- New forms, and a changed email or phone on one. A resubmission with the same
-- details changes nothing, so it cannot bring back a contact the family removed.
CREATE TRIGGER athlete_guardians_add_family_contact
  AFTER INSERT ON public.athlete_guardians
  FOR EACH ROW EXECUTE FUNCTION public.sync_family_contact_from_guardian();
CREATE TRIGGER athlete_guardians_update_family_contact
  AFTER UPDATE OF email, phone ON public.athlete_guardians
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.phone IS DISTINCT FROM NEW.phone)
  EXECUTE FUNCTION public.sync_family_contact_from_guardian();

-- Start from every form already on file.
DO $$
DECLARE g RECORD;
BEGIN
  FOR g IN SELECT athlete_id, name, email, phone FROM public.athlete_guardians ORDER BY created_at, ordinal LOOP
    PERFORM public.add_family_contact_from_guardian(g.athlete_id, g.name, g.email, g.phone);
  END LOOP;
END;
$$;
