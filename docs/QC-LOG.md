# CLW Platform — QC Log

A running checklist of what's been built and exactly how to verify each piece.
Organized by what you can test **now** (on a Vercel preview against the dev
Supabase project) vs. what's **blocked on credentials** (the access checklist).

> **Credential reality check:** the app itself runs on the existing dev
> Supabase project + Vercel previews, so most UI/logic QC can happen now.
> What's blocked is *outbound email delivery* (needs the Resend domain verified
> via DNS) and *live payments* (needs the club's Stripe account). Those are
> called out per-item below.

---

## Section 1 — Onboarding redesign (signup → confirm → complete profile)

**What was built:** Signup now only asks name / email / password. Phone, SMS
consent, and the athlete roster moved to a new `/onboarding` step that a parent
is forced through (by middleware) before they can reach any portal page.

**Prerequisite:** run the new migration on the Supabase project first —
`supabase/migrations/20260624000011_profiles_onboarding.sql` (adds the
`onboarding_completed_at` column). Without it, the portal will error.

**QC — testable now:**
- [ ] Sign up with a fresh email → form only shows name/email/password.
- [ ] (Email delivery blocked — see note) Confirm the account, then sign in.
- [ ] After sign-in you land on `/onboarding`, NOT the dashboard.
- [ ] Try to manually visit `/dashboard` before finishing → you're bounced
      back to `/onboarding`.
- [ ] Fill phone + SMS consent + one athlete, "Save & continue" → lands on
      dashboard; athlete shows under "My Athletes"; phone saved.
- [ ] Add a second athlete with "+ Add another athlete" before saving → both
      persist.
- [ ] "Skip for now" → goes to dashboard and does NOT prompt onboarding again
      on next login.
- [ ] Re-open `/onboarding` manually after completing → you're allowed to the
      dashboard normally (flag is set, no re-loop).

**Blocked on credentials:**
- Account-confirmation email delivery is capped until the Resend sending
  domain is verified (DNS). Workaround for QC: confirm the user manually in the
  Supabase dashboard (Authentication → Users → confirm), then sign in.

---

## Section 2 — Admin email comms (`/admin/communications`)

**What was built:** A compose-and-send panel wired to the live
`/api/comms/blast` endpoint. Pick an audience, preview the recipient count,
write subject + message, send. Email-only (SMS is a fast-follow).

**QC — testable now:**
- [ ] As an admin, open Communications → the compose form renders.
- [ ] Audience dropdown switches sub-fields: "practice group" shows a group
      picker; "tournament registrants" shows a tournament picker.
- [ ] "Preview recipients" returns a count + sample names for each audience
      (All / practice group / tournament / outstanding dues).
- [ ] Sending with an empty subject or message is blocked with a clear error.
- [ ] A valid send returns "queued and sending now" and clears the form.
- [ ] As a non-admin (parent), the blast endpoint refuses (403) — confirms the
      gate. (Parents can't reach the page via the nav anyway.)

**Blocked on credentials:**
- Actual email **delivery** to parents is capped until the Resend domain is
  verified. The send will *queue* (via QStash) and *attempt* now, but inboxes
  won't reliably receive until DNS is done.
- To exercise the queue end-to-end you also need QStash env vars set on the
  preview/prod environment.

---

## Section 3 — Admin dues view (`/admin/dues`)

**What was built:** A read-only overview — summary cards (Collected /
Outstanding / Total billed) plus a table of every dues record (family,
athlete, season, amount, paid, due date, status). Waived rows are excluded
from billed/outstanding totals. (Editing, waivers, payment plans are a
deliberate follow-up.)

**QC — testable now (needs sample data):**
- [ ] With no dues records, the page shows the empty state and $0 summaries.
- [ ] Insert a few `dues_payments` rows in Supabase (varied statuses:
      pending/partial/paid/overdue/waived) → table lists them, newest first.
- [ ] Family + athlete names resolve correctly from the IDs.
- [ ] Summary math checks out: Collected = sum of amount_paid; Outstanding =
      unpaid balance excluding waived; a waived row doesn't inflate billed.
- [ ] Status badges color-code correctly per status.

**Note:** Dues rows are normally created by the Stripe checkout/webhook path,
which needs live Stripe to generate naturally. For QC now, insert sample rows
manually in the Supabase table editor.

---

## Section 4 — Admin sponsors view (`/admin/sponsors`)

**What was built:** A read-only overview — summary cards (Total committed /
Active / Total on file) plus a table sorted by commitment amount (name, tier,
amount, contact, active status, website link). (Editing is a follow-up.)

**QC — testable now (needs sample data):**
- [ ] With no sponsors, the page shows the empty state and zeroed summaries.
- [ ] Insert a few `sponsors` rows in Supabase (varied tiers, some inactive,
      some with no amount) → table lists them, highest amount first.
- [ ] Tier labels render friendly ("Wizard for Life", not "wizard_for_life").
- [ ] "Total committed" sums amounts; rows with null amount show "—" and don't
      break the total.
- [ ] Website link opens in a new tab; missing site shows "—".
- [ ] Active/inactive badge reflects the row.

---

## Cross-cutting QC (run once an environment is up)

- [ ] `npm run build` passes (currently green).
- [ ] Role gating: a parent can't reach any `/admin/*` route; staff can't reach
      admin-only pages.
- [ ] All four new pages render without the dark-on-dark readability issues
      fixed earlier.
