-- Parent login alerts close the loop (Ricky, Nov 2): when a parent who was
-- stuck later logs in, a "Resolved" email follows the alert. resolved_at is
-- when they got in was noticed (set with the first email when they got in
-- before the alert's timer was up); resolved_message_id is the follow-up email.
alter table public.parent_auth_incidents
  add column resolved_at timestamptz,
  add column resolved_message_id text;
create index parent_auth_incidents_open on public.parent_auth_incidents (first_seen)
  where notified_at is not null and resolved_at is null;
