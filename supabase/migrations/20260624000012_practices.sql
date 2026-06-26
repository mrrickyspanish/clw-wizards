-- Recurring weekly practice schedule. The parent dashboard's "next practice"
-- is computed from these rows (weekday + start_time) in Chicago time. Stored as
-- a weekly recurrence rather than individual sessions so admins set it once.
CREATE TABLE public.practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_group TEXT NOT NULL,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 = Sunday ... 6 = Saturday
  start_time TEXT NOT NULL, -- 'HH:MM' 24-hour
  end_time TEXT,            -- 'HH:MM' 24-hour, optional
  location TEXT NOT NULL,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;

-- Schedule is public (shown on the landing + portal); only admins manage it.
CREATE POLICY "public_read_practices" ON public.practices
  FOR SELECT USING (true);
CREATE POLICY "admin_write_practices" ON public.practices
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON public.practices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
