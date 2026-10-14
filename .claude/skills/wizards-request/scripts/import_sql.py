"""Build the form-import SQL from records made by form_to_records.py.

    python3 -I import_sql.py <records.json> <out.sql> dry      # run this first
    python3 -I import_sql.py <records.json> <out.sql> commit

One DO block: creates any missing parent login (confirmed, no password: the
family uses "Set or reset password"), the wrestler, guardians, the waiver with
the form's own signer and time, a pending dues row at the season's amount, and a
submitted registration. Every new id goes to data_fix_backups.form_import_20261007.
Counts are checked at the end; anything unexpected aborts with "Nothing changed".

To register a wrestler who is already on the site, set "athlete_id" on their
record before building.
"""
import json, sys

SEASON = '6bbe3a94-a1ac-425f-8de3-2cd8ffe82cb8'
DISCLOSURE = '254226dd-c82c-4cd9-9206-7d8351cfe16d'

recs = json.load(open(sys.argv[1]))
out, mode = sys.argv[2], sys.argv[3]
assert mode in ('dry', 'commit'), 'mode is dry or commit'
data = json.dumps(recs, separators=(',', ':'), ensure_ascii=False)
assert '$json$' not in data
expect_new = sum(1 for r in recs if not r.get('athlete_id'))
expect_existing = len(recs) - expect_new
finish = (
    "raise exception 'DRYRUN ok: existing %, new kids %, new accounts %, registered %, registrations now %', "
    "existing_kids, new_kids, new_accounts, enrolled, (select count(*) from public.season_enrollments where season_registration_id = season);"
    if mode == 'dry' else "raise notice 'Done: % registered, % new accounts', enrolled, new_accounts;"
)

sql = f"""do $$
declare
  season uuid := '{SEASON}';
  disclosure uuid := '{DISCLOSURE}';
  dues_cents int; due date; season_name text;
  recs jsonb := $json${data}$json$::jsonb;
  r jsonb; g jsonb;
  parent uuid; kid uuid; dues_id uuid; enr_id uuid; acct text;
  new_accounts int := 0; new_kids int := 0; existing_kids int := 0; enrolled int := 0;
begin
  select dues_amount_cents, dues_due_date, season_label into dues_cents, due, season_name
    from public.season_registrations where id = season;
  if dues_cents is null then raise exception 'Season not found. Nothing changed.'; end if;

  for r in select * from jsonb_array_elements(recs) loop
    acct := lower(r->>'account_email');
    if r->>'athlete_id' is not null then
      kid := (r->>'athlete_id')::uuid;
      select parent_id into parent from public.athletes where id = kid;
      if parent is null then raise exception 'Wrestler % % is no longer on the site. Nothing changed.', r->>'first', r->>'last'; end if;
      existing_kids := existing_kids + 1;
    else
      if exists (select 1 from public.athletes a where lower(a.first_name) = lower(r->>'first')
                 and a.date_of_birth = (r->>'dob')::date) then
        raise exception '% % (born %) may already be on the site. Check, then set athlete_id. Nothing changed.', r->>'first', r->>'last', r->>'dob';
      end if;
      select id into parent from auth.users where lower(email) = acct;
      if parent is null then
        parent := gen_random_uuid();
        insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
          email_change_token_new, email_change, email_change_token_current, reauthentication_token,
          phone_change, phone_change_token, is_sso_user, is_anonymous)
        values (parent, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', acct, '', now(),
          '{{"provider":"email","providers":["email"]}}'::jsonb, jsonb_build_object('full_name', r->>'parent_name'),
          now(), now(), '', '', '', '', '', '', '', '', false, false);
        insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        values (gen_random_uuid(), parent::text, parent,
          jsonb_build_object('sub', parent::text, 'email', acct, 'email_verified', false, 'phone_verified', false),
          'email', now(), now(), now());
        insert into data_fix_backups.form_import_20261007 (kind, id, note) values ('account', parent, acct);
        new_accounts := new_accounts + 1;
      end if;
      update public.profiles set
        full_name = coalesce(nullif(full_name, email), r->>'parent_name'),
        phone = coalesce(phone, r->>'phone'),
        street_address = coalesce(street_address, r->>'street'),
        city = coalesce(city, r->>'city'),
        state = coalesce(state, 'IL')
      where id = parent;
      insert into public.athletes (parent_id, first_name, last_name, date_of_birth, referral_source, shirt_size, weight_class, active)
      values (parent, r->>'first', r->>'last', (r->>'dob')::date, r->>'referral', r->>'shirt', r->>'weight', true)
      returning id into kid;
      insert into data_fix_backups.form_import_20261007 (kind, id, note) values ('athlete', kid, (r->>'first') || ' ' || (r->>'last'));
      new_kids := new_kids + 1;
    end if;

    if exists (select 1 from public.season_enrollments where athlete_id = kid and season_registration_id = season) then
      raise exception '% % is already registered this season. Nothing changed.', r->>'first', r->>'last';
    end if;

    for g in select * from jsonb_array_elements(r->'guardians') loop
      insert into public.athlete_guardians (athlete_id, ordinal, name, relationship, phone, email, coach_interest)
      values (kid, (g->>'ordinal')::int, g->>'name', g->>'relationship', g->>'phone', g->>'email', g->>'coach')
      on conflict (athlete_id, ordinal) do nothing;
    end loop;

    -- The waiver they agreed to on the Google Form, with the form's own time and signer.
    insert into public.disclosure_acceptances (disclosure_id, season_registration_id, athlete_id, accepted_by, accepted_at, typed_signature, ip_address, user_agent)
    values (disclosure, season, kid, parent, (r->>'signed_at')::timestamptz, r->>'signature', null, null)
    on conflict (disclosure_id, season_registration_id, athlete_id) do nothing;

    insert into public.dues_payments (parent_id, athlete_id, amount_cents, amount_paid_cents, season, status, due_date)
    values (parent, kid, dues_cents, 0, season_name, 'pending', due)
    returning id into dues_id;
    insert into public.season_enrollments (season_registration_id, athlete_id, parent_id, dues_payment_id, status, submitted_at,
      grade, school, weight_lbs, shirt_size, years_experience, season_commitment)
    values (season, kid, parent, dues_id, 'submitted', (r->>'signed_at')::timestamptz,
      r->>'grade', r->>'school', (r->>'weight')::numeric, r->>'shirt', r->>'years', r->>'commitment')
    returning id into enr_id;
    insert into data_fix_backups.form_import_20261007 (kind, id, note)
      values ('dues', dues_id, null), ('enrollment', enr_id, (r->>'first') || ' ' || (r->>'last'));
    enrolled := enrolled + 1;
  end loop;

  if existing_kids <> {expect_existing} or new_kids <> {expect_new} or enrolled <> {len(recs)} then
    raise exception 'Counts were off (existing %, new kids %, registered %). Nothing changed.', existing_kids, new_kids, enrolled;
  end if;
  {finish}
end $$;"""
open(out, 'w').write(sql)
print(f'{mode}: {len(recs)} records ({expect_new} new, {expect_existing} existing) -> {out}')
