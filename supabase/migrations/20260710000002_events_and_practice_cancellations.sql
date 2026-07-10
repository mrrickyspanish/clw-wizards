-- One-off dated club events (banquet, parent night, fundraiser, meeting…) that
-- live alongside the recurring weekly practices. Weigh-ins are NOT here — they
-- derive from a tournament's weigh-in fields.
CREATE TABLE public.club_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'event'
    CHECK (event_type IN ('event', 'banquet', 'parent_night', 'fundraiser', 'meeting', 'other')),
  date DATE NOT NULL,
  start_time TEXT,            -- 'HH:MM' 24-hour, optional
  end_time TEXT,             -- 'HH:MM' 24-hour, optional
  location TEXT,
  notes TEXT,
  practice_group TEXT,        -- NULL = club-wide / all groups
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_club_events" ON public.club_events
  FOR SELECT USING (true);
CREATE POLICY "admin_write_club_events" ON public.club_events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_club_events_updated_at BEFORE UPDATE ON public.club_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Single-date exceptions to the recurring practice schedule (e.g. a group's
-- Monday practice is cancelled the week it falls on Christmas). One row per
-- cancelled occurrence; the "next practice" logic skips these dates.
CREATE TABLE public.practice_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (practice_id, date)
);
ALTER TABLE public.practice_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_practice_cancellations" ON public.practice_cancellations
  FOR SELECT USING (true);
CREATE POLICY "admin_write_practice_cancellations" ON public.practice_cancellations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
