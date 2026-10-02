-- One-off data fix, approved 2 Oct 2026. NOT a migration -- run by hand, once.
-- HOW TO RUN: Supabase SQL Editor -> paste -> Run. One statement: all or nothing.
--
--  1. Christian Saldarriaga: his iCloud login (the one he uses) joins the family
--     on his Gmail account, where Rowan's and Zayden's registrations and dues
--     are; the two duplicate boys on the iCloud account are removed.
--  2. Andrew Schier: birthday 4/6/2015 on the record with his registration and
--     dues (import had 2026); weight and shirt carried over from the copy,
--     practice group left for staff; copy removed.
--  3. Aaron Garcia: birthday 11/13/2012, as Hector typed; his card number
--     carried over; copy removed.
--  5. Peter Kasper: duplicate removed and the old pwkasper@yahoo.com login
--     deleted -- he uses his work email.
--  6. TJ Simmons: real record, registration and dues moved from Tyler's admin
--     login (which cannot use the parent portal) to tylesim@cdw.com; that
--     account's duplicate removed.
--
-- Backs up every touched row into data_fix_backups first, and aborts --
-- changing nothing -- if any record is not exactly where the review found it.

do $$
declare
  christian_gmail  uuid := '13b87f6a-5b3f-46d0-90eb-52bfe815b6a1';
  christian_icloud uuid := 'f063564c-157d-4474-888d-c85104569732';
  rowan_copy  uuid := '724208ac-0018-456e-abeb-ce3e8ae12227';
  zayden_copy uuid := 'acca4304-8bd7-4869-a618-5abca991cf83';
  andrew_keep uuid := 'ba370fee-bc98-40d8-a6aa-df63f15a92d1';
  andrew_copy uuid := '7218d7ec-8bf5-4e5a-92ec-a46df46936a2';
  aaron_keep  uuid := 'fe601e01-8fc0-400a-855e-59d4339511f1';
  aaron_copy  uuid := 'd8c9d53d-28f8-4e4c-98cd-5de8df2e158e';
  peter_yahoo uuid := '9deae860-24ea-4438-8ae6-46d965c6721e';
  peter_copy  uuid := '2f8a1483-317c-491b-972b-1810eea64fde';
  tyler_admin uuid := '9d782d8e-d080-4e0e-8a51-e37c6abdf468';
  tyler_cdw   uuid := '5aa88a8f-9956-4260-9eab-1f1c5c1c1236';
  tj_real     uuid := '7f8808e9-2776-4885-8413-6a45aa399086';
  tj_copy     uuid := 'c5a5696a-92f3-47c0-b7ae-432b986208d5';
  copies uuid[];
  n int;
