-- Renumber practice groups: retire the color levels (Black/Gold/White) in favor
-- of numbered groups (Group 1-4), matching the public site. The vocabulary is
-- defined in code (ORG.practiceGroups); this migration only remaps EXISTING rows
-- so stored assignments stay valid against the new selectors/validation.
--
-- On a fresh database (no color-assigned rows) this is a no-op.
--
-- MAPPING — the three old colors spread naturally across the low end of the
-- four-level progression, in order (edit any line to match how your coaches
-- actually place wrestlers):
--   White  -> Group 1   (new / youngest, learning fundamentals)
--   Gold   -> Group 2   (developing competitors)
--   Black  -> Group 3   (competing regularly at a higher level)
-- Group 4 is the aspirational top of the progression (college-level goals) and
-- had no color equivalent, so coaches promote wrestlers into it deliberately.
-- Only the three known color values are touched; any other value is left as-is.

do $$
declare
  tbl text;
begin
  foreach tbl in array array['profiles', 'athletes', 'practices'] loop
    execute format($f$
      update public.%I
         set practice_group = case practice_group
               when 'White' then 'Group 1'
               when 'Gold'  then 'Group 2'
               when 'Black' then 'Group 3'
               else practice_group
             end
       where practice_group in ('White', 'Gold', 'Black')
    $f$, tbl);
  end loop;
end $$;
