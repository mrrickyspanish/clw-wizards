-- One-off data fix: merge the duplicate athlete records created by family setup
-- before commit 8325412 stopped it. NOT a migration -- run by hand, once.
--
-- Family setup used to make every imported family re-enter its children, and a
-- retry inserted the whole list again. Each child kept a real record (the one
-- holding registration and dues) plus one or more copies with neither.
--
-- Reviewed dry run, 2 Oct 2026: 25 copies across 21 children in 18 families.
--   23 merge automatically. The kept record is the one holding dues, then
--      registration, then tournament entries, then documents, and only then
--      the oldest -- for one child the OLDER record is the copy, so "keep the
--      oldest" would have deleted a $300 dues row.
--    2 are left alone: the birth dates disagree and a person has to decide.
--   No copy holds a registration, dues, tournament entry or document. Every
--   waiver signature and guardian row on a copy already exists on the kept
--   record; they are carried over anyway in case that changes.
--
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> paste this whole file -> Run.
-- It is ONE statement (a DO block), so it either applies completely or not at
-- all, and it aborts -- changing nothing -- unless it finds exactly the 23
-- reviewed copies and leaves exactly the 2 birth-date conflicts behind.
--
-- Before deleting anything it copies the removed rows, the kept rows as they
-- were, and the copies' waiver and guardian rows into the data_fix_backups
-- schema, which the site's API does not expose. Drop that schema once the
-- merge has been checked:  drop schema data_fix_backups cascade;

do $$
declare planned int; deleted int; remaining int;
begin
  create temp table dup_plan on commit drop as
  with grp as (
    select parent_id, lower(trim(first_name)) fk, lower(trim(last_name)) lk
    from public.athletes group by 1, 2, 3 having count(*) > 1
  ), members as (
    select a.*, g.fk, g.lk,
      exists (select 1 from public.dues_payments d where d.athlete_id = a.id) has_dues,
      exists (select 1 from public.season_enrollments e where e.athlete_id = a.id) has_reg,
      exists (select 1 from public.tournament_registrations t where t.athlete_id = a.id) has_tourn,
      exists (select 1 from public.athlete_documents doc where doc.athlete_id = a.id) has_docs
    from public.athletes a
    join grp g on g.parent_id = a.parent_id and g.fk = lower(trim(a.first_name)) and g.lk = lower(trim(a.last_name))
  ), ranked as (
    select m.*, row_number() over w rn, first_value(m.id) over w keep_id
    from members m
    window w as (partition by m.parent_id, m.fk, m.lk
                 order by m.has_dues desc, m.has_reg desc, m.has_tourn desc, m.has_docs desc, m.created_at, m.id)
  )
  select c.id as copy_id, c.keep_id
  from ranked c join ranked k on k.id = c.keep_id
  where c.rn > 1
    and not (c.has_dues or c.has_reg or c.has_tourn or c.has_docs)
    and c.date_of_birth is not distinct from k.date_of_birth;

  select count(*) into planned from dup_plan;
  if planned <> 23 then
    raise exception 'Expected 23 copies (reviewed dry run), found %. Nothing changed.', planned;
  end if;

  -- Backup first, in a schema the API does not expose.
  create schema if not exists data_fix_backups;
  create table data_fix_backups.athletes_dedupe_20261002 as
    select 'copy (removed)'::text as backup_role, a.* from public.athletes a join dup_plan p on p.copy_id = a.id
    union all
    select 'kept (before fill)', a.* from public.athletes a where a.id in (select distinct keep_id from dup_plan);
  create table data_fix_backups.disclosure_acceptances_dedupe_20261002 as
    select x.* from public.disclosure_acceptances x join dup_plan p on p.copy_id = x.athlete_id;
  create table data_fix_backups.athlete_guardians_dedupe_20261002 as
    select g.* from public.athlete_guardians g join dup_plan p on p.copy_id = g.athlete_id;
  revoke all on all tables in schema data_fix_backups from anon, authenticated;

  -- 1. Fill blanks on the kept record; never overwrite, never touch practice_group.
  update public.athletes k set
    weight_class              = coalesce(k.weight_class, src.weight_class),
    shirt_size                = coalesce(k.shirt_size, src.shirt_size),
    usa_wrestling_card_number = coalesce(k.usa_wrestling_card_number, src.card_number),
    usa_wrestling_card_url    = coalesce(k.usa_wrestling_card_url, src.card_url),
    birth_certificate_url     = coalesce(k.birth_certificate_url, src.birth_cert_url),
    referral_source           = coalesce(k.referral_source, src.referral_source)
  from (
    select p.keep_id,
      (array_agg(a.weight_class order by a.created_at desc) filter (where a.weight_class is not null))[1] weight_class,
      (array_agg(a.shirt_size order by a.created_at desc) filter (where a.shirt_size is not null))[1] shirt_size,
      (array_agg(a.usa_wrestling_card_number order by a.created_at desc) filter (where a.usa_wrestling_card_number is not null))[1] card_number,
      (array_agg(a.usa_wrestling_card_url order by a.created_at desc) filter (where a.usa_wrestling_card_url is not null))[1] card_url,
      (array_agg(a.birth_certificate_url order by a.created_at desc) filter (where a.birth_certificate_url is not null))[1] birth_cert_url,
      (array_agg(a.referral_source order by a.created_at desc) filter (where a.referral_source is not null))[1] referral_source
    from dup_plan p join public.athletes a on a.id = p.copy_id
    group by p.keep_id
  ) src
  where k.id = src.keep_id;

  -- 2. Carry over any waiver signature or guardian row the kept record lacks.
  insert into public.disclosure_acceptances
    (disclosure_id, season_registration_id, athlete_id, accepted_by, accepted_at, typed_signature, ip_address, user_agent, created_at)
  select x.disclosure_id, x.season_registration_id, p.keep_id, x.accepted_by, x.accepted_at, x.typed_signature, x.ip_address, x.user_agent, x.created_at
  from dup_plan p join public.disclosure_acceptances x on x.athlete_id = p.copy_id
  on conflict (disclosure_id, season_registration_id, athlete_id) do nothing;

  insert into public.athlete_guardians
    (athlete_id, ordinal, name, relationship, phone, email, coach_interest, created_at, updated_at)
  select p.keep_id, g.ordinal, g.name, g.relationship, g.phone, g.email, g.coach_interest, g.created_at, g.updated_at
  from dup_plan p join public.athlete_guardians g on g.athlete_id = p.copy_id
  on conflict (athlete_id, ordinal) do nothing;

  -- 3. Remove the copies, re-checked so nothing holding records is touched.
  delete from public.athletes a using dup_plan p
  where a.id = p.copy_id
    and not exists (select 1 from public.dues_payments d where d.athlete_id = a.id)
    and not exists (select 1 from public.season_enrollments e where e.athlete_id = a.id)
    and not exists (select 1 from public.tournament_registrations t where t.athlete_id = a.id)
    and not exists (select 1 from public.athlete_documents doc where doc.athlete_id = a.id);
  get diagnostics deleted = row_count;
  if deleted <> 23 then
    raise exception 'Would have removed % copies, expected 23. Rolled back.', deleted;
  end if;

  -- 4. Only the two birth-date conflicts may remain.
  select count(*) into remaining
  from (select 1 from public.athletes group by parent_id, lower(trim(first_name)), lower(trim(last_name)) having count(*) > 1) d;
  if remaining <> 2 then
    raise exception 'Expected 2 duplicate groups left, found %. Rolled back.', remaining;
  end if;
end $$;
