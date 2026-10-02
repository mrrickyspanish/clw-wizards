-- One-off data fix: let Karley Kilday manage Brody Connolly alongside Jim
-- Connolly. NOT a migration -- run by hand, once, AFTER migration
-- 20261002000001_family_guardian_scoped_links.sql. One statement.
--
-- Karley becomes a co-guardian for Brody only, on Jim's account (where Brody's
-- registration and dues are), and her duplicate Brody is removed.
--   - Both parents see Brody, his registration, dues, documents and waiver.
--   - Karley sees no other child Jim has or adds later, and none of Jim's
--     family-level records. Jim sees nothing of Karley's account.
--   - The link is locked: neither parent can remove it from the portal.
--     Staff change it by hand (update or delete the family_guardians row).

do $$
declare
  jim        uuid := '6e18b9da-935e-4925-8fab-97a2dc3be883';
  karley     uuid := '58aab39f-404c-4b5e-ab36-4c82ea0c1612';
  brody_real uuid := '2951e88a-3535-49b7-8826-582e704d551e';
  brody_copy uuid := '2c649ed8-78c0-4652-be81-f3ebd5e60228';
  n int;
begin
  if not exists (select 1 from public.athletes where id = brody_real and parent_id = jim)
     or not exists (select 1 from public.athletes where id = brody_copy and parent_id = karley) then
    raise exception 'Brody''s records are not where the review found them. Nothing changed.';
  end if;
  if exists (select 1 from public.family_guardians where owner_id = jim and guardian_id = karley) then
    raise exception 'Karley is already linked to Jim''s family. Nothing changed.';
  end if;
  if exists (select 1 from public.season_enrollments where athlete_id = brody_copy)
     or exists (select 1 from public.dues_payments where athlete_id = brody_copy)
     or exists (select 1 from public.tournament_registrations where athlete_id = brody_copy)
     or exists (select 1 from public.athlete_documents where athlete_id = brody_copy)
     or exists (select 1 from public.disclosure_acceptances where athlete_id = brody_copy)
     or exists (select 1 from public.athlete_guardians where athlete_id = brody_copy) then
    raise exception 'Karley''s copy of Brody now holds records. Nothing changed.';
  end if;

  create schema if not exists data_fix_backups;
  create table data_fix_backups.brody_copy_20261002 as select * from public.athletes where id = brody_copy;
  revoke all on all tables in schema data_fix_backups from anon, authenticated;

  insert into public.family_guardians (owner_id, guardian_id, athlete_ids, locked)
  values (jim, karley, array[brody_real], true);
  delete from public.athletes where id = brody_copy;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Removed % copies of Brody, expected 1. Rolled back.', n; end if;
end $$;
