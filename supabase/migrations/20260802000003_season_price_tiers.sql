-- Replaces single-cutoff early-bird pricing with a real price ladder.
--
-- 20260731000004 assumed a season has exactly two prices: a discount window and
-- then full price. The club's actual 2026 registration flier lists four:
--
--   5/4 - 6/28   $275
--   6/29 - 7/30  $300
--   7/31 - 10/25 $325
--   10/26-12/31  $350
--
-- with everything paid in full by 11/1. A two-price model cannot express that,
-- so a family registering in August was quoted the wrong amount. Tiers are rows
-- now, and the club can run as many steps as it likes.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE public.season_price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_registration_id UUID NOT NULL REFERENCES public.season_registrations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_on >= starts_on)
);

-- A date can only ever resolve to one price. Without this, two overlapping
-- tiers would make the quoted amount depend on row order, and the SQL and the
-- TypeScript could disagree about which one wins.
ALTER TABLE public.season_price_tiers
  ADD CONSTRAINT season_price_tiers_no_overlap
  EXCLUDE USING gist (
    season_registration_id WITH =,
    daterange(starts_on, ends_on, '[]') WITH &&
  );

CREATE INDEX season_price_tiers_season_idx
  ON public.season_price_tiers(season_registration_id, starts_on);

ALTER TABLE public.season_price_tiers ENABLE ROW LEVEL SECURITY;

-- Public, like season_registrations became in 20260731000001: the marketing
-- pages show the ladder and the next price increase to signed-out visitors.
CREATE POLICY "public_read_season_price_tiers" ON public.season_price_tiers
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_manage_season_price_tiers" ON public.season_price_tiers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_season_price_tiers_updated_at
  BEFORE UPDATE ON public.season_price_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Carry any configured early-bird season across as two tiers, so existing
-- seasons price identically after this migration as before it.
INSERT INTO public.season_price_tiers (season_registration_id, label, starts_on, ends_on, amount_cents)
SELECT id, 'Early registration', registration_open_date, early_bird_deadline, early_bird_price_cents
FROM public.season_registrations
WHERE early_bird_price_cents IS NOT NULL;

INSERT INTO public.season_price_tiers (season_registration_id, label, starts_on, ends_on, amount_cents)
SELECT id, 'Regular registration', early_bird_deadline + 1, registration_close_date, dues_amount_cents
FROM public.season_registrations
WHERE early_bird_price_cents IS NOT NULL
  AND early_bird_deadline < registration_close_date;

ALTER TABLE public.season_registrations
  DROP COLUMN early_bird_price_cents,
  DROP COLUMN early_bird_deadline;

-- Seed the flier's published ladder onto the season it describes, if that
-- season exists and has no tiers of its own yet. Bounds are clamped to the
-- season's own window so this can never widen registration, and the whole
-- statement is a no-op when the club has not created the season row.
INSERT INTO public.season_price_tiers (season_registration_id, label, starts_on, ends_on, amount_cents)
SELECT
  s.id,
  t.label,
  GREATEST(t.starts_on, s.registration_open_date),
  LEAST(t.ends_on, s.registration_close_date),
  t.amount_cents
FROM public.season_registrations s
CROSS JOIN (
  VALUES
    ('Early registration',   DATE '2026-05-04', DATE '2026-06-28', 27500),
    ('Regular registration', DATE '2026-06-29', DATE '2026-07-30', 30000),
    ('Late registration',    DATE '2026-07-31', DATE '2026-10-25', 32500),
    ('Final registration',   DATE '2026-10-26', DATE '2026-12-31', 35000)
) AS t(label, starts_on, ends_on, amount_cents)
WHERE s.registration_open_date <= DATE '2026-12-31'
  AND s.registration_close_date >= DATE '2026-05-04'
  AND GREATEST(t.starts_on, s.registration_open_date) <= LEAST(t.ends_on, s.registration_close_date)
  AND NOT EXISTS (
    SELECT 1 FROM public.season_price_tiers p WHERE p.season_registration_id = s.id
  );

-- Swaps the early-bird branch for a tier lookup, and takes the season's
-- per-wrestler answers as arguments. Everything else is carried forward
-- unchanged from 20260802000001, including the disclosure gate.
--
-- The answers come through this function rather than a direct table write
-- because season_enrollments has no family UPDATE policy -- only admins can
-- write it, so a parent's update would silently affect zero rows. Passing them
-- here keeps the enrollment, its answers, and the dues record in one
-- transaction, which is why this function existed in the first place.
--
-- Price is still decided and locked in at first submission, not recomputed
-- later: the `IF _dues_id IS NULL` guard means a resubmission after
-- changes_requested never re-prices an existing dues row. "Register by the
-- deadline to lock in the price" therefore holds even if the family pays late.

-- Dropped rather than replaced: the argument list is changing, and leaving the
-- old two-argument version in place would make every existing call ambiguous.
DROP FUNCTION IF EXISTS public.submit_season_enrollment(UUID, UUID);

CREATE FUNCTION public.submit_season_enrollment(
  _season_registration_id UUID,
  _athlete_id UUID,
  _grade TEXT DEFAULT NULL,
  _school TEXT DEFAULT NULL,
  _weight_lbs NUMERIC DEFAULT NULL,
  _shirt_size TEXT DEFAULT NULL,
  _years_experience TEXT DEFAULT NULL,
  _season_commitments TEXT[] DEFAULT '{}'
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
      admin_note,
      grade,
      school,
      weight_lbs,
      shirt_size,
      years_experience,
      season_commitments
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
      NULL,
      _grade,
      _school,
      _weight_lbs,
      _shirt_size,
      _years_experience,
      COALESCE(_season_commitments, '{}')
    )
    RETURNING id, dues_payment_id INTO _enrollment_id, _dues_id;
  ELSE
    -- COALESCE so a caller that omits an answer leaves the stored one alone
    -- rather than blanking it.
    UPDATE public.season_enrollments
    SET
      parent_id = _owner,
      usa_card_document_id = _card_id,
      status = 'submitted',
      submitted_at = NOW(),
      reviewed_by = NULL,
      reviewed_at = NULL,
      admin_note = NULL,
      grade = COALESCE(_grade, grade),
      school = COALESCE(_school, school),
      weight_lbs = COALESCE(_weight_lbs, weight_lbs),
      shirt_size = COALESCE(_shirt_size, shirt_size),
      years_experience = COALESCE(_years_experience, years_experience),
      season_commitments = COALESCE(_season_commitments, season_commitments)
    WHERE id = _enrollment_id;
  END IF;

  IF _dues_id IS NULL THEN
    -- A season with no tiers configured prices at its flat dues_amount_cents,
    -- which is also what happens after the last tier's end date.
    SELECT amount_cents INTO _amount_cents
    FROM public.season_price_tiers
    WHERE season_registration_id = _season_registration_id
      AND _today >= starts_on
      AND _today <= ends_on
    LIMIT 1;

    IF _amount_cents IS NULL THEN
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

-- Re-granted because DROP FUNCTION took the old grant with it.
GRANT EXECUTE ON FUNCTION public.submit_season_enrollment(
  UUID, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT[]
) TO authenticated;
