# Second Baptist Church of Elgin: staff dashboard demo

A handoff for whichever Claude session works on the SBC demo. Everything SBC
lives on this branch (`claude/sbc-church-demo`). The CLW Wizards session no
longer takes SBC requests, so do the work here and ask RJ for approvals in
your own chat.

## Rules that never bend

- Work only on branch `claude/sbc-church-demo`. Never push to `main`, and
  never merge this branch into anything.
- Use only the Homefield Demo database (Supabase project
  `qokgompkyqyjasidmwnr`). Never touch the club's database
  (`nerrrzuocgaohrzurnny`). The app refuses to run against it
  (`demoProblems` in `src/lib/demo.ts`).
- Invented people only. No real member, child, gift or contact.
- Read-only stays on. Nothing a visitor does may save.
- Don't change Vercel settings: no protection, domains or production env.
  Branch env vars already exist. If you need a new one, ask RJ to add it,
  scoped to Preview on this branch only.
- Don't ask for passwords or keys in chat, and don't print any that turn up.

## Where it lives

- **Preview:**
  `https://clw-wizards-git-claude-sbc-church-demo-creativeeyemm.vercel.app`.
  It sits behind Vercel Authentication; RJ shares it with a share link. Every
  push to this branch redeploys it.
- **Entry:** `/demo` shows one button per staff role plus a member view, and
  `/demo/enter?as=<key>` signs in with no password. Public pages redirect to
  `/demo`.
- **Branch env vars** (Preview, this branch only): `NEXT_PUBLIC_DEMO_MODE=1`,
  `NEXT_PUBLIC_DEMO_FLAVOR=church`, the demo database's URL and anon key,
  `SUPABASE_SERVICE_ROLE_KEY` (sensitive) and `DEMO_PASSWORD` (sensitive; RJ
  has it).
- **The database is shared with the Mohegan Valley wrestling demo.** Resetting
  that one at `/demo-reset` on its own branch wipes the church logins. Fix:
  run the church reset at `/demo-reset` on this preview, which needs
  `DEMO_PASSWORD`.

## How the reskin works

The church demo is the wrestling club app relabeled at build time. The repo's
source keeps the club's words.

- `npm run build` runs `prebuild`:
  - `scripts/demo-assets.mjs` swaps the photos.
  - `scripts/demo-copy.mjs` rewrites names. Its `CHURCH_RULES` are for exact
    phrases.
  - `scripts/demo-church.mjs` relabels on-screen words only, using the
    TypeScript parser: Parents become Members, Wrestlers Participants,
    Practice groups Ministries, Dues Giving, Tournaments Retreats & Trips.
  - The scripts only touch a build copy: on Vercel, or locally with
    `--root <copy>`. Never your checkout.
- **Look:** `src/config/org.config.ts` (`SECOND_BAPTIST_DEMO`) holds the name
  and navy and gold colors. Larger type for older staff is in
  `src/app/globals.css` under `html[data-demo='church']`.
- **Read-only, app side:** `src/lib/demo-readonly.ts`. Every Supabase client
  gets a fetch wrapper that refuses writes with "Read-only demo: changes are
  not saved."
- **Read-only, database side:** `scripts/demo-church-readonly.sql`. It is
  applied to the demo database only, deliberately not as a migration. Re-run
  it if you add a table.
- **Roles:** `src/lib/demo-roles.ts` is one list driving the menu, page
  access (middleware), the entry screen and the reset's logins. Add a role
  there, push, then run the church reset so its login exists.
- **Sample data:** `src/lib/demo-seed-church.ts`.

## Checks before you push

- `npx tsc --noEmit`, `npm run lint` and `npm run test:auth` (every module the
  middleware imports needs a default mock in `tests/auth-recovery.test.cjs`).
- After the preview redeploys, sign in through each role on `/demo`.
  - Confirm each role sees only its pages.
  - Confirm a save shows the read-only message.
  - Confirm the database is unchanged (row counts before and after).

## Status (Nov 20)

- **Done:**
  - Six staff roles: Church Admin, Communications, Giving Admin, Ministry Admin
    (Music Ministry), Note Sender (Grief & Recovery) and Ministry Staff.
  - Giving is visible only to Giving Admin.
  - The member menu reads Household Members.
  - No password, and read-only everywhere.
- **Pages mock (Nov 20, built in the SBC session):**
  - `/admin/pages` list, `/admin/pages/new` (Insert New Page), `/admin/pages/edit`
    (slot editor with live phone/desktop preview) and `/admin/pages/review`
    (approval queue, Church Admin only). Front-end only: sample pages live in
    `src/lib/demo-pages.ts`, no database tables, nothing saves.
  - Three templates: Story page, Get Involved page, Announcement. Spec:
    `projects/sbc-digital-platform/outputs/38-page-builder-spec.md` in
    creative-eye-agent-os.
  - Access (`pages` on each role in `demo-roles.ts`): Church Admin full;
    Page Editor (new role, `pages@sbc-demo.example`) creates and edits drafts;
    Ministry Admin edits only Music Ministry's pages; others have no Pages item.
  - The files are written in church words and are skipped by
    `scripts/demo-church.mjs`. Photos are in `public/images/sbc-pages/`: all are
    AI-generated samples from the SBC preview (job IDs in
    creative-eye-agent-os `evidence/2026-11-16-ai-sample-photography.md`). No
    real concert frames: the recap still needs PR ministry sign-off.
  - The Page Editor login exists only after a church reset at `/demo-reset`.
- **UX scrub (Nov 20, RJ approved all three callouts):**
  - Hidden in the church build: Overview (`/admin`), Sign-ups, To review,
    Community Partners, Website content and the admin's Member view
    (`CHURCH_HIDDEN` in `demo-roles.ts`), plus member Documents and Household
    (`CHURCH_PORTAL_HIDDEN` in `src/app/(portal)/layout.tsx`).
  - Each role's menu order and landing page come from `menu` and `home` in
    `demo-roles.ts`: Church Admin and Ministry Admin land on Pages, Ministry
    Staff on Meetings & Events.
  - Giving is gifts received only, for both the Giving Admin
    (`ChurchGiving` in `src/app/admin/dues/page.tsx`) and members
    (`ChurchMemberGiving` in `src/app/(portal)/dues/page.tsx`). No balances,
    pledges or due dates. Fund names are sample labels.
  - Role names show in the sidebar, phone menu and read-only banner.
  - "Participant" now reads "household member" (or "People" as a heading) in
    `demo-church.mjs`. Other church-only wording is behind `CHURCH_READ_ONLY`
    in the page itself, so the club build is unchanged.
  - Full findings: creative-eye-agent-os
    `projects/sbc-digital-platform/reviews/UX-scrub-staff-demo-2026-11-20.md`.
- **Open:** nothing known.
  - Fixed (Nov 20): a Ministry Admin opening another household by a direct
    `/admin/families/<id>` address now gets 404, matching the Members list.
