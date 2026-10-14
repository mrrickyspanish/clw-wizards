# Wizards request playbooks

Replace every `<…>` before running. Ids come from a lookup query, never from
memory.

## Form add

1. Download the sheet "2026-2027 Wizards" (Drive id
   `19Vj-uIgOojnu4hFauLxiCfmTFtDV3urzwHBbVmPgcVA`) with `download_file_content`,
   export `text/csv`. Decode the base64 `content` into the **scratchpad** (never
   the repo).
2. Look each kid up on the site first: first name + date of birth, last name, and
   the parent emails on the form. A family that re-submits under another last
   name or email is the common case. If the kid is on already, either set
   `athlete_id` on the record (to register an unregistered wrestler) or skip them
   and fix the existing record instead.
3. Build and dry-run:
   ```
   python3 -I .claude/skills/wizards-request/scripts/form_to_records.py <form.csv> <records.json> "First Last" ...
   python3 -I .claude/skills/wizards-request/scripts/import_sql.py <records.json> <dry.sql> dry
   ```
   Run `dry.sql`. It must end with `DRYRUN ok: …` and the counts you expect.
4. Build with `commit` and run it. Then check each kid: parent account, 2
   guardians where the form had 2, 1 waiver, pending dues at the season amount,
   registration `submitted`.
5. Reply: who was added, registration and dues status, plus anything odd you
   found (duplicates, conflicting contact info).

## Co-parent

For parents who share kids but not a household. The other parent gets their own
login linked to just those kids. The link is locked: neither parent can remove
it, and registration, wrestler details and emergency contacts stay with the
owning account or the club. Both parents can see, pay, upload and sign.

```sql
do $$
declare
  acct text := lower('<new parent email>');
  owner uuid := '<profile id of the account that owns the kids>';
  kids uuid[] := array['<athlete id>', '<athlete id>']::uuid[];
  newp uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where lower(email) = acct) then raise exception 'Account already exists. Nothing changed.'; end if;
  if (select count(*) from public.athletes where id = any(kids) and parent_id = owner) <> cardinality(kids) then
    raise exception 'Kids not found on that account. Nothing changed.';
  end if;
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, email_change_token_current, reauthentication_token,
    phone_change, phone_change_token, is_sso_user, is_anonymous)
  values (newp, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', acct, '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', '<Full Name>'),
    now(), now(), '', '', '', '', '', '', '', '', false, false);
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), newp::text, newp,
    jsonb_build_object('sub', newp::text, 'email', acct, 'email_verified', false, 'phone_verified', false),
    'email', now(), now(), now());
  -- onboarding_completed_at: skip the "add your wrestler" setup, as an invite redemption does.
  update public.profiles set full_name = '<Full Name>', first_name = '<First>', last_name = '<Last>',
    onboarding_completed_at = now()
  where id = newp and role = 'parent';
  if not found then raise exception 'Profile was not created as a parent. Nothing changed.'; end if;
  insert into public.family_guardians (owner_id, guardian_id, athlete_ids, locked) values (owner, newp, kids, true);
  insert into data_fix_backups.form_import_20261007 (kind, id, note) values ('account', newp, acct || ' (co-parent, locked link)');
end $$;
```

Verify as the new parent (SKILL.md step 4): they should see only those kids. Reply
with the login steps: clwizards.com/login → "Set or reset password" → their
email.

## Mark paid (only after Ricky says yes)

Offline payments (check, cash, Venmo). Use the full amount unless told
otherwise.

```sql
update public.dues_payments
set amount_paid_cents = amount_cents, status = 'paid', updated_at = now()
where id = '<dues id>' and status in ('pending', 'overdue') and amount_paid_cents = 0
returning id, amount_cents, status;
```

Tony can do the same himself: Admin → Dues → search the name → Edit dues →
Recorded paid.

## Name or contact fix

```sql
update public.athletes set last_name = '<New>' where id = '<athlete id>' and last_name = '<Old>' returning id, first_name, last_name;
update public.athlete_guardians set email = '<email>', phone = '<10 digits>'
where athlete_id = '<athlete id>' and ordinal = <1|2> and name = '<Guardian Name>' returning name, email, phone;
```

When two forms disagree, show both versions side by side and ask which one is
right before changing anything.

## "I paid" check

```sql
select d.id, d.amount_cents, d.amount_paid_cents, d.status, d.stripe_checkout_session_id, d.updated_at
from public.dues_payments d join public.athletes a on a.id = d.athlete_id
where a.last_name ilike '<last>%' and a.first_name ilike '<first>%';
```

A null `stripe_checkout_session_id` means no online checkout was ever started.
Also check `donations` for the parent's name or email, in case they paid on the
wrong page.
