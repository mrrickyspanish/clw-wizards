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

## Section 5 — Parent athlete detail view (`/athletes`)

**What was built:** "My Athletes" now shows a detail card per wrestler on the
parent's roster — practice group, date of birth (with computed age), weight
class, shirt size, USA Wrestling card #, active/inactive. Read-only; editing
stays with admins for now.

**QC — testable now:**
- [ ] A parent with athletes sees one card each, oldest-added first.
- [ ] Every field renders; blanks show "—" rather than empty.
- [ ] Age is computed correctly from date of birth (check one before/after a
      birthday boundary).
- [ ] A parent with no athletes sees the empty state.
- [ ] A parent only ever sees their OWN athletes (RLS) — never another family's.

---

## Section 6 — Parent tournament browse + registration (`/tournaments`)

**What was built:** Upcoming tournaments (today forward, Chicago time, soonest
first) with date, location, weigh-in/start details, status, and notes.
- Tournaments with an external registration URL show a "Register on
  [platform]" link out.
- Open internal tournaments show inline per-athlete **Register / Withdraw**
  controls wired to the existing registrations backend.
- Closed/cancelled internal tournaments show "Registration is closed."

**QC — testable now (needs sample tournaments):**
- [ ] Create an OPEN internal tournament (no external URL) in admin → it shows
      on the parent page with Register buttons for each active athlete.
- [ ] Register an athlete → button flips to a "registered" badge + Withdraw.
- [ ] Withdraw → flips back to a "Register again" button; re-registering works
      (idempotent, no duplicate-key error).
- [ ] Create a tournament WITH an external URL → parent sees the external link,
      no inline register controls.
- [ ] Set a tournament to closed/cancelled → parent sees "Registration is
      closed/cancelled," no register buttons.
- [ ] Past-dated tournaments do NOT appear (upcoming-only filter).
- [ ] A parent with no athletes sees "Add an athlete to your roster first."
- [ ] Attempting to register for a closed or external tournament via a stale
      page is rejected server-side with a clear message.
- [ ] A parent can't register another family's athlete (ownership check + RLS).

---

## Section 7 — Parent dues payment (`/dues`)

**What was built:** "Dues" now shows the parent's outstanding balance, a list
of every dues record (season, athlete, amount, amount paid, due date, status),
and a **Pay [amount]** button on each unpaid record that launches Stripe
checkout for the full remaining balance. On return, a success/cancelled banner
shows based on the `?checkout=` param. The Stripe webhook (already built)
applies the payment and emails a receipt.

**QC — needs live Stripe + sample data:**
- [ ] Insert a `dues_payments` row for the parent (status pending/overdue) →
      it shows with a "Pay $X" button; outstanding balance reflects it.
- [ ] Click Pay → redirected to Stripe checkout for the right amount.
- [ ] Complete payment → redirected back to `/dues?checkout=success` with the
      green banner.
- [ ] After the webhook fires, refresh → status flips to paid, button gone,
      balance drops to $0; a receipt email is logged/sent.
- [ ] Cancel at Stripe → returns to `/dues?checkout=cancelled` with the muted
      banner; nothing charged.
- [ ] Paid/waived rows show no Pay button.
- [ ] A parent only sees their OWN dues (RLS); the checkout endpoint rejects a
      dues id that isn't theirs (403).

**Blocked on credentials:** needs the club's live Stripe keys
(`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) wired in. Without them the Pay
button returns a clean "Stripe is not configured yet" error. Dues rows are
normally created by an admin/import; for QC, insert sample rows in Supabase.

---

## Section 8 — Parent documents view (`/documents`)

**What was built:** A read-only status view. For each of the parent's
athletes it lists the two required documents (birth certificate, USA Wrestling
card) with a status badge — verified / pending review / not uploaded — read
from `athlete_documents`. Self-service upload is a follow-up; the page directs
parents to contact an admin to submit paperwork.

**QC — testable now (needs sample data):**
- [ ] A parent with athletes sees a card per athlete, each listing both
      required docs.
- [ ] With no `athlete_documents` rows, both show "not uploaded."
- [ ] Insert a doc row (verified=false) → that doc shows "pending review" with
      its file name; set verified=true → shows "verified."
- [ ] A parent only sees their OWN documents (RLS).
- [ ] A parent with no athletes sees the empty state.

---

## Section 9 — Read-only staff roster (`/staff/athletes`)

**What was built:** The active club roster as a table (athlete, practice group,
age, weight, family name), with practice-group filter chips. Sorted by group
then last name. Uses the service-role client server-side (staff lack RLS read
on other families' profiles) inside the staff-gated route, exposing only
roster-appropriate fields.

**QC — testable now (needs sample data):**
- [ ] As staff, the roster lists all ACTIVE athletes; inactive ones are
      excluded.
- [ ] Group filter chips narrow the list; "All groups" clears the filter.
- [ ] Age computes from DOB; missing weight shows "—"; family name resolves.
- [ ] A parent cannot reach `/staff/athletes` (middleware redirect).
- [ ] Empty states show for an empty group and an empty roster.

---

## Section 10 — Public landing page (`/`)

**What was built:** A real public front door (was just two links). Sections:
hero with Create Account / Sign In CTAs, about, the four practice groups, a
live **upcoming tournaments** strip (open + future, soonest first, max 4), a
live **active sponsors** showcase grouped by tier, a **donate** section wired
to the existing donation Stripe checkout (presets + custom, one-time/monthly),
and a footer. Plus OG/Twitter metadata in the root layout. The donation
checkout now returns to `/?donation=success|cancelled` (was a non-existent
`/sponsors` page).

**QC — mostly testable now:**
- [ ] `/` renders all sections, logged out, on desktop and mobile widths.
- [ ] Create Account / Sign In CTAs go to `/signup` and `/login`.
- [ ] With open, future tournaments seeded, the strip lists them soonest-first
      (max 4); with none, it shows the "check back soon" copy.
- [ ] With active sponsors seeded, the showcase groups them by tier; with none,
      the whole section is hidden.
- [ ] Donate: presets select, custom amount overrides a preset, monthly toggle
      changes the button label.
- [ ] Visiting `/?donation=success` shows the thank-you banner; `cancelled`
      shows the muted banner.

**Blocked on credentials:**
- The donate button itself hits Stripe — "Stripe is not configured yet" until
  live keys are set (same as dues). Everything up to the redirect is testable.

---

## Cross-cutting QC (run once an environment is up)

- [ ] `npm run build` passes (currently green).
- [ ] Role gating: a parent can't reach any `/admin/*` route; staff can't reach
      admin-only pages.
- [ ] All four new pages render without the dark-on-dark readability issues
      fixed earlier.
