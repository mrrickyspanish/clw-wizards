-- Split-session events and IKWF age divisions.
--
-- 1. Age division. A wrestler's IKWF division (Tot, Bantam, Intermediate,
--    Novice, Senior) comes from their birthday; see src/lib/age-division.ts.
--    athletes.age_division is an admin's override for a wrestler who wrestles
--    up. NULL means "from the birthday". Parents never set it.
--
-- 2. Event sessions. One event (a club tournament, a clinic) can run in two or
--    more sessions at different times, each for certain divisions. A wrestler
--    attends the session that lists their division.

ALTER TABLE public.athletes
  ADD COLUMN age_division TEXT
    CHECK (age_division IN ('tot', 'bantam', 'intermediate', 'novice', 'senior'));

-- Same rule as the birth-certificate fields: only staff tools (service role)
-- or an admin may set the override; a parent's insert or edit keeps it as it was.
CREATE OR REPLACE FUNCTION public.keep_age_division_admin_only()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.age_division := NULL;
  ELSE
    NEW.age_division := OLD.age_division;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER athletes_age_division_admin_only
  BEFORE INSERT OR UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.keep_age_division_admin_only();

CREATE TABLE public.event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.club_events(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,   -- 'HH:MM' 24-hour
  end_time TEXT,              -- 'HH:MM' 24-hour, optional
  age_divisions TEXT[] NOT NULL DEFAULT '{}'
    CHECK (age_divisions <@ ARRAY['tot', 'bantam', 'intermediate', 'novice', 'senior']::TEXT[]),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX event_sessions_event_id_idx ON public.event_sessions (event_id);

ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;

-- Readable wherever its event is (club events are public); admins manage them.
CREATE POLICY "public_read_event_sessions" ON public.event_sessions
  FOR SELECT USING (true);
CREATE POLICY "admin_write_event_sessions" ON public.event_sessions
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
