-- Parents could change their own role, admin_scope and is_active through the
-- "Users can update own profile" policy (found Nov 20, 2026; applied to the
-- live database the same day with RJ's approval). Only admins, or the service
-- role (no auth.uid()), may change them. Same pattern as
-- keep_is_coach_admin_only. Never raises: a non-admin's changes to these
-- columns are kept at their old values.
create or replace function public.keep_role_admin_only() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := 'parent';
    new.admin_scope := null;
  else
    new.role := old.role;
    new.admin_scope := old.admin_scope;
    new.is_active := old.is_active;
  end if;
  return new;
end $$;
revoke execute on function public.keep_role_admin_only() from public, anon, authenticated;
drop trigger if exists profiles_role_admin_only on public.profiles;
create trigger profiles_role_admin_only
  before insert or update of role, admin_scope, is_active on public.profiles
  for each row execute function public.keep_role_admin_only();
