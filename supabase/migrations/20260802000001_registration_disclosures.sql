-- Legal agreements families sign as part of annual registration.
--
-- Until now the only consent this platform recorded was the SMS opt-in on
-- profiles. The club's real registration has always carried a liability waiver
-- and minor release (see docs/annual-registration-form.md); it just lived in a
-- Google Form. This brings it in.
--
-- Two rules drive the shape of these tables:
--
-- 1. Disclosure text is versioned by INSERT, never by UPDATE. An acceptance
--    points at the exact row whose text was on screen, so "what did this family
--    actually agree to in 2026" stays answerable after the board revises the
--    wording. Editing a body in place would silently rewrite history for every
--    signature already collected.
--
-- 2. Acceptance is per athlete, per season. The waiver names the participant
--    and is year-stamped, so a returning wrestler re-signs rather than
--    inheriting last season's signature.

CREATE TABLE public.disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  -- The agreement itself. Stored whole rather than assembled from copy in the
  -- app so the acceptance record and the rendered page cannot drift.
  body TEXT NOT NULL,
  -- The single sentence next to the checkbox, e.g. "I agree to all of the
  -- terms and conditions listed above."
  agreement_label TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  required BOOLEAN NOT NULL DEFAULT true,
  -- Whether a typed signature is collected alongside the checkbox.
  requires_signature BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug, version)
);

-- At most one live version of a given agreement. Superseding one means
-- inserting the next version and clearing active on the old row, which keeps
-- the old text readable for the signatures attached to it.
CREATE UNIQUE INDEX disclosures_one_active_per_slug
  ON public.disclosures(slug)
  WHERE active;

CREATE TABLE public.disclosure_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disclosure_id UUID NOT NULL REFERENCES public.disclosures(id) ON DELETE RESTRICT,
  season_registration_id UUID NOT NULL REFERENCES public.season_registrations(id) ON DELETE RESTRICT,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  -- The guardian who signed, which is not necessarily the athlete's parent_id
  -- once co-guardians are linked through family_guardians.
  accepted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  typed_signature TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (disclosure_id, season_registration_id, athlete_id)
);

CREATE INDEX disclosure_acceptances_season_athlete_idx
  ON public.disclosure_acceptances(season_registration_id, athlete_id);

ALTER TABLE public.disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disclosure_acceptances ENABLE ROW LEVEL SECURITY;

-- Public, including signed-out visitors: /terms and /privacy render straight
-- from these rows, matching how season_registrations became publicly readable
-- in 20260731000001.
CREATE POLICY "public_read_active_disclosures" ON public.disclosures
  FOR SELECT TO anon, authenticated USING (active);

CREATE POLICY "admin_manage_disclosures" ON public.disclosures
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "family_read_disclosure_acceptances" ON public.disclosure_acceptances
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR public.guards_athlete(athlete_id)
  );

-- Families may sign, but only for their own wrestlers and only in their own
-- name. There is deliberately no family UPDATE or DELETE policy: a signature is
-- an evidentiary record, so revising one is an admin action.
CREATE POLICY "family_sign_disclosure_acceptances" ON public.disclosure_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (public.guards_athlete(athlete_id) AND accepted_by = auth.uid());

CREATE POLICY "admin_manage_disclosure_acceptances" ON public.disclosure_acceptances
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_disclosures_updated_at
  BEFORE UPDATE ON public.disclosures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Verbatim from the club's registration form. Reformatted for line width only;
