-- 1. Practice dates. A weekly practice can have a first and last day, so the
--    schedule can be entered ahead of the season without showing up before it
--    starts. Both are optional: no date means no limit.
--
-- 2. Board copy. The people who run the club but are not wrestling parents get
--    one email copy of every message sent through the site (admin-written
--    blasts and the automatic reminders). They are kept here so the list can be
--    changed from Admin -> Communications without a code change.

ALTER TABLE public.practices
  ADD COLUMN starts_on DATE,
  ADD COLUMN ends_on DATE,
  ADD CONSTRAINT practices_dates_in_order CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on);

CREATE TABLE public.board_copy_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (btrim(name) <> ''),
  email TEXT NOT NULL CHECK (position('@' IN email) > 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX board_copy_recipients_email_key ON public.board_copy_recipients (lower(email));

ALTER TABLE public.board_copy_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_board_copy_recipients" ON public.board_copy_recipients
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.board_copy_recipients (name, email) VALUES
  ('Tony Fontanetta', 'arfont37@sbcglobal.net'),
  ('Tyler Simmons', 'coachtyler@clwizards.com'),
  ('Steve Swierk', 'coachsteve@clwizards.com'),
  ('Sabrina Jimenez', 'sabrina@clwizards.com'),
  ('Jeremy Carbone', 'jcarbone739@gmail.com');
