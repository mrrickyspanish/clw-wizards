-- Who's registered for each tournament, from TrackWrestling (Tyler, Nov 13).
-- An admin pastes the tournament's TrackWrestling Wrestler List; the site keeps
-- our club's rows here, matched to our wrestlers where it can. The site never
-- fetches TrackWrestling itself. Admins only: families don't see this table.

create table public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete set null,
  external_name text not null,
  division text,
  weight text,
  grade text,
  paid boolean not null default false,
  submitted text,
  source text not null default 'trackwrestling' check (source in ('trackwrestling')),
  imported_at timestamptz not null default now(),
  imported_by uuid references public.profiles(id) on delete set null
);
create index tournament_entries_tournament on public.tournament_entries (tournament_id);
create index tournament_entries_athlete on public.tournament_entries (athlete_id);

alter table public.tournament_entries enable row level security;
create policy "admins_manage_tournament_entries" on public.tournament_entries
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Replaces a tournament's pasted list in one step, so a failed save never
-- leaves half the old list and half the new one.
create or replace function public.replace_tournament_entries(p_tournament uuid, p_entries jsonb)
returns integer language plpgsql security invoker set search_path = public as $$
declare n integer;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Admins only';
  end if;
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) > 500 then
    raise exception 'Bad list';
  end if;
  delete from public.tournament_entries where tournament_id = p_tournament and source = 'trackwrestling';
  insert into public.tournament_entries (tournament_id, athlete_id, external_name, division, weight, grade, paid, submitted, imported_by)
  select p_tournament, nullif(e->>'athlete_id', '')::uuid, left(e->>'external_name', 200), left(e->>'division', 60),
    left(e->>'weight', 20), left(e->>'grade', 20), coalesce((e->>'paid')::boolean, false), left(e->>'submitted', 40), auth.uid()
  from jsonb_array_elements(p_entries) e
  where coalesce(e->>'external_name', '') <> '';
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.replace_tournament_entries(uuid, jsonb) from public, anon;
grant execute on function public.replace_tournament_entries(uuid, jsonb) to authenticated;
