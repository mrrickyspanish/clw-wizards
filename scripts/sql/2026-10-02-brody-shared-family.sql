-- One-off data fix: let Karley Kilday manage Brody Connolly alongside Jim
-- RAN 2 Oct 2026 (this version). Narrowed to Brody only and locked by
-- 2026-10-02-brody-limit-and-lock.sql after the scoped-links migration.
-- Connolly. NOT a migration -- run by hand, once. One statement.
--
-- Karley joins the family on Jim's account (where Brody's registration and
-- dues are) as a co-guardian, and her duplicate Brody is removed.
-- What each sees: Karley sees Brody, his registration, dues, waiver and the
-- guardian contacts entered at registration -- not Jim's address or phone.
-- Jim sees nothing of Karley's account (Beckham stays private): the link only
-- runs from guardian into owner. Caveat: a child Jim adds to his account later
-- would be visible to Karley too. Aborts unless Brody is the only child on
-- Jim's account today.

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
  if (select count(*) from public.athletes where parent_id = jim) <> 1 then
    raise exception 'Jim''s account holds more than Brody, so Karley would see more than Brody. Nothing changed.';
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

  insert into public.family_guardians (owner_id, guardian_id) values (jim, karley)
  on conflict (owner_id, guardian_id) do nothing;
  delete from public.athletes where id = brody_copy;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Removed % copies of Brody, expected 1. Rolled back.', n; end if;
end $$;
