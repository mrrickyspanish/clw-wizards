# CLW Platform — Crystal Lake Wizards Wrestling Club

Next.js 15 (App Router, TypeScript) platform: public site shell, admin dashboard,
staff dashboard, and parent portal, backed by Supabase (Postgres + Auth + RLS).

## Status

This build is a **verified-buildable foundation**, not the full 11-week scope from
the original brief. `npm run build`, `npx tsc --noEmit`, and `npx eslint .` all pass
clean. What's implemented vs. stubbed is listed below.

### Built

- **Database**: 10 Supabase migrations (`supabase/migrations/`) — `profiles`
  (role-based: `admin`/`staff`/`parent`), `athletes`, `tournaments`,
  `tournament_registrations`, `dues_payments`, `sponsors`, `communication_log`,
  `athlete_documents`, `donations` — with RLS policies and a `handle_new_user()`
  trigger that auto-creates a `profiles` row on signup.
- **Auth**: login, signup (parent self-registration), forgot-password,
  update-password — `@supabase/ssr` server/browser/middleware clients,
  role-based redirect via `src/lib/auth/session.ts`.
- **Access control**: `src/middleware.ts` gates `/admin`, `/staff`, and the
  parent-portal route group by role, on top of Postgres RLS (defense in depth).
- **Payments**: unified `/api/checkout` (dues balance, donations, sponsorships)
  and `/api/webhooks/stripe` — verifies the Stripe signature, branches on
  `session.metadata.flow`, writes via the service-role client, sends Resend
  confirmation emails (and a sponsor thank-you letter).
- **Comms**: `/api/comms/blast` (admin/staff-gated) enqueues a QStash job;
  `/api/comms/blast-job` (QStash-signature-verified) sends email (Resend) and/or
  SMS (Twilio, opt-in respected) in batches of 25, logging every send to
  `communication_log`.
- **Cron jobs** (`vercel.json`, bearer-token-protected via `CRON_SECRET`):
  Wednesday tournament reminder, day-before weigh-in SMS alert, Monday open-
  tournaments digest, Monday dues reminder. All times computed DST-safe in
  `America/Chicago` (`src/lib/chicago-time.ts`).
- **Dashboard shells**: `/admin`, `/staff`, and parent `/dashboard` layouts with
  live counts (active families, open tournaments, outstanding dues) and a
  shared `DashboardNav` sidebar.
- **UI**: full shadcn/ui component set (Radix primitives) under
  `src/components/ui/`.

### Explicitly deferred (stub pages only — "coming in a follow-up build")

- Parent portal: athletes, tournaments, dues, documents detail views.
- Admin: families, tournaments, dues, sponsors, communications *compose UI*
  (the comms backend is live; only the compose/send panel is stubbed).
- Staff: athletes, tournaments roster/check-in views.
- Public marketing website pages (only a minimal landing page with Sign
  In / Create Account exists).
- Sanity CMS schemas (not wired up).

## Corrections made vs. the original brief

The brief assumed a different framework/repo layout and a few non-existent
config files and enum names. This build was grounded against the actual
codebase instead:

- Stripe API version pinned to `2025-02-24.acacia` (matches installed
  `stripe@17.x` types, not the brief's `2024-12-18.acacia`).
- `@supabase/ssr` bumped `0.5.2` → `0.12.0` and `next`/`eslint-config-next`
  bumped to `15.5.19` — the pinned versions had a `SupabaseClient` generic
  signature mismatch and known high-severity middleware-bypass/DoS CVEs.
- `src/types/database.ts`: the hand-rolled `Database` type used `interface`
  declarations for row shapes and `Record<string, never>` for empty
  `Views`/`Functions` maps. Both are subtly wrong for `@supabase/postgrest-js`'s
  structural `GenericSchema` constraint — `interface` doesn't get TypeScript's
  implicit index-signature treatment (so `Profile` etc. didn't structurally
  match `Record<string, unknown>`), and `Record<string, never>` applies to
  *every* string key, intersecting every table down to `never`. Fixed by using
  `type` aliases for every row shape and `{ [_ in never]: never }` for the
  empty maps — this is the same shape `supabase gen types typescript` emits.
  This was the root cause of dozens of `Property 'x' does not exist on type
  'never'` errors across every Supabase query in the app.
- `react-day-picker` is v9 in this project; the shadcn `calendar.tsx` template
  copied from a sibling repo used the v8 `IconLeft`/`IconRight` API. Updated to
  v9's single `Chevron` component.
- Added `autoprefixer` to `devDependencies` (referenced by `postcss.config.js`
  but missing — broke `next build`) and an `eslint.config.mjs` (flat config
  via `FlatCompat`, since none existed and ESLint 9 requires one).
- `src/components/ui/sonner.tsx` referenced `next-themes`, a dependency that
  was never installed, for a dark/light toggle this app doesn't have (branding
  is fixed black/gold). Hardcoded `theme="dark"` instead of adding the unused
  dependency.
- `/login` uses `useSearchParams()` for a `redirectTo` param, which requires a
  `Suspense` boundary for static prerendering in Next 15 — wrapped accordingly.

## Setup

```bash
cp .env.example .env.local   # fill in real Supabase/Stripe/Resend/Twilio/QStash values
npm install
npx supabase db push          # or run the migrations in supabase/migrations/ manually
npm run dev
```

`CRON_SECRET` is auto-injected by Vercel as `Authorization: Bearer ${CRON_SECRET}`
on cron-triggered requests — you only need to set it as an env var, Vercel
handles sending it.

## Verification

```bash
npx tsc --noEmit   # clean
npx eslint .       # clean (2 benign warnings in vendored shadcn files)
npm run build      # clean production build
```
