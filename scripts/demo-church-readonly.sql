-- Church demo read-only guard (RJ, Nov 17). For the Homefield Demo database
-- ONLY (project qokgompkyqyjasidmwnr). Never run this on the club's database.
-- It is deliberately not a migration, so `supabase db push` can't carry it.
--
-- The church demo's three accounts (@sbc-demo.example) sign in with one click
-- and must not change anything, even by calling the database directly with
-- their session. The app refuses their changes too (src/lib/demo-readonly.ts);
-- this is the database's half. The demo's own reset runs as the service role,
-- which carries no email, so it is unaffected; so are the Mohegan Valley
-- demo's accounts.

-- 1. Every table in public: no insert, update or delete by a church account,
--    including through stored routines that skip row-level security.
create or replace function public.demo_church_read_only() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') like '%@sbc-demo.example' then
    raise exception 'Read-only demo: changes are not saved.' using errcode = '42501';
  end if;
  return null;
end $$;

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop trigger if exists demo_church_read_only on public.%I', t.tablename);
    execute format(
      'create trigger demo_church_read_only before insert or update or delete on public.%I for each statement execute function public.demo_church_read_only()',
      t.tablename
    );
  end loop;
end $$;

-- 2. Storage: no uploads, replacements or deletes by a church account.
drop policy if exists demo_church_no_upload on storage.objects;
drop policy if exists demo_church_no_replace on storage.objects;
drop policy if exists demo_church_no_delete on storage.objects;
create policy demo_church_no_upload on storage.objects as restrictive for insert to authenticated
  with check (coalesce(auth.jwt() ->> 'email', '') not like '%@sbc-demo.example');
create policy demo_church_no_replace on storage.objects as restrictive for update to authenticated
  using (coalesce(auth.jwt() ->> 'email', '') not like '%@sbc-demo.example');
create policy demo_church_no_delete on storage.objects as restrictive for delete to authenticated
  using (coalesce(auth.jwt() ->> 'email', '') not like '%@sbc-demo.example');

-- 3. Logins: a church account's email and password can't be changed, so a
--    visitor can't lock the next visitor out of the one-click entry.
create or replace function public.demo_church_lock_login() returns trigger
language plpgsql as $$
begin
  if old.email like '%@sbc-demo.example'
     and (new.email is distinct from old.email or new.encrypted_password is distinct from old.encrypted_password) then
    raise exception 'Read-only demo: changes are not saved.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists demo_church_lock_login on auth.users;
create trigger demo_church_lock_login before update on auth.users
  for each row execute function public.demo_church_lock_login();
