-- Edit history for website content (Ricky, Nov 8). Every change to the
-- editable site text and photos (page_content), coaches and FAQs is copied
-- here with who made it and when, so a wiped headline or deleted FAQ can be
-- put back. Written only by the triggers below; admins can read it; nobody
-- can change or delete it from the site.

create table public.content_history (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_key text not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_row jsonb,
  new_row jsonb,
  changed_by uuid,
  changed_by_name text,
  changed_at timestamptz not null default now()
);
create index content_history_lookup on public.content_history (table_name, row_key, changed_at desc);

alter table public.content_history enable row level security;
revoke all on public.content_history from anon, authenticated;
grant select on public.content_history to authenticated;
create policy "admins_read_content_history" on public.content_history
  for select using (public.has_role(auth.uid(), 'admin'));

create or replace function public.log_content_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  old_j jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_j jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  who uuid := auth.uid();
begin
  -- A save that changes nothing but the timestamp is not an edit.
  if tg_op = 'UPDATE' and (old_j - 'updated_at') = (new_j - 'updated_at') then
    return new;
  end if;
  insert into public.content_history (table_name, row_key, action, old_row, new_row, changed_by, changed_by_name)
  values (
    tg_table_name,
    coalesce(new_j, old_j) ->> (case when tg_table_name = 'page_content' then 'key' else 'id' end),
    lower(tg_op), old_j, new_j, who,
    (select full_name from public.profiles where id = who)
  );
  return coalesce(new, old);
end;
$$;
revoke execute on function public.log_content_change() from public, anon, authenticated;

create trigger log_page_content_change after insert or update or delete on public.page_content
  for each row execute function public.log_content_change();
create trigger log_faq_change after insert or update or delete on public.faq_items
  for each row execute function public.log_content_change();
create trigger log_coach_change after insert or update or delete on public.coaches
  for each row execute function public.log_content_change();
