-- Annual wrestler registration is configured from a special club event, but
-- stored separately from ordinary events because it carries enrollment, dues,
-- document-review, and approval state.

ALTER TABLE public.club_events
  DROP CONSTRAINT IF EXISTS club_events_event_type_check;

ALTER TABLE public.club_events
  ADD CONSTRAINT club_events_event_type_check
  CHECK (event_type IN (
    'event',
    'banquet',
    'parent_night',
    'fundraiser',
    'meeting',
    'season_registration',
    'other'
  ));

CREATE TABLE public.season_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES public.club_events(id) ON DELETE RESTRICT,
  season_label TEXT NOT NULL,
  registration_open_date DATE NOT NULL,
  registration_close_date DATE NOT NULL,
  dues_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (dues_amount_cents >= 0),
  dues_due_date DATE,
  instructions TEXT,
  require_usa_card BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (registration_close_date >= registration_open_date)
);

CREATE TABLE public.season_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_registration_id UUID NOT NULL REFERENCES public.season_registrations(id) ON DELETE RESTRICT,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dues_payment_id UUID UNIQUE REFERENCES public.dues_payments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'changes_requested', 'approved', 'withdrawn')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (season_registration_id, athlete_id)
);

CREATE INDEX season_enrollments_parent_idx ON public.season_enrollments(parent_id);
CREATE INDEX season_enrollments_status_idx ON public.season_enrollments(status);

ALTER TABLE public.season_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_season_registrations" ON public.season_registrations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_season_registrations" ON public.season_registrations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "family_read_season_enrollments" ON public.season_enrollments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR public.guards_athlete(athlete_id)
  );

CREATE POLICY "admin_manage_season_enrollments" ON public.season_enrollments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_season_registrations_updated_at
  BEFORE UPDATE ON public.season_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_season_enrollments_updated_at
  BEFORE UPDATE ON public.season_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Parents submit through this function rather than direct table writes. It keeps
-- annual enrollment and the matching dues record atomic, validates the season
-- window, and works for both primary parents and linked co-guardians.
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

  INSERT INTO public.season_enrollments (
    season_registration_id,
    athlete_id,
    parent_id,
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
    'submitted',
    NOW(),
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (season_registration_id, athlete_id)
  DO UPDATE SET
    status = 'submitted',
    submitted_at = NOW(),
    reviewed_by = NULL,
    reviewed_at = NULL,
    admin_note = NULL
  RETURNING id, dues_payment_id INTO _enrollment_id, _dues_id;

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

CREATE OR REPLACE FUNCTION public.withdraw_season_enrollment(_enrollment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _athlete_id UUID;
BEGIN
  SELECT athlete_id INTO _athlete_id
  FROM public.season_enrollments
  WHERE id = _enrollment_id;

  IF _athlete_id IS NULL OR NOT public.guards_athlete(_athlete_id) THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;

  UPDATE public.season_enrollments
  SET status = 'withdrawn', submitted_at = NOW()
  WHERE id = _enrollment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_season_enrollment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_season_enrollment(UUID) TO authenticated;
