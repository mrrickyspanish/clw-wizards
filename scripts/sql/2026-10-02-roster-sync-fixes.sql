-- One-off data fix, approved 2 Oct 2026, from the roster comparison against
-- the club's registration list. NOT a migration -- run by hand, once.
--
--  1. Andrew Schier and Kendall Knoth back on. Today's duplicate merges kept
--     the record holding each one's registration, but that record had been
--     switched off earlier, so neither shows on the family's Registration page.
--  2. Two more duplicate children, missed because of a nickname and an
--     apostrophe: TreLyn Morrow (copy of Tre'Lyn) and Ceci Nieves (copy of
--     Cecilia). The copies hold nothing.
--  3. The "Greyson Test" wrestler, with its registration, dues and documents.
--     The login it sits on is left alone. Refuses if any money was paid.
--
-- Backs up first; aborts, changing nothing, unless every record is exactly
-- where the review found it.

do $$
declare
  andrew      uuid := 'ba370fee-bc98-40d8-a6aa-df63f15a92d1';
  kendall     uuid := '95ec051d-09e5-4a3e-994a-3acc137caa88';
  trelyn_copy uuid := '13d4ebb2-3842-4516-90f4-ab6e553e9068';
  ceci_copy   uuid := '002227ff-282f-4817-86fe-8f0dba766b0c';
  greyson     uuid := '4ec58a68-300a-4816-b383-d71640d11a74';
  copies uuid[];
  n int;
begin
  copies := array[trelyn_copy, ceci_copy];

  if (select count(*) from public.athletes where id in (andrew, kendall) and not active) <> 2 then
    raise exception 'Andrew and Kendall are not both switched off any more. Nothing changed.';
  end if;
  if (select count(*) from public.athletes where id = any(copies)) <> 2
     or exists (select 1 from public.season_enrollments where athlete_id = any(copies))
     or exists (select 1 from public.dues_payments where athlete_id = any(copies))
     or exists (select 1 from public.athlete_documents where athlete_id = any(copies))
     or exists (select 1 from public.disclosure_acceptances where athlete_id = any(copies))
     or exists (select 1 from public.athlete_guardians where athlete_id = any(copies))
     or exists (select 1 from public.tournament_registrations where athlete_id = any(copies)) then
    raise exception 'A duplicate copy is gone or now holds records. Nothing changed.';
  end if;
  if not exists (select 1 from public.athletes where id = greyson and last_name = 'Test') then
    raise exception 'The Greyson Test record is not where the review found it. Nothing changed.';
  end if;
  if exists (select 1 from public.dues_payments where athlete_id = greyson and (amount_paid_cents > 0 or status in ('paid', 'partial'))) then
    raise exception 'Money was paid on the Greyson Test dues. Nothing changed.';
  end if;

  create schema if not exists data_fix_backups;
  create table data_fix_backups.roster_sync_athletes_20261002 as
    select * from public.athletes where id = any(copies || array[andrew, kendall, greyson]);
  create table data_fix_backups.roster_sync_greyson_enrollments_20261002 as
    select * from public.season_enrollments where athlete_id = greyson;
  create table data_fix_backups.roster_sync_greyson_dues_20261002 as
    select * from public.dues_payments where athlete_id = greyson;
  create table data_fix_backups.roster_sync_greyson_docs_20261002 as
    select * from public.athlete_documents where athlete_id = greyson;
  revoke all on all tables in schema data_fix_backups from anon, authenticated;

  update public.athletes set active = true where id in (andrew, kendall);
  get diagnostics n = row_count;
  if n <> 2 then raise exception 'Switched on % wrestlers, expected 2. Rolled back.', n; end if;

  delete from public.athletes where id = any(copies);
  get diagnostics n = row_count;
  if n <> 2 then raise exception 'Removed % duplicates, expected 2. Rolled back.', n; end if;

  delete from public.season_enrollments where athlete_id = greyson;
  delete from public.dues_payments where athlete_id = greyson;
  delete from public.athletes where id = greyson;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'Removed % test wrestlers, expected 1. Rolled back.', n; end if;
end $$;
