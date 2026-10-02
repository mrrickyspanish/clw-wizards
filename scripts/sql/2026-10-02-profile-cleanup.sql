-- One-off data fix: tidy parent profiles. NOT a migration -- run by hand, once.
--
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> paste this whole file -> Run.
-- One statement: applies completely or not at all, and aborts unless it
-- changes exactly what the reviewed dry run (2 Oct 2026) found:
--   15 names   stray/double spaces removed; all-lowercase words capitalised
--              ("Riley halter" -> "Riley Halter"). Mixed-case words untouched.
--              first_name/last_name follow automatically (split trigger).
--   19 cities  explicit spellings: Crystal Lake, Cary, McHenry, Palatine,
--              Village of Lakewood. Not auto-capitalised -- McHenry stays right.
--   26 phones  reformatted to the plain 10 digits most families already have.
--              Two numbers too short to be real (6 and 9 digits) are left alone.
-- The previous values are copied to data_fix_backups.profiles_cleanup_20261002
-- first. That schema is not exposed by the site's API.

do $$
declare n_names int; n_cities int; n_phones int;
begin
  create temp table pc_names on commit drop as
    select id, full_name as before,
      (select string_agg(case when w = lower(w) then upper(left(w, 1)) || substr(w, 2) else w end, ' ' order by ord)
         from unnest(regexp_split_to_array(btrim(regexp_replace(full_name, '\s+', ' ', 'g')), ' ')) with ordinality as t(w, ord)) as after
    from public.profiles where full_name is not null and btrim(full_name) <> '';
  delete from pc_names where after is not distinct from before;

  create temp table pc_cities on commit drop as
    select id, city as before,
      case lower(btrim(city))
        when 'crystal lake' then 'Crystal Lake' when 'cary' then 'Cary' when 'mchenry' then 'McHenry'
        when 'palatine' then 'Palatine' when 'village of lakewood' then 'Village of Lakewood'
      end as after
    from public.profiles where city is not null;
  delete from pc_cities where after is null or after = before;

  create temp table pc_phones on commit drop as
    select id, phone as before,
      case when length(d) = 10 then d when length(d) = 11 and left(d, 1) = '1' then substr(d, 2) end as after
    from (select id, phone, regexp_replace(phone, '\D', '', 'g') as d from public.profiles where phone is not null and btrim(phone) <> '') x;
  delete from pc_phones where after is null or after = before;

  if (select count(*) from pc_names) <> 15 or (select count(*) from pc_cities) <> 19 or (select count(*) from pc_phones) <> 26 then
    raise exception 'Plan no longer matches the reviewed dry run (names %, cities %, phones %; expected 15, 19, 26). Nothing changed.',
      (select count(*) from pc_names), (select count(*) from pc_cities), (select count(*) from pc_phones);
  end if;

  create schema if not exists data_fix_backups;
  create table data_fix_backups.profiles_cleanup_20261002 as
    select p.id, p.full_name, p.first_name, p.last_name, p.city, p.phone, now() as backed_up_at
    from public.profiles p
    where p.id in (select id from pc_names union select id from pc_cities union select id from pc_phones);
  revoke all on all tables in schema data_fix_backups from anon, authenticated;

  update public.profiles p set full_name = n.after from pc_names n where p.id = n.id and p.full_name = n.before;
  get diagnostics n_names = row_count;
  update public.profiles p set city = c.after from pc_cities c where p.id = c.id and p.city = c.before;
  get diagnostics n_cities = row_count;
  update public.profiles p set phone = f.after from pc_phones f where p.id = f.id and p.phone = f.before;
  get diagnostics n_phones = row_count;

  if n_names <> 15 or n_cities <> 19 or n_phones <> 26 then
    raise exception 'Updated names %, cities %, phones % (expected 15, 19, 26). Rolled back.', n_names, n_cities, n_phones;
  end if;
end $$;
