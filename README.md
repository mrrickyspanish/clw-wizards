# CLW Platform — Crystal Lake Wizards Wrestling Club

The public site helps new families find the club. The family portal handles wrestlers, season registration, dues and tournament participation. Staff and administrators manage reviews, rosters and communications. Supabase stores the underlying records and enforces access by role and family relationship.

## How a family moves through the club

| Workflow | Family action | Staff handoff |
| --- | --- | --- |
| Season enrollment | A parent opens the active season and completes the registration for each wrestler they own. | Administrators review submitted records, request changes or approve enrollment. The review shows missing payment, waiver and membership documentation. |
| Tournament entry | A family selects eligible wrestlers. Club checkout uses the event’s configured fee. Events with external registration follow their external path. | The family roster reconciles club entries with matched TrackWrestling entries. External roster presence and club payment status are tracked separately. |
| Payments | Families can start checkout for eligible charges. Supporters can donate or sponsor. | Stripe events update the corresponding payment flow, including delayed outcomes and refunds. Starting checkout and recording payment are distinct events. |
| Communications | Families receive updates for the selected audience. Additional family contacts can receive email. SMS depends on individual opt-in. | Staff compose a message, select recipients and check the blast’s history for successful and failed sends. Scheduled tournament reminders also depend on the family reminder switch. |

[Annual registration requirements](docs/annual-registration-form.md) · [Enrollment review](src/app/admin/registrations/page.tsx) · [Family roster](src/app/%28portal%29/tournament-rosters/page.tsx) · [Tournament checkout](src/lib/payments/tournament-checkout.ts) · [Payment events](src/app/api/webhooks/stripe/route.ts) · [Staff communications](src/app/admin/communications/page.tsx)

## What to check when a family misses a message

A queued job means delivery work was accepted. The delivery worker resolves the audience, spaces out sends and groups results by blast ID. Start with the intended recipient and that blast’s provider outcome. Parent login and password recovery issues have a separate reporting path.

[Delivery worker](src/app/api/comms/blast-job/route.ts) · [Reminder eligibility](src/app/api/crons/wednesday-reminder/route.ts) · [Parent account alerts](docs/parent-auth-alerts.md)

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