-- the capitalization is the source document's and is left alone, because a
-- release that shouts its risk clauses is doing that on purpose.
INSERT INTO public.disclosures (slug, title, agreement_label, version, required, requires_signature, active, body)
VALUES (
  'program_waiver',
  'Program Waiver and Release of All Claims',
  'I agree to all of the terms and conditions listed in the above PROGRAM WAIVER AND RELEASE OF ALL CLAIMS.',
  1,
  true,
  true,
  true,
  $waiver$RELEASE AND WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT WITH PARENTAL CONSENT ("AGREEMENT") IN CONSIDERATION of being permitted to participate in any way in any event ("Activity") at any time during the current calendar year I, for myself, my personal representatives, assigns, heirs, and next of kin:

1. ACKNOWLEDGE, agree, and represent that I understand the nature of the Activity and that I am qualified, in good health, and in proper physical condition to participate in such Activity. I further agree and warrant that if, at any time, I believe the conditions to be unsafe, I will immediately discontinue further participation in the Activity.

2. FULLY UNDERSTAND that: (a) THIS ACTIVITY INVOLVES RISKS AND DANGERS OF SERIOUS BODILY INJURY, INCLUDING PERMANENT DISABILITY, PARALYSIS, AND DEATH ("Risks"); (b) these Risks and dangers may be caused by my own actions or inactions, the actions or inactions of others participating in the Activity, the conditions in which the Activity takes place, or THE NEGLIGENCE OF THE "RELEASEES" NAMED BELOW; (c) there may be OTHER RISKS or SOCIAL AND ECONOMIC LOSSES either not known to me or not readily foreseeable at this time; and I FULLY ACCEPT AND ASSUME ALL SUCH RISKS AND ALL RESPONSIBILITY FOR LOSSES, COSTS, AND DAMAGES I incur as a result of my participation, or that of the minor, in the activity.

3. HEREBY RELEASE, DISCHARGE, AND COVENANT NOT TO SUE the sanctioning organization(s), Wizards board, coaches, their administrators, directors, agents, officers, members, volunteers, and employees, other participants, officials, rescue personnel, sponsors, advertisers, school district 155, Crystal Lake Park District, owners and lessees of premises on which the Activity is conducted, (each of the forgoing shall be considered one of the RELEASEES herein) FROM ALL LIABILITY, CLAIMS, DEMANDS, LOSSES, OR DAMAGES ON MY ACCOUNT CAUSED, OR ALLEGED TO BE CAUSED, IN WHOLE OR IN PART BY THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE, INCLUDING NEGLIGENT RESCUE OPERATIONS; AND I FURTHER AGREE that if, despite this RELEASE AND WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT I, or anyone on my behalf, makes a claim against any of the Releasees, I WILL INDEMNIFY, SAVE, AND HOLD HARMLESS EACH OF THE RELEASEES from any litigation expenses, attorney fees, loss, liability, damage, or cost which may be incurred as the result of such claim.

I ACKNOWLEDGE THAT I AM OVER THE AGE OF 18 YEARS, HAVE READ THIS AGREEMENT AND FULLY UNDERSTAND ITS TERMS, UNDERSTAND THAT I HAVE GIVEN UP SUBSTANTIAL RIGHTS BY SIGNING IT, HAVE SIGNED IT FREELY AND WITHOUT ANY INDUCEMENT OR ASSURANCE OF ANY NATURE, AND I INTEND IT TO BE A COMPLETE AND UNCONDITIONAL RELEASE OF ALL LIABILITY TO THE GREATEST EXTENT ALLOWED BY LAW AND AGREE THAT IF ANY PORTION OF THIS AGREEMENT IS HELD TO BE INVALID, THE BALANCE, NOTWITHSTANDING, SHALL CONTINUE IN FULL FORCE AND EFFECT.

Below section must be completed by Parent/Guardian for any participant under the age of 18.

MINOR RELEASE

AND I, THE MINOR'S PARENT AND/OR LEGAL GUARDIAN, UNDERSTAND THE NATURE OF THE ACTIVITY AND THE MINOR'S EXPERIENCE AND CAPABILITIES AND BELIEVE THE MINOR TO BE QUALIFIED, IN GOOD HEALTH, AND IN PROPER PHYSICAL CONDITION TO PARTICIPATE IN SUCH ACTIVITY. I HEREBY RELEASE, DISCHARGE, COVENANT NOT TO SUE, AND AGREE TO INDEMNIFY AND SAVE AND HOLD HARMLESS EACH OF THE RELEASEE'S FROM ALL LIABILITY, CLAIMS, DEMANDS, LOSSES, OR DAMAGES ON THE MINOR'S ACCOUNT CAUSED, OR ALLEGED TO BE CAUSED, IN WHOLE OR IN PART BY THE NEGLIGENCE OF THE "RELEASEES" OR OTHERWISE, INCLUDING NEGLIGENT RESCUE OPERATIONS AND FURTHER AGREE THAT IF, DESPITE THIS RELEASE, I, THE MINOR, OR ANYONE ON THE MINOR'S BEHALF MAKES A CLAIMS AGAINST ANY OF THE RELEASEES NAMED ABOVE, I WILL INDEMNIFY, SAVE, AND HOLD HARMLESS EACH OF THE RELEASEES FROM ANY LITIGATION EXPENSES, ATTORNEY FEES, LOSS LIABILITY, DAMAGE, OR ANY COST THAT MAY OCCUR AS A RESULT OF ANY SUCH CLAIM.$waiver$
);

