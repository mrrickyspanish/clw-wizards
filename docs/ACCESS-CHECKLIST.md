# CLW Platform — Access & Accounts Needed from the Club

This is everything we need **from the Crystal Lake Wizards side** to launch and
operate the platform. It's organized by urgency. The biggest theme: most of
these depend on **one decision first** — *who at CLW is the account owner /
billing authority* (likely Tyler). That person should create or own the
accounts below so the club isn't locked out if a developer steps away.

> **Single most important unblock right now:** access to the **domain
> registrar** for `crystallakewizards.com`. It gates email sending *and*
> pointing the live site at our host. Nothing else can fully go live until DNS
> records can be added.

---

## 1. Critical path — these gate the Aug 1 launch

### Domain registrar (e.g. GoDaddy, Namecheap, Google Domains)
- **What it's for:** adding DNS records so (a) email can send from
  `@crystallakewizards.com` and (b) the live website points at our host.
- **What we need:** login, OR the registrar's "delegate/team access," OR
  someone on the CLW side who will paste in the exact DNS records we give them.
- **Who likely holds it:** whoever originally bought the domain.

### Email hosting for `@crystallakewizards.com` (Google Workspace, Microsoft 365, or registrar email)
- **What it's for:** the addresses the platform sends from and routes to —
  `noreply@crystallakewizards.com` (system/confirmation emails) and
  `info@crystallakewizards.com` (the alert/contact address).
- **What we need:** confirmation those two addresses exist (or can be created),
  and which provider hosts the email. This is also the "sign-in approval on
  email" piece — confirmation emails for new parent accounts come from here.

### Stripe (the club's payment account) — REVENUE PATH, do this first
- **What it's for:** collecting dues, donations, and sponsorship payments.
  Money lands in the club's bank account.
- **What we need:** the club's Stripe account with **business verification +
  bank account** completed, and either ownership of it or an admin invite for
  setup. This MUST be the club's own account — payouts go to their bank.
- **Who holds it:** the club treasurer / Tyler. Needs legal business info.

---

## 2. Developer-managed, but tied to the club's domain/business

### Resend (email sending service)
- **What it's for:** all outbound email (account confirmations, dues receipts,
  club announcements).
- **What we need from CLW:** nothing directly — BUT it requires DNS records on
  the registrar above to verify `crystallakewizards.com` as a sender. Until
  that's done, email is capped at a tiny built-in limit (this is the exact
  rate-limit issue blocking signups today).

### Supabase (database + login system)
- **What it's for:** the entire backend — accounts, athletes, dues records.
- **Decision needed:** who owns this account long-term. Recommend the club owns
  the billing/org so they retain their data if a developer leaves. Can start
  developer-owned and transfer.

### Vercel (website hosting)
- **What it's for:** running the live site.
- **Decision needed:** same ownership question — fine to start developer-owned,
  worth transferring billing to the club eventually.

---

## 3. Fast-follow (NOT needed for Aug 1 — SMS launches after)

### Twilio (text-message sending)
- **What it's for:** SMS reminders and alerts (deferred to after launch; email
  covers the launch).
- **What we need from CLW:** legal business details for carrier registration
  (A2P 10DLC) — registered business name, EIN/tax ID, business address,
  contact. This has a **multi-week carrier approval lead time**, so it's worth
  starting the paperwork early even though SMS isn't in the first release.

---

## 4. Content & brand assets (needed to make the site look real)

- Club **logo** files (high-res / vector if available).
- **Sponsor logos** + names/tiers for the sponsors section.
- Any **copy** for the public landing page (about, mission, contact info).
- Confirmation of the public **contact email/phone** to display.

---

## 5. Things WE handle — no CLW access needed (listed for completeness)

- **Cloudflare Turnstile** (bot protection on public forms) — developer-set,
  free.
- **QStash / Upstash** (background job queue for sending email/SMS in bulk) —
  developer-set.
- **Cron scheduling** (automated reminders) — handled in hosting config.

---

## Suggested order of operations

1. Identify the **one CLW account owner** (Tyler?) for everything below.
2. Get **registrar access** → unblocks email + live domain. *(highest leverage)*
3. Stand up / verify **Stripe** with the club's bank info. *(revenue path)*
4. Confirm **email addresses** (`noreply@`, `info@`) exist.
5. Decide **Supabase + Vercel** ownership.
6. Start **Twilio** business paperwork in the background (for the SMS fast-follow).
7. Collect **logo + sponsor + landing-page content.**
