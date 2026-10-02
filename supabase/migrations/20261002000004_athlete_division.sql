-- Boys or girls division for each wrestler, so the club can point girls to
-- girls' tournaments and order the right singlet and merch cuts. Asked when a
-- wrestler is added and on the season registration form; admins can set or
-- correct it. Existing wrestlers start blank until a parent or admin fills it.
ALTER TABLE public.athletes
  ADD COLUMN division TEXT CHECK (division IN ('boys', 'girls'));
