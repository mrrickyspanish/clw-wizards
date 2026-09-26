-- Private incident/outbox storage. No parent can read addresses or diagnostics.
create table public.parent_auth_incidents (
  id uuid primary key,
  created_at timestamptz not null default now(),
  email text,
  email_source text,
  first_email text,
  first_email_source text,
  first_step text check (first_step in ('confirmation_link','reset_link','password_save','family_setup')),
  first_error jsonb,
  first_seen timestamptz,
  latest_step text,
  latest_error jsonb,
  last_seen timestamptz,
  occurrences integer not null default 0,
  source_key text,
  notified_at timestamptz,
  message_id text,
  lease_until timestamptz
);
alter table public.parent_auth_incidents enable row level security;
revoke all on public.parent_auth_incidents from public, anon, authenticated;
grant select, insert, update, delete on public.parent_auth_incidents to service_role;
create index parent_auth_incidents_source on public.parent_auth_incidents (source_key, first_seen);
create index parent_auth_incidents_pending on public.parent_auth_incidents (first_seen) where notified_at is null;

create function public.record_parent_auth_failure(
  p_id uuid, p_step text, p_error jsonb, p_email text, p_email_source text, p_source_key text
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_step not in ('confirmation_link','reset_link','password_save','family_setup')
     or octet_length(p_error::text) > 2000 or length(p_email) > 254 then
    raise exception 'Invalid incident';
  end if;
  -- Serialize per source so parallel requests cannot bypass the admission cap.
  perform pg_advisory_xact_lock(hashtextextended(p_source_key, 0));
  if p_source_key <> 'server'
     and not exists (select 1 from public.parent_auth_incidents where id=p_id and first_seen is not null)
     and (select count(*) from public.parent_auth_incidents where source_key=p_source_key and first_seen > now()-interval '10 minutes') >= 20 then
    return false;
  end if;
  insert into public.parent_auth_incidents as i
    (id,email,email_source,first_email,first_email_source,first_step,first_error,first_seen,latest_step,latest_error,last_seen,occurrences,source_key)
  values (p_id,p_email,p_email_source,p_email,p_email_source,p_step,p_error,now(),p_step,p_error,now(),1,p_source_key)
  on conflict (id) do update set
    first_email = case when i.first_seen is null then coalesce(i.email,p_email) else i.first_email end,
    first_email_source = case when i.first_seen is null then coalesce(i.email_source,p_email_source) else i.first_email_source end,
    first_step = coalesce(i.first_step,p_step), first_error = coalesce(i.first_error,p_error),
    first_seen = coalesce(i.first_seen,now()), source_key = coalesce(i.source_key,p_source_key),
    email = coalesce(i.email,p_email), email_source = coalesce(i.email_source,p_email_source),
    latest_step=p_step, latest_error=p_error, last_seen=now(), occurrences=i.occurrences+1;
  return true;
end;
$$;

create function public.claim_parent_auth_incident(p_id uuid)
returns setof public.parent_auth_incidents language sql security invoker set search_path = '' as $$
  update public.parent_auth_incidents set lease_until=now()+interval '60 seconds'
  where id=p_id and notified_at is null and first_seen > now()-interval '23 hours'
    and (lease_until is null or lease_until < now())
  returning *;
$$;
revoke all on function public.record_parent_auth_failure(uuid,text,jsonb,text,text,text) from public, anon, authenticated;
revoke all on function public.claim_parent_auth_incident(uuid) from public, anon, authenticated;
grant execute on function public.record_parent_auth_failure(uuid,text,jsonb,text,text,text) to service_role;
grant execute on function public.claim_parent_auth_incident(uuid) to service_role;
