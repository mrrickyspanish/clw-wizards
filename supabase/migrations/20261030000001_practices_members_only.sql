-- Practice times and days off are for club families and staff only (Ricky,
-- Oct 30): a public schedule says when groups of kids will be at a known
-- address. Signed-in users (parents, staff, admins) can read them; visitors
-- and the public API key cannot. Admin writes are unchanged.
DROP POLICY IF EXISTS "public_read_practices" ON public.practices;
CREATE POLICY "members_read_practices" ON public.practices
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "public_read_practice_cancellations" ON public.practice_cancellations;
CREATE POLICY "members_read_practice_cancellations" ON public.practice_cancellations
  FOR SELECT TO authenticated USING (true);
