# Crystal Lake Wizards — Rebuild Plan (Phase 1 Audit)

Branch: `clw-wizards-rj-operator-rebuild`
Status: Phase 1 (audit + plan) complete. Phases 2-7 not yet started, pending review of this document.

## 1. Current State

The repo is a Next.js 15 (App Router) site on Supabase, already substantially further along than a bare MVP. It is not a prototype needing a from-scratch rebuild — it is a real, working club system with real data, real auth, and real payment/comms integrations wired in. The mission brief's "audit before assuming a rebuild" instruction was correct: most of what the brief asks for already exists.

### Routes (all confirmed building cleanly — `npm run build` passes, 0 errors)

**Public marketing** (`(marketing)` group + root):
- `/` — homepage
- `/about`, `/program`, `/coaches`, `/faq`, `/sponsorship`, `/golf-outing`

**Auth**
- `/login`, `/signup`, `/forgot-password`, `/update-password`, `/onboarding`

**Parent portal** (`(portal)` group, auth-gated via middleware):
- `/dashboard`, `/athletes`, `/athletes/new`, `/tournaments`, `/dues`, `/documents`, `/schedule`, `/profile`

**Admin** (`/admin`, role-gated):
- `/admin` (overview), `/admin/families`, `/admin/families/[id]`, `/admin/tournaments`, `/admin/practices`, `/admin/dues`, `/admin/sponsors`, `/admin/communications`

**Staff** (`/staff`, role-gated, lighter-weight than admin):
- `/staff`, `/staff/athletes`, `/staff/tournaments`

**API routes:**
- `/api/checkout` (Stripe), `/api/webhooks/stripe`, `/api/verify-turnstile`
- `/api/comms/blast`, `/api/comms/blast-job` (async comms via QStash)
- `/api/crons/dues-reminder`, `/api/crons/monday-digest`, `/api/crons/wednesday-reminder`, `/api/crons/weigh-in-alert`

No broken imports, no dead routes found. `robots.ts` and `sitemap.ts` (added in a prior pass this session) already correctly disallow/exclude the private route groups above.

### Data model (Supabase, 14 migrations in `supabase/migrations/`)

Already implements essentially everything the brief's "Required Data Model Review" asked for:

| Brief's ask | Existing implementation |
|---|---|
| Family/Parent | `profiles` table (role: admin/staff/parent) |
| Wrestler/Athlete | `athletes` table |
| Practice Group | `practices` table |
| Event/Tournament | `tournaments` table |
| Registration | `tournament_registrations` table |
| Dues/Payments | `dues_payments` table |
| Documents | `athlete_documents` table |
| Sponsor | `sponsors` table (tiers: platinum/yellow/black/white/wizard_for_life) |
| Donation | `donations` table |
| Comms | `communication_log` table (email/SMS) |

Typed end-to-end in `src/types/database.ts` (238 lines, one type per table). This is a real, normalized schema — not something to migrate away from. **No new database dependency or schema change is recommended.**

### Auth

`src/middleware.ts` + `src/lib/supabase/{server,browser,middleware,admin}.ts` — standard Supabase SSR auth pattern, role-based route protection (parent/staff/admin). Already matches what the brief asks for; no need to "not overbuild" here since it's already right-sized.

### Integrations already wired (env-var gated, confirmed against `.env.example` with no undocumented or orphaned vars)

- **Stripe** — checkout + webhook (dues/donations)
- **Resend** — transactional email
- **Twilio** — SMS
- **Upstash QStash** — async comms fan-out + cron
- **Cloudflare Turnstile** — bot protection on public forms
- **Google Analytics 4** — gated on `NEXT_PUBLIC_GA_ID` (added this session)
- **Vercel Cron** — `CRON_SECRET`-gated cron routes

### Build/lint health

- `npx tsc --noEmit` — clean
- `npx next lint` — clean except 2 pre-existing warnings in shadcn boilerplate (`chart.tsx`, `use-toast.ts`), not project code
- `npm run build` — succeeds, all routes compile and prerender correctly

### SEO

`robots.ts`, `sitemap.ts`, dynamic `opengraph-image.tsx`, generated `icon.tsx`, JSON-LD `SportsClub` structured data, and full metadata (canonical, keywords, OG/Twitter cards) were added to the root layout in a prior pass this session. Private routes (`/admin`, `/staff`, `/dashboard`, etc.) are `noindex`'d.

