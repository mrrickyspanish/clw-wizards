-- One-off data fix, run by hand once, AFTER migration
-- 20261002000001_family_guardian_scoped_links.sql.
--
-- 2026-10-02-brody-shared-family.sql linked Karley Kilday into Jim
-- Connolly's whole family. This narrows that link to Brody alone, so a child
-- Jim adds later stays private, and locks it so neither parent can remove the
-- other from the portal. Staff change it by hand.

do $$
declare
  jim    uuid := '6e18b9da-935e-4925-8fab-97a2dc3be883';
  karley uuid := '58aab39f-404c-4b5e-ab36-4c82ea0c1612';
  brody  uuid := '2951e88a-3535-49b7-8826-582e704d551e';
  n int;
begin
  if not exists (select 1 from public.athletes where id = brody and parent_id = jim) then
    raise exception 'Brody is not on Jim''s account. Nothing changed.';
  end if;
  update public.family_guardians set athlete_ids = array[brody], locked = true
  where owner_id = jim and guardian_id = karley;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Expected Karley''s link to Jim''s family, found %. Nothing changed.', n; end if;
end $$;
