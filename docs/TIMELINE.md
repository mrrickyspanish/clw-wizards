# CLW Platform — MVP 1 Build Timeline

**Prepared:** June 24, 2026 · **Target ship date:** August 1, 2026
**Window:** ~5.5 weeks (5 build weeks + a buffer/UAT week)

## TL;DR

The backend is done. Auth, the Supabase database (10 tables + row-level
security), Stripe payments, the email/SMS comms engine, and the scheduled
reminder jobs are all built and verified (`npm run build`, type-check, and
lint all pass clean). **MVP 1 is primarily front-end assembly on top of APIs
that already work** — that's why an Aug 1 ship is realistic.

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

## MVP 1 scope (proposed)

The goal of MVP 1: a parent can register, see their athlete, sign up for a
tournament, and pay dues; an admin can manage families/tournaments and send a
blast; staff can pull a roster. Everything needed to actually *run* the club.

| Area | In MVP 1 | Deferred to MVP 2 |
|------|----------|-------------------|
| Auth | ✅ done | — |
| Admin: tournaments create/edit | ✅ | recurring/series scheduling |
| Admin: families & athletes management | ✅ | bulk import |
| Admin: comms compose & send UI | ✅ | templates, scheduling |
| Admin: dues & sponsors views | ✅ | invoicing automation |
| Parent: athlete detail | ✅ | — |
| Parent: tournament browse + register | ✅ | waitlists |
| Parent: pay dues (UI → existing checkout) | ✅ | payment plans |
| Parent: documents | ✅ | e-signature |
| Staff: roster view | ✅ | live check-in / weigh-in entry |
| Public: real landing/marketing page | ✅ | full marketing site, Sanity CMS |

## Week-by-week

**Week 1 — Jun 24–30 · Admin core**
Tournaments create/edit/list UI; families & athletes management screens.
Gives admins the ability to put real data in the system.

**Week 2 — Jul 1–7 · Admin comms + money views**
Comms compose-and-send UI wired to the live blast endpoint; dues and sponsors
admin views. (Comms backend already works — this is just the panel.)

**Week 3 — Jul 8–14 · Parent portal, part 1**
Athlete detail view; tournament browse + registration flow wired to the
existing checkout/registration backend.

**Week 4 — Jul 15–21 · Parent portal, part 2 + Staff**
Dues payment UI (→ existing Stripe checkout); documents view; staff roster.

**Week 5 — Jul 22–28 · Public page, integration, QA**
Real landing/marketing page; production env wiring (Supabase prod, Stripe live
keys, Resend domain, Twilio); end-to-end testing; deploy to staging on Vercel.

**Buffer week — Jul 29–Aug 1 · UAT + launch**
Walkthrough with Tyler, bug fixes, polish, production cutover. **Ship Aug 1.**

## Risks & external dependencies (start these NOW — not code, but they gate launch)

1. **Twilio A2P 10DLC registration** — biggest schedule risk. Carrier approval
   for SMS campaigns can take **1–3 weeks**. If SMS isn't registered in time,
   we ship MVP 1 with **email comms only** and turn SMS on when approved.
   *Action: register the brand/campaign this week.*
2. **Stripe** — live account verification + bank details. Usually quick but
   needs business info entered.
3. **Resend** — verify the `crystallakewizards.com` sending domain (DNS records).
4. **Supabase production project** — provision + run migrations (separate from dev).
5. **Domain / DNS** — point the production domain at Vercel.

## Bottom line for Tyler

- **Aug 1 MVP 1 is achievable** because the hard part (backend/data/payments)
  is built and verified.
- The one thing that could slip a *feature* (not the date) is **Twilio SMS
  approval** — if it's not approved by late July, MVP 1 launches with email
  comms and SMS follows shortly after.
- Everything not in MVP 1 above is a clean MVP 2 backlog, not missing work.