### Homepage — already largely aligned with the brief's "Mission Control" direction

Recent work this session already delivered: full-bleed desktop hero, black/graphite/gold industrial-athletic identity, chamfered CTA buttons matching the header, wrestling-mat grunge texture (optimized to WebP, ~90KB) across all black sections, bento-style two-column sections (McHenry intro, Facility), centered single-column sections (Events, Support, Team, Facebook), horizontal event cards with left-panel photography, 80/20 image-to-caption team cards, and mobile-specific tuning (tighter photo collage, color imagery on mobile vs. grayscale on desktop). This is not "generic startup" or "fantasy wizard" — it already matches the brief's visual direction closely.

## 2. Problems Found

Ranked by actual impact, not by brief section order:

1. **Placeholder content, not placeholder code.** The system is built correctly; what's missing is real assets:
   - Team/coach headshots (currently initials-circle placeholders — the display logic already supports real photos, see `HomeTeamSection.tsx`, wired for drop-in this session)
   - `/coaches` page explicitly says "Public staff page placeholder. Full bios and photos can be added in the next pass" — but the board/coach names listed are already real
   - Sponsor logos are seeded placeholders (`20260624000013_seed_legacy_sponsors.sql`)
   - No live tournament data (events section renders its empty state correctly, by design)
2. **Facebook section has no real photo gallery** — currently a labeled "coming soon" placeholder frame, and the live-feed widget silently renders nothing if the Facebook embed fails to load (no fallback card since a prior cleanup pass removed it).
3. **Credentials not yet in hand** for Resend, Cloudflare, Upstash, Stripe, Twilio, domain registrar, GA4 — tracked separately with the client, not a code issue.
4. **Minor:** two pre-existing ESLint warnings in shadcn library files (unused var, unused type) — cosmetic, not worth touching since they're vendored component boilerplate.

Notably absent from this list: no broken auth, no schema redesign needed, no routing conflicts, no accessibility-breaking contrast issues found in this pass, no dependency bloat, no dead code of any real size.

## 3. Proposed Architecture

**Recommendation: keep the current architecture.** Next.js App Router + Supabase (Postgres + Auth + Storage) + Stripe + Resend + Twilio + Upstash is already the right stack for this club's scale, and it's already implemented cleanly with route groups separating public / portal / admin / staff concerns. A rebuild of the architecture itself is not warranted and would be pure risk with no upside — this directly follows the brief's own instruction not to assume a database change before inspection.

Where effort should actually go (in priority order):

1. **Real content pass**, not a code pass: team photos, coach bios, sponsor logos, real tournament data entry.
2. **Facebook section decision**: either build a real photo-gallery component (client can supply images) or restore a graceful fallback card so the section never renders empty.
3. **Admin dashboard polish pass**: the admin already covers families/tournaments/practices/dues/sponsors/communications — a pass to confirm status badges, search/filter, and empty states meet the brief's "volunteer-usable, not over-engineered" bar is worth doing, scoped narrowly (see Phase 6 below), rather than rebuilt.
4. **Parent portal polish pass**: confirm "next action" clarity, empty states, and light/dark contrast on `/dashboard`, `/athletes`, `/dues`, `/documents` — same scope discipline.

## 4. Database/Storage Recommendation

No change. Supabase Postgres + Storage already covers every entity in the brief's data model. Recommend only additive migrations if a genuine gap is found during the portal/admin polish passes (Phases 5-6) — not a redesign.

## 5. Routing Recommendation

No change. Current route-group structure (`(marketing)`, `(portal)`, `admin`, `staff`, root auth pages) already cleanly separates the five audiences the brief names (public, parents, wrestlers-via-parents, coaches/staff, admins). No redirects or compatibility shims needed since nothing is being restructured.

## 6. Public Website Recommendation

Continue the direction already in progress this session (see "Homepage" in Current State above). Remaining public-site work is content, not architecture:
- Real coach photos/bios on `/coaches`
- Real sponsor logos on the homepage sponsor strip and `/sponsorship`
- A decision on the Facebook photo-gallery placeholder

## 7. Parent Portal Recommendation

