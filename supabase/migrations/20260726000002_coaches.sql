-- Editable coach & board roster for the public Coaches page. Two sections:
--   * 'board'    — leadership/main contacts (name + role/title)
--   * 'practice' — practice-room coaches, each assigned to a practice_group
-- Seeded with the roster currently hard-coded on /coaches, so the page renders
-- identically until someone edits it. Website content = full-admin only.

CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL CHECK (section IN ('board', 'practice')),
  practice_group TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_coaches" ON public.coaches
  FOR SELECT USING (active = true);

CREATE POLICY "full_admin_write_coaches" ON public.coaches
  FOR ALL USING (public.is_full_admin(auth.uid()))
  WITH CHECK (public.is_full_admin(auth.uid()));

CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.coaches (name, role, section, practice_group, sort_order) VALUES
  ('Tony Fontanetta', 'President, Head Coach & Club Coordinator', 'board', NULL, 1),
  ('Sabrina Jimenez', 'Secretary-Treasurer, Singlets, Pictures & Payments', 'board', NULL, 2),
  ('Steve Swierk', 'Vice President of Operations & Tournaments', 'board', NULL, 3),
  ('Jeramy Carbone', 'Vice President, Tournaments, Stats & Facilities', 'board', NULL, 4),
  ('Tyler Simmons', 'Board Member', 'board', NULL, 5),
  ('Julie Swierk', 'Board Assistant & Hotel Blocks', 'board', NULL, 6),
  ('Alex Flores', '', 'practice', 'Group 1', 1),
  ('Ryan Schweikhofer', '', 'practice', 'Group 1', 2),
  ('Tyler Simmons', '', 'practice', 'Group 2', 3),
  ('Matt Fiodirosa', '', 'practice', 'Group 2', 4),
  ('Jeramy Carbone', '', 'practice', 'Group 3', 5),
  ('Anthony Fontanetta', '', 'practice', 'Group 3', 6),
  ('Anthony Fontanetta', '', 'practice', 'Group 4', 7),
  ('Steve Swierk', '', 'practice', 'Group 4', 8);
