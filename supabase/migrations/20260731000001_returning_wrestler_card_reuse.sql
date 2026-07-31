-- Returning wrestlers keep the card the club already verified.
--
-- The previous rule required a USA Wrestling card uploaded on or after
-- registration_open_date, which forced every returning family to re-upload a
-- document the club had already reviewed. That also disagreed with the parent
-- UI, which enabled Submit whenever any card was on file -- so a returning
-- family could click Submit and hit a hard error from this function.
--
-- New rule: any card on file satisfies submission. Eligibility is still gated,
-- just at the right point -- approval already requires athlete_documents.verified,
-- so a brand new upload lands unverified and holds the wrestler out of practice
-- until an admin reviews it, while a returning wrestler whose card was verified
-- in a prior season passes straight through.
--
-- A wrestler with no card at all is still blocked at submission.

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
      _season.dues_amount_cents,
      0,
      _season.season_label,
      CASE WHEN _season.dues_amount_cents = 0 THEN 'paid' ELSE 'pending' END,
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


-- Let signed-out visitors read the season window.
--
-- season_registrations was readable only by authenticated users, so the public
-- "Register for the Season" callout on /join -- aimed squarely at families who
-- do not have an account yet -- would have found nothing and rendered blank.
--
-- Everything on this table is public-facing registration info already printed
-- on the marketing site: the season label, the open and close dates, the dues
-- amount, and whether a card is required. Enrollments stay family-scoped and
-- are untouched here.

DROP POLICY IF EXISTS "authenticated_read_season_registrations" ON public.season_registrations;

CREATE POLICY "public_read_season_registrations" ON public.season_registrations
  FOR SELECT USING (true);
