# Layout sweep (run before shipping any UI change)

Opens every admin, parent and public page at 320, 360, 390, 768, 1024 and 1440
px against a fake database and flags what a phone user would hit:

- `CLIPPED`: text or a button cut off by its card (the page itself doesn't scroll,
  so a plain "does the page scroll sideways" check misses this)
- `OFFSCREEN`: a control or text past the screen edge
- `TEXT SPILLS`: words wider than their own button or badge
- `SMALL TAP`: a button under 44 x 44 px
- `PAGE SCROLLS SIDEWAYS`
- `TABLE needs sideways swipe`: informational. Admin data tables scroll inside
  their own box on a phone by design.

Anything other than `TABLE` lines is a fail. Fix it and rerun before shipping.

`mock.cjs` holds made-up data only. Never put a real family, staff name or
email in it.

## Run

From the repo root (`QA=.claude/skills/wizards-request/qa`):

```bash
QA=.claude/skills/wizards-request/qa
MOCK_ENV="NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-test SUPABASE_SERVICE_ROLE_KEY=service-test"
env $MOCK_ENV npx next build
node $QA/mock.cjs &                       # fake Supabase on :54329
env $MOCK_ENV npx next start -p 3100 &   # the app on :3100
node $QA/layout-sweep.cjs . 320,360,390,768,1024,1440
```

The last line prints `TOTAL n`; only `TABLE` lines may remain.

Playwright and Chromium come from the cloud container (`/opt/...`). Elsewhere set
`PLAYWRIGHT_PATH` and `CHROMIUM_PATH`.

When a page needs data the mock doesn't have (more admins, a document, a paid
dues row), add fake rows to `mock.cjs` so the real layout renders. The Admin
team overflow of Oct 16 slipped through because the mock had one admin, so no
action buttons ever showed.
