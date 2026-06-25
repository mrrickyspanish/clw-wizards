# CLW Platform — End-to-End Testing Runbook

A sequenced walkthrough for manual QC. The per-feature pass/fail checklists
live in `docs/QC-LOG.md`; this file is **how to set up and sequence** a testing
session, plus what's expected to stub out.

> **Environment assumptions (as of this run):** testing against the dev
> Supabase project on a Vercel preview. **Resend/email, Stripe keys, and
> QStash are NOT configured.** The workarounds and "expected stubs" below
> account for that.

---

## A. One-time setup (~5 min, all in the Supabase dashboard)

1. **Bypass email confirmation for testing.** Authentication → Settings →
   toggle **"Confirm email" OFF**. Signups then log in immediately, no email
   required.
   *Alternative:* leave it on and manually confirm each test user under
   Authentication → Users.
2. **Create the three roles.** Everyone signs up as `parent` by default. To
   test admin/staff, edit `profiles.role` in the table editor:
   - one account → `admin`
   - one account → `staff`
   - one account → leave as `parent`
3. **Onboarding column** (`profiles.onboarding_completed_at`) — already applied,
   no action.

---

## B. Test sequence (dependency order matters)

1. **Parent signup → onboarding.** Sign up → confirm you land on `/onboarding`
   (not the dashboard) → add phone + at least one athlete → save → verify the
   athlete shows on the dashboard.
2. **As admin: create tournaments** so the parent side has data. Make four:
   - one **open + internal** (no external URL)
   - one **with an external registration URL**
   - one **closed**
   - one **past-dated** (to confirm it's hidden from parents)
3. **As parent: tournaments.** Register / withdraw / re-register on the open
   internal one; confirm the external one links out, the closed one shows no
   buttons, and the past-dated one doesn't appear.
4. **Seed read-view data** (Supabase table editor, rows pointed at the test
   parent's `id`):
   - `dues_payments` — a couple, varied statuses → `/dues` + admin dues
   - `sponsors` — varied tiers, some inactive → admin sponsors
   - `athlete_documents` — toggle `verified` → `/documents`
5. **Staff roster.** Log in as staff → `/staff/athletes` → check the group
   filter chips → confirm a parent **cannot** reach the page.
6. **Admin comms.** `/admin/communications` → pick audiences → **Preview
   recipients** (counts work fully). Sending is stubbed (see C).

---

## C. Expected stubs (NOT bugs, given the current env)

- **Any actual email** — signup confirm, comms delivery, dues receipt — is
  blocked until Resend + the sending domain are configured. (Hence the step A1
  workaround.)
- **Dues "Pay" button** → returns *"Stripe is not configured yet."* Everything
  up to the redirect (balance math, the record list, the success/cancelled
  banners via manual `?checkout=` URLs) is testable. The charge waits on Stripe
  keys. *(With Stripe **test** keys set, test card `4242 4242 4242 4242` goes
  all the way.)*
- **Comms "Send" button** → no QStash queue configured, so it errors at the
  queue step — likely surfacing as a generic *"Network error — please try
  again"* rather than a tidy message. Validate the feature via **Preview
  recipients** for now.

---

## D. Fully testable today (no external services needed)

- Onboarding (signup → gate → athletes → dashboard)
- Tournaments register / withdraw / re-register (pure database)
- My Athletes + Documents views
- Admin: families, tournaments CRUD, dues view, sponsors view
- Staff roster + group filters
- Comms compose form + recipient preview
- All role-gating (parent ↔ staff ↔ admin boundaries)

---

## E. Reporting bugs

For anything that looks wrong, capture: the **route** (URL), **what you did**,
**what you expected**, **what happened** (screenshot or error text + the
`Digest:` id if it's a server error). That's enough to diagnose and fix on the
`claude/friendly-goodall-qy7bi0` branch.