Structure already matches the brief (Home/Athletes/Tournaments/Dues/Documents/Profile). Recommend a scoped Phase 5 polish pass focused on: empty-state copy, next-action visual priority, and light/dark contrast — not a rebuild.

## 8. Admin Dashboard Recommendation

Structure already matches the brief (Overview/Families/Tournaments/Practices/Dues/Sponsors/Communications). Recommend a scoped Phase 6 polish pass on table scanability, status badges, and search/filter — not a rebuild.

## 9. Sponsor/Donation Recommendation

Schema and Stripe wiring already exist (`sponsors`, `donations` tables; `/api/checkout`, `/api/webhooks/stripe`). Homepage donation module already redesigned this session (chamfered CTA, centered cards). No architecture change needed — this is a real-logo/real-data gap, not a build gap.

## 10. Media/Image Recommendation

Continue the pattern already established this session: optimize any new source image to WebP, target 150-250KB, vignette to the brand black point, avoid centered/repeating motifs across stacked sections. Team/coach photos should follow the same real-club, non-dramatic direction the brief specifies once supplied by the client.

## 11. Migration/Refactor Plan

None required at the architecture level. All near-term work is content population (Phase 4-ish, but content not code) plus two scoped polish passes (parent portal, admin dashboard). This plan intentionally does **not** propose Phases 2-3 (new architecture foundation, new data/storage layer) as separate work items, because the audit found the existing foundation and data layer already meet the brief's requirements.

## 12. Risks

- **Scope risk**: the original mission brief describes a from-scratch rebuild across 7 phases. Executing all 7 phases literally (new architecture, new data layer) against a codebase that already has a correct architecture and data layer would be pure churn — re-implementing working systems for no functional gain, at real risk of introducing regressions into a system real families and coaches likely already use. This plan scopes down to the phases that have real work in them.
- **Content dependency**: the highest-value remaining work (photos, bios, sponsor logos, real tournament dates) depends on the client, not on engineering time.
- **Credentials dependency**: Stripe/Resend/Twilio/Upstash/Cloudflare/domain/GA4 access is pending from the client contact (tracked separately, already requested).
- **No regression tests exist** for booking/dues/registration flows — any future change to those flows should be manually verified end-to-end (see QA plan) since there's no automated safety net yet.

## 13. Build Phases (revised against audit findings)

- **Phase 1 — Audit and Plan:** Complete (this document).
- **Phase 2 — Architecture Foundation:** Not needed. Existing route groups, data access layer (`src/lib/supabase/*`), and shared UI system (`src/components/ui/*`, `src/components/landing/*`) already satisfy this phase's goals.
- **Phase 3 — Data/Storage Layer:** Not needed as a distinct phase. Revisit only if Phase 5/6 polish work surfaces a genuine schema gap.
- **Phase 4 — Public Website:** Mostly complete from this session's work. Remaining: real photo/logo content swaps, Facebook gallery decision.
- **Phase 5 — Parent Portal Polish:** Scoped pass on empty states, next-action clarity, contrast. Not yet started.
- **Phase 6 — Admin Dashboard Polish:** Scoped pass on table scanability, status badges, search/filter. Not yet started.
- **Phase 7 — QA and Closeout:** Run the full checklist below once Phases 5-6 land; produce `docs/clw-wizards-rebuild-closeout.md`.

## 14. QA Plan

- `npx tsc --noEmit`
- `npx next lint`
- `npm run build`
- Manual route walk: every route in section 1 above, desktop (1600px) and mobile (390px)
- Auth flow: signup -> onboarding -> login -> logout
- Registration flow: add athlete -> register for tournament (manual, since no seed tournament data exists yet in dev)
- Donation/dues flow: Stripe checkout in test mode
- Sponsor display: confirm graceful empty state with zero sponsors
- No broken images (grep for hardcoded `/images/` paths against what exists in `public/images/`)
- No leaked env vars (confirm `.env.local` git-ignored, no secrets in client-bundled code)
- Accessibility spot-check: contrast on dark sections, text-size floors per `CLAUDE.md`

---

**Recommendation to proceed:** run Phase 5 (parent portal polish) and Phase 6 (admin dashboard polish) as the two remaining scoped workstreams, then Phase 7 (QA + closeout). This stays inside the brief's actual intent — a serious, organized, family-friendly club system — without re-architecting a system that's already sound.
