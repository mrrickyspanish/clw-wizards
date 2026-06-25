# CLW Platform — MVP 1 Build Timeline

**Prepared:** June 24, 2026 · **Target ship date:** August 1, 2026
**Window:** ~5.5 weeks (5 build weeks + a buffer/UAT week)

> **Scope note (Jun 24):** Final go-ahead landed ~3 weeks later than planned,
> so MVP 1 is scoped as a **confident, committed core** plus a **stretch**
> tier that ships only if the core lands early. **SMS is a fast-follow**
> (post-launch), not part of MVP 1 — email comms cover launch. This removes
> Twilio carrier approval from the critical path.

## TL;DR

The backend is done. Auth, the Supabase database (10 tables + row-level
security), Stripe payments, the email/SMS comms engine, and the scheduled
reminder jobs are all built and verified (`npm run build`, type-check, and
lint all pass clean). **MVP 1 is primarily front-end assembly on top of APIs
that already work** — that's why an Aug 1 ship is realistic even on the
compressed window.

## What's already done (Phase 0 — complete)

- **Auth**: login, signup, password reset — fully functional UI + backend.
- **Database**: profiles/athletes/tournaments/registrations/dues/sponsors/
  comms-log/documents/donations, with RLS and an auto-provisioning signup trigger.
- **Payments**: Stripe checkout + webhook (dues, donations, sponsorships) with
  Resend email confirmations — *backend live, needs UI to drive it.*
- **Comms**: queued email + SMS blasts (Resend + Twilio, opt-in respected) —
  *backend live, needs admin compose UI.*
- **Automation**: 4 scheduled reminder jobs (tournament, weigh-in, digest, dues).
- **Shells**: admin/staff/parent dashboards with live counts + the full UI
  component library installed.

## MVP 1 scope

The committed core: a parent can register, see their athlete, sign up for a
tournament, and pay dues; an admin can manage families/tournaments and email
the club. That's enough to actually *run* the club and take money. Anything
beyond that is stretch — it ships if the core lands with runway to spare,
otherwise it rolls to the fast-follow.

**Committed core (we ship this Aug 1):**

| Area | Notes |
|------|-------|
| Auth | ✅ already done |
| Admin: tournaments create/edit/list | operators load the schedule |
| Admin: families & athletes management | operators load rosters |
| Admin: **email** comms compose & send UI | wired to live blast endpoint |
| Parent: athlete detail | |
| Parent: tournament browse + register | wired to existing registration backend |
| Parent: pay dues (UI → existing Stripe checkout) | revenue path |
| Public: landing page | real entry point, Sign In / Create Account |

**Stretch (ship if core finishes early, else fast-follow):**

| Area | Notes |
|------|-------|
| Parent: documents view | |
| Staff: roster view (read-only) | |
| Admin: dues & sponsors detail views | |

**Fast-follow / MVP 2 (explicitly out of MVP 1):**

| Area | Why deferred |
|------|--------------|
| **SMS comms** | Twilio A2P 10DLC carrier approval lead time; email covers launch |
| Staff live check-in / weigh-in entry | |
| Recurring tournaments, waitlists, payment plans | |
| **Card-on-file at onboarding** | Possible client requirement — capture a payment method during the onboarding wizard (e.g. Stripe SetupIntent) for later dues/fees. Confirm with Will whether CLW wants pay-/card-to-register before building. |
| Full marketing site + Sanity CMS | |

## Week-by-week

**Week 1 — Jun 24–30 · Admin core**
Tournaments create/edit/list UI; families & athletes management screens.
Gives admins the ability to put real data in the system.

**Week 2 — Jul 1–7 · Admin email comms**
Email compose-and-send UI wired to the live blast endpoint. (Comms backend
already works — this is just the panel; SMS toggle deferred to fast-follow.)
Dues/sponsors admin detail views are *stretch* if time allows.

**Week 3 — Jul 8–14 · Parent portal, part 1**
Athlete detail view; tournament browse + registration flow wired to the
existing checkout/registration backend.

**Week 4 — Jul 15–21 · Parent dues + stretch**
Dues payment UI (→ existing Stripe checkout). Then stretch items as time
allows: parent documents view, read-only staff roster.

**Week 5 — Jul 22–28 · Public page, integration, QA**
Landing page; production env wiring (Supabase prod, Stripe live keys, Resend
domain — Twilio not needed for launch); end-to-end testing; deploy to staging
on Vercel.

**Buffer week — Jul 29–Aug 1 · UAT + launch**
Walkthrough with Tyler, bug fixes, polish, production cutover. **Ship Aug 1.**

## Risks & external dependencies (start these NOW — not code, but they gate launch)

1. **Stripe** — live account verification + bank details. Usually quick but
   needs business info entered. *On the revenue critical path — do this first.*
2. **Resend** — verify the `crystallakewizards.com` sending domain (DNS records).
3. **Supabase production project** — provision + run migrations (separate from dev).
4. **Domain / DNS** — point the production domain at Vercel.
5. **Twilio A2P 10DLC registration** — *not* a launch blocker (SMS is a
   fast-follow), but still worth starting now so SMS is ready when we turn it
   on post-launch. Carrier approval can take 1–3 weeks.

## Bottom line for Tyler

- **Aug 1 MVP 1 is achievable** because the hard part (backend/data/payments)
  is built and verified, and the compressed window is absorbed by cutting to a
  committed core + stretch tier.
- **SMS is a deliberate fast-follow**, not a slip — email comms cover launch,
  and pulling Twilio off the critical path de-risks the date.
- Stretch and fast-follow items are a planned backlog, not missing work.
