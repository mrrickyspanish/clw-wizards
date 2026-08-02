-- The fields the club's registration form has always collected but this
-- platform never did. See docs/annual-registration-form.md for the source.
--
-- Split by lifetime, which is the whole design decision here:
--
--   profiles           -- durable household facts (mailing address)
--   athletes           -- durable wrestler facts (how the family found us)
--   season_enrollments -- anything a family must re-confirm each year
--
-- Grade, school, weight, shirt size and experience all change annually. Putting
-- them on athletes would mean a returning family's stale answers silently ride
-- along into a new season; on the enrollment they get asked again, and last
-- year's answer stays readable as history.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Asked once, when a family first joins -- not re-asked every season.
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS referral_source TEXT;

ALTER TABLE public.season_enrollments
  ADD COLUMN IF NOT EXISTS grade TEXT,
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC(5,1) CHECK (weight_lbs IS NULL OR weight_lbs > 0),
  ADD COLUMN IF NOT EXISTS shirt_size TEXT,
  ADD COLUMN IF NOT EXISTS years_experience TEXT,
  -- Which competition path the wrestler is committing to this year. A
  -- single-select on the form: the four choices are mutually exclusive, so this
  -- is one value rather than a set.
  ADD COLUMN IF NOT EXISTS season_commitment TEXT;

-- Guardian contact records. Deliberately NOT family_guardians, which is the
-- portal-login relationship created by invite codes: a guardian on this table
-- is an emergency/contact record for a wrestler and may never hold an account,
-- while a family_guardians row is an account with no contact detail of its own.
CREATE TABLE public.athlete_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  -- 1 is the primary guardian and is required at the form layer; 2 is optional.
  -- The Google Form marks both required, which locks out single-guardian
  -- households -- see docs/annual-registration-form.md.
  ordinal SMALLINT NOT NULL CHECK (ordinal IN (1, 2)),
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  coach_interest TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (athlete_id, ordinal)
);

CREATE INDEX athlete_guardians_athlete_idx ON public.athlete_guardians(athlete_id);

ALTER TABLE public.athlete_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_manage_athlete_guardians" ON public.athlete_guardians
  FOR ALL TO authenticated
  USING (public.guards_athlete(athlete_id))
  WITH CHECK (public.guards_athlete(athlete_id));

CREATE POLICY "staff_read_athlete_guardians" ON public.athlete_guardians
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "admin_manage_athlete_guardians" ON public.athlete_guardians
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_athlete_guardians_updated_at
  BEFORE UPDATE ON public.athlete_guardians
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
