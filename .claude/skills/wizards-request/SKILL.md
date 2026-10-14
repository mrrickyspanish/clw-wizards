---
name: wizards-request
description: Handle a CLW Wizards club request end to end. Use whenever Ricky pastes or screenshots a message from Tony (Anthony Fontanetta), Tyler, Sabrina, a parent, or a vendor (Resend, Twilio, Stripe) about the clwizards.com site — Google Form adds, "I paid but it says I didn't", co-parent access, name or contact fixes, deletes, USA card list questions, failed emails, vendor notices, or a bug Tony found. Looks up the live record first, acts within the rules below, verifies as the family would see it, logs it to Admin → Requests, and drafts the reply.
---

# Wizards request

Ricky pastes a request. Work it through these five steps every time. Write for
"wrestling guys": short, plain, no jargon.

## 1. Read it, name it

Say in one line who is asking and what kind of request it is (table below). If a
screenshot is cut off, work from what is visible and say what is missing.

## 2. Look before acting

Query the live database before saying anything about a family. Never answer from
memory or from the request alone: the parent's story and the record often differ
(Jameson "Mozal" was already on as Jameson Coulman; Lauren Lancer's "paid" had no
payment behind it).

- Supabase project `nerrrzuocgaohrzurnny` (`execute_sql`; DDL via `apply_migration`).
- Current season `6bbe3a94-a1ac-425f-8de3-2cd8ffe82cb8`, waiver (disclosure)
  `254226dd-c82c-4cd9-9206-7d8351cfe16d`. Read the dues amount from
  `season_registrations`; never hard-code it.
- Search by last name AND first name AND date of birth AND parent email. Families
  re-submit under a different last name or email.

## 3. Act — just do it, or ask first

| Just do it | Ask Ricky first |
|---|---|
| Google Form adds | Marking dues paid or partly paid |
| Name, birth date, contact, guardian fixes | Waiving dues, refunds, changing amounts |
| Co-parent access (locked link) | Permanent deletes of a family or wrestler* |
| Re-sending an email that failed | Any email or text to families |
| Logging the request | Anything that changes how the site works (code) |

\* If Tony explicitly says to delete, that is the go-ahead: delete, don't ask Tony
again.

Safety on every data change: dry run first (`raise exception 'DRYRUN …'`), count
guards so a surprise aborts with "Nothing changed", backup rows in
`data_fix_backups.*`, and conditional `where` clauses (`... and last_name = 'Old'`)
so a stale id cannot hit the wrong row. Templates: [playbooks.md](playbooks.md).

Code changes: work on the session branch, run `npx tsc --noEmit`, `npm run lint`
and `npm run test:auth`, commit, and push to `main` only when Ricky says
**"ship it"**. Then confirm the Vercel production deploy is READY.

## 4. Verify as the family sees it

After a change, check it the way the person will experience it, e.g. query as the
parent under RLS inside a rolled-back transaction:

```sql
begin;
select set_config('request.jwt.claims', json_build_object('sub', '<profile id>', 'role', 'authenticated')::text, true);
set local role authenticated;
select first_name, last_name from athletes;  -- what they can see
rollback;
```

## 5. Log it, then reply

**Log** every request in `public.request_log` (shows in Admin → Requests, which
Tony reads):

```sql
insert into public.request_log (received_at, from_name, title, outcome, status, waiting_on, people)
values ('<when it was sent, America/Chicago offset>', 'Tony', '<what was asked, one line>',
  '<what was done, plain words Tony understands>', 'done' | 'waiting' | 'open',
  '<if waiting: "Name: next step">', '{<families and wrestlers involved>}');
```

When a waiting item resolves later, `update` that row (status, outcome,
`updated_at = now()`) rather than adding a new one.

**Reply** — draft it, Ricky sends it:

- Very short. Lead with the answer. No headers or bullets unless listing names.
- Never take a position of authority over Tony or the board. Ask, don't instruct:
  "Was it paid offline? Let me know and I can flip the switch and have it updated."
- Don't hand work back to them that we can do ourselves.
- Signature:
  - Drafted for Ricky to send: sign **Ricky**.
  - Sent as site support (automatic or on Ricky's behalf): sign
    **Creative Eye Multimedia — Website support for the CLW Wizards**.

## Request types

| Type | What to do |
|---|---|
| Google Form add | Pull the sheet "2026-2027 Wizards" (Drive id `19Vj-uIgOojnu4hFauLxiCfmTFtDV3urzwHBbVmPgcVA`) as CSV, find the rows, check each kid isn't already on the site (name, DOB, parent email), then run the form import. [playbooks.md#form-add](playbooks.md#form-add) |
| "I paid" | Look at `dues_payments` for the wrestler. No `stripe_checkout_session_id` means no online payment was ever started. Reply asking whether it was paid offline; mark paid only after a yes. |
| Co-parent access | Parents who share kids but not a household: new account + locked `family_guardians` link limited to those kids. [playbooks.md#co-parent](playbooks.md#co-parent) |
| Name / contact fix | Conditional update; mention any conflict found between two forms and ask which is right. |
| Delete | If Tony said delete, delete (Admin → Families → Delete permanently records it in the Removed tab). |
| USA card questions | Missing-card list counts an uploaded card OR a card number on file. Registrations shows the bound card, else the newest card since the season opened. |
| Failed emails | `communication_log` (status, subject, sent_at). Check whether a later send covered the same families before re-sending. |
| Vendor notice (Resend, Twilio, Stripe) | Find the root cause on our side first (e.g. Twilio 30508 was the public SMS Terms example showing a checked box). Console steps go to Ricky; never ask for or handle vendor passwords or API keys in chat. |
| Bug / edge case from Tony | Reproduce against real data, fix, add a test, wait for "ship it". |

## Never

- Log into Ricky's or anyone's admin account, or ask for a password.
- Decrypt Vercel environment values, or repeat secrets that show up in tool output.
- Put parent names, emails or form data in the repo. Working files go in the
  scratchpad; the repo gets only placeholder templates.
- Email USA Wrestling card numbers.
- Put model names in commits.
