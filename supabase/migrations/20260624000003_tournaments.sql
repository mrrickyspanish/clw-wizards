CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'IL',
  external_registration_url TEXT,
  external_platform TEXT CHECK (external_platform IN ('trackwrestling', 'flowrestling', 'internal', 'other')),
  weigh_in_time TEXT,
  weigh_in_date DATE,
  start_time TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  practice_groups TEXT[] NOT NULL DEFAULT '{}', -- eligible groups; empty = all
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_tournaments" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "admin_write_tournaments" ON public.tournaments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
