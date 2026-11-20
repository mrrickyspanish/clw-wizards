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

### Chromium fallback

The sweep's default browser path is
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Container images move to
newer Chromium builds (for example `chromium-1243/chrome-linux64/chrome`), and
then the sweep fails at launch with "Executable doesn't exist". Point
`CHROMIUM_PATH` at whichever Chromium the container has:

```bash
export CHROMIUM_PATH=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome | tail -1)
```

### Other ports (parallel worktrees)

Two worktrees running the sweep at once collide on :3100 and :54329. Move both:

- the mock takes its port as the first argument: `node $QA/mock.cjs 54381 &`
- the app reads the mock through `NEXT_PUBLIC_SUPABASE_URL`, which `next build`
  bakes in, so build with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54381` and
  start with `npx next start -p 3181`
- tell the sweep where both are:

```bash
QA_APP_URL=http://127.0.0.1:3181 QA_MOCK_URL=http://127.0.0.1:54381 \
  node $QA/layout-sweep.cjs . 320,360,390,768,1024,1440
```

`QA_APP_URL` defaults to `http://127.0.0.1:3100` and `QA_MOCK_URL` to
`http://127.0.0.1:54329`. Run one sweep per mock at a time: the sweep switches
the mock between the admin and parent logins as it goes.

When a page needs data the mock doesn't have (more admins, a document, a paid
dues row), add fake rows to `mock.cjs` so the real layout renders. The Admin
team overflow of Oct 16 slipped through because the mock had one admin, so no
action buttons ever showed.