begin
  copies := array[rowan_copy, zayden_copy, andrew_copy, aaron_copy, peter_copy, tj_copy];

  -- Pre-checks.
  select count(*) into n from public.athletes where id = any(copies);
  if n <> 6 then raise exception 'Expected 6 duplicate records, found %. Nothing changed.', n; end if;
  if exists (select 1 from public.season_enrollments where athlete_id = any(copies))
     or exists (select 1 from public.dues_payments where athlete_id = any(copies))
     or exists (select 1 from public.tournament_registrations where athlete_id = any(copies))
     or exists (select 1 from public.athlete_documents where athlete_id = any(copies)) then
    raise exception 'A duplicate now holds a registration, dues, tournament entry or document. Nothing changed.';
  end if;
  if not exists (select 1 from public.athletes where id = tj_real and parent_id = tyler_admin)
     or not exists (select 1 from public.athletes where id = andrew_keep)
     or not exists (select 1 from public.athletes where id = aaron_keep) then
    raise exception 'A real record is not where the review found it. Nothing changed.';
  end if;
  if exists (select 1 from public.disclosure_acceptances where accepted_by = peter_yahoo)
     or exists (select 1 from public.dues_payments where parent_id = peter_yahoo or waived_by = peter_yahoo)
     or exists (select 1 from public.season_enrollments where parent_id = peter_yahoo)
     or exists (select 1 from public.athletes where parent_id = peter_yahoo and id <> peter_copy) then
    raise exception 'Peter''s Yahoo account now holds other records. Nothing changed.';
  end if;

  -- Backup.
  create schema if not exists data_fix_backups;
  create table data_fix_backups.account_fixes_athletes_20261002 as
    select * from public.athletes where id = any(copies || array[andrew_keep, aaron_keep, tj_real]);
  create table data_fix_backups.account_fixes_profile_20261002 as select * from public.profiles where id = peter_yahoo;
  create table data_fix_backups.account_fixes_tj_billing_20261002 as
    select 'dues'::text as kind, id, parent_id from public.dues_payments where athlete_id = tj_real
    union all select 'enrollment', id, parent_id from public.season_enrollments where athlete_id = tj_real;
  create table data_fix_backups.account_fixes_waivers_20261002 as select * from public.disclosure_acceptances where athlete_id = any(copies);
  create table data_fix_backups.account_fixes_guardians_20261002 as select * from public.athlete_guardians where athlete_id = any(copies);
  revoke all on all tables in schema data_fix_backups from anon, authenticated;

  -- 1. Christian.
  insert into public.family_guardians (owner_id, guardian_id) values (christian_gmail, christian_icloud)
  on conflict (owner_id, guardian_id) do nothing;

  -- 2. Andrew.
  update public.athletes k set date_of_birth = '2015-04-06',
    weight_class = coalesce(k.weight_class, c.weight_class),
    shirt_size = coalesce(k.shirt_size, c.shirt_size),
    usa_wrestling_card_number = coalesce(k.usa_wrestling_card_number, c.usa_wrestling_card_number)
  from public.athletes c where k.id = andrew_keep and c.id = andrew_copy;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Andrew update touched % rows. Rolled back.', n; end if;

  -- 3. Aaron.
  update public.athletes k set date_of_birth = '2012-11-13',
    usa_wrestling_card_number = coalesce(k.usa_wrestling_card_number, c.usa_wrestling_card_number)
  from public.athletes c where k.id = aaron_keep and c.id = aaron_copy;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Aaron update touched % rows. Rolled back.', n; end if;

  -- Carry over any waiver or guardian row on Andrew's or Aaron's copy that the real record lacks.
  insert into public.disclosure_acceptances
    (disclosure_id, season_registration_id, athlete_id, accepted_by, accepted_at, typed_signature, ip_address, user_agent, created_at)
  select x.disclosure_id, x.season_registration_id, case x.athlete_id when andrew_copy then andrew_keep else aaron_keep end,
    x.accepted_by, x.accepted_at, x.typed_signature, x.ip_address, x.user_agent, x.created_at
  from public.disclosure_acceptances x where x.athlete_id in (andrew_copy, aaron_copy)
  on conflict (disclosure_id, season_registration_id, athlete_id) do nothing;
  insert into public.athlete_guardians
    (athlete_id, ordinal, name, relationship, phone, email, coach_interest, created_at, updated_at)
  select case g.athlete_id when andrew_copy then andrew_keep else aaron_keep end,
    g.ordinal, g.name, g.relationship, g.phone, g.email, g.coach_interest, g.created_at, g.updated_at
  from public.athlete_guardians g where g.athlete_id in (andrew_copy, aaron_copy)
  on conflict (athlete_id, ordinal) do nothing;

  -- 6. TJ.
  update public.athletes set parent_id = tyler_cdw where id = tj_real and parent_id = tyler_admin;
  update public.dues_payments set parent_id = tyler_cdw where athlete_id = tj_real and parent_id = tyler_admin;
  update public.season_enrollments set parent_id = tyler_cdw where athlete_id = tj_real and parent_id = tyler_admin;
  update public.tournament_registrations set parent_id = tyler_cdw where athlete_id = tj_real and parent_id = tyler_admin;
  update public.athlete_documents set parent_id = tyler_cdw where athlete_id = tj_real and parent_id = tyler_admin;

  -- Remove the six duplicates.
  delete from public.athletes where id = any(copies);
  get diagnostics n = row_count;
  if n <> 6 then raise exception 'Removed % duplicates, expected 6. Rolled back.', n; end if;

  -- 5. Peter: the Yahoo login, profile first.
  delete from public.profiles where id = peter_yahoo;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Peter''s Yahoo profile: % rows. Rolled back.', n; end if;
  delete from auth.users where id = peter_yahoo;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Peter''s Yahoo login: % rows. Rolled back.', n; end if;

  -- Post-checks.
  if exists (select 1 from public.athletes group by parent_id, lower(trim(first_name)), lower(trim(last_name)) having count(*) > 1) then
    raise exception 'A duplicate child remains inside a family. Rolled back.';
  end if;
  if (select count(*) from public.dues_payments where athlete_id = tj_real and parent_id = tyler_cdw) <> 1
     or (select count(*) from public.season_enrollments where athlete_id = tj_real and parent_id = tyler_cdw) <> 1 then
    raise exception 'TJ''s registration or dues did not move. Rolled back.';
  end if;
end $$;