-- Adds the signature gate to enrollment. Everything else in this function is
-- carried forward unchanged from 20260731000004 (season window, co-guardian
-- check, USA card lookup, early-bird price lock-in).
--
-- The gate lives here rather than only in the UI for the same reason the card
-- check does: a disabled button is a courtesy, not a control. An unsigned
-- registration must be impossible to create, not merely hard to click.
CREATE OR REPLACE FUNCTION public.submit_season_enrollment(
  _season_registration_id UUID,
  _athlete_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller UUID := auth.uid();
  _owner UUID;
  _season public.season_registrations%ROWTYPE;
  _event public.club_events%ROWTYPE;
  _enrollment_id UUID;
  _dues_id UUID;
  _card_id UUID;
  _amount_cents INTEGER;
  _unsigned TEXT;
  _existing_status TEXT;
  _today DATE := (NOW() AT TIME ZONE 'America/Chicago')::DATE;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  SELECT * INTO _season
  FROM public.season_registrations
  WHERE id = _season_registration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Season registration not found';
  END IF;

  SELECT * INTO _event
  FROM public.club_events
  WHERE id = _season.event_id;

  IF NOT FOUND OR NOT _event.active THEN
    RAISE EXCEPTION 'Season registration is not active';
  END IF;

  IF _today < _season.registration_open_date THEN
    RAISE EXCEPTION 'Season registration has not opened yet';
  END IF;

  IF _today > _season.registration_close_date THEN
    RAISE EXCEPTION 'Season registration is closed';
  END IF;

  SELECT parent_id INTO _owner
  FROM public.athletes
  WHERE id = _athlete_id;

  IF _owner IS NULL OR NOT public.guards_athlete(_athlete_id) THEN
    RAISE EXCEPTION 'That wrestler is not on your family roster';
  END IF;

  -- Named in the error so the parent is told which agreement is outstanding
  -- rather than being sent back to hunt for it.
  SELECT d.title INTO _unsigned
  FROM public.disclosures d
  WHERE d.active
    AND d.required
    AND NOT EXISTS (
      SELECT 1
      FROM public.disclosure_acceptances a
      WHERE a.disclosure_id = d.id
        AND a.season_registration_id = _season_registration_id
        AND a.athlete_id = _athlete_id
    )
  ORDER BY d.title
  LIMIT 1;

  IF _unsigned IS NOT NULL THEN
    RAISE EXCEPTION 'Sign the % before registering this wrestler', _unsigned;
  END IF;

  IF _season.require_usa_card THEN
    -- Prefer a verified card, then the most recent upload. A returning family
    -- reuses the verified one; a replacement upload supersedes it because the
    -- documents flow deletes the row it replaces.
    SELECT id INTO _card_id
    FROM public.athlete_documents
    WHERE athlete_id = _athlete_id
      AND doc_type = 'usa_wrestling_card'
    ORDER BY verified DESC, uploaded_at DESC
    LIMIT 1;

    IF _card_id IS NULL THEN
      RAISE EXCEPTION 'Upload a USA Wrestling card before registering';
    END IF;
  END IF;

  SELECT id, status, dues_payment_id
  INTO _enrollment_id, _existing_status, _dues_id
  FROM public.season_enrollments
  WHERE season_registration_id = _season_registration_id
    AND athlete_id = _athlete_id
  FOR UPDATE;

  IF _existing_status = 'approved' THEN
    RAISE EXCEPTION 'This wrestler is already approved for the season';
  END IF;

  IF _enrollment_id IS NULL THEN
    INSERT INTO public.season_enrollments (
      season_registration_id,
      athlete_id,
      parent_id,
      dues_payment_id,
      usa_card_document_id,
      status,
      submitted_at,
      reviewed_by,
      reviewed_at,
      admin_note
    )
    VALUES (
      _season_registration_id,
      _athlete_id,
      _owner,
      NULL,
      _card_id,
      'submitted',
      NOW(),
      NULL,
      NULL,
      NULL
    )
    RETURNING id, dues_payment_id INTO _enrollment_id, _dues_id;
  ELSE
    UPDATE public.season_enrollments
    SET
      parent_id = _owner,
      usa_card_document_id = _card_id,
      status = 'submitted',
      submitted_at = NOW(),
      reviewed_by = NULL,
      reviewed_at = NULL,
      admin_note = NULL
    WHERE id = _enrollment_id;
  END IF;

  IF _dues_id IS NULL THEN
    IF _season.early_bird_price_cents IS NOT NULL AND _today <= _season.early_bird_deadline THEN
      _amount_cents := _season.early_bird_price_cents;
    ELSE
      _amount_cents := _season.dues_amount_cents;
    END IF;

    INSERT INTO public.dues_payments (
      parent_id,
      athlete_id,
      amount_cents,
      amount_paid_cents,
      season,
      status,
      due_date
    )
    VALUES (
      _owner,
      _athlete_id,
      _amount_cents,
      0,
      _season.season_label,
      CASE WHEN _amount_cents = 0 THEN 'paid' ELSE 'pending' END,
      _season.dues_due_date
    )
    RETURNING id INTO _dues_id;

    UPDATE public.season_enrollments
    SET dues_payment_id = _dues_id
    WHERE id = _enrollment_id;
  END IF;

  RETURN _enrollment_id;
END;
$$;
