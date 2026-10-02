/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness loads transpiled routes with mocked dependencies. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the real route and error policy with provider boundaries mocked.
// No network, credentials, test users or actual emails are involved.
function load(relative, mocks, env = {}, logs = [], fetcher = fetch, globals = {}) {
  mocks = { ...mocks }
  if (mocks['next/server'] && (!mocks['next/server'].after || mocks['next/server'].after === require('next/server').after)) mocks['next/server'] = { ...mocks['next/server'], after: () => {} }
  mocks['@/lib/auth/incidents'] ??= { registerResetAttempt: async () => {}, linkAttemptId: async () => '11111111-1111-4111-a111-111111111111', requestSourceKey: async () => 'test', reportParentAuthFailure: async () => {} }
  mocks['@/lib/auth/report-client'] ??= { authAttempt: () => 'test', reportClientAuthFailure: async () => {}, markAuthNavigation: () => {} }
  if (relative.startsWith('src/app/') || relative === 'src/middleware.ts') mocks['@/lib/auth/incident-policy'] ??= incidentPolicy
  if (relative.startsWith('src/app/')) mocks['@/lib/auth/recovery-errors'] ??= policy
  if (relative.startsWith('src/app/') || relative === 'src/middleware.ts') mocks['@/lib/safe-path'] ??= safePath
  if (relative.startsWith('src/app/')) mocks['@/lib/phone'] ??= phoneLib
  if (relative.startsWith('src/app/')) mocks['@/lib/child-key'] ??= childKeyLib
  const filename = path.join(__dirname, '..', relative)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const compiledModule = { exports: {} }
  vm.runInNewContext(code, {
    module: compiledModule, exports: compiledModule.exports,
    require: (id) => id in mocks ? mocks[id] : require(id),
    process: { env }, URL, URLSearchParams, Response, Request, AbortSignal, fetch: fetcher,
    console: { info: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    setTimeout: (fn) => { fn(); return 0 }, crypto: require('node:crypto').webcrypto, ...globals,
  }, { filename })
  return compiledModule.exports
}
const policy = load('src/lib/auth/recovery-errors.ts', {})
const incidentPolicy = load('src/lib/auth/incident-policy.ts', {})
const safePath = load('src/lib/safe-path.ts', {})
const phoneLib = load('src/lib/phone.ts', {})
const childKeyLib = load('src/lib/child-key.ts', {})
const incidentId = '11111111-1111-4111-a111-111111111111'

test('rejected confirmation/reset callbacks retain one attempt reference through fallback redirects', async () => {
  const next = require('next/server')
  for (const [routePath, step] of [['confirm', 'confirmation_link'], ['callback', 'reset_link']]) {
    const tasks = [], reports = []
    const mod = load(`src/app/auth/${routePath}/route.ts`, {
      'next/server': { ...next, after: task => tasks.push(task) },
      '@/lib/supabase/server': { createServerSupabase: async () => ({}) },
      '@/lib/auth/signup-routing': { signupDestination: () => '/dashboard' },
      '@/lib/auth/incidents': { requestSourceKey: async () => 'source', reportParentAuthFailure: async input => reports.push(input) },
    })
    let cookie = ''
    for (let i = 0; i < 2; i++) {
      const res = await mod.GET(new next.NextRequest(`https://www.clwizards.com/auth/${routePath}?error=access_denied&error_code=otp_expired&error_description=Link+expired`, { headers: { cookie } }))
      const id = res.cookies.get('clw_auth_attempt').value
      assert.ok(incidentPolicy.validAttempt(id))
      cookie = `clw_auth_attempt=${id}`
    }
    await Promise.all(tasks.map(task => task()))
    assert.equal(reports.length, 2)
    assert.equal(reports[0].attemptId, reports[1].attemptId)
    assert.equal(reports[0].step, step)
    assert.equal(reports[0].error.code, 'otp_expired')
    assert.equal(reports[0].error.message, 'Link expired')
  }
})

function incidentsHarness(options = {}) {
  const rows = new Map(), sends = [], logs = []
  let sendFails = Boolean(options.sendFails)
  const admin = {
    rpc: async (name, args) => {
      if (options.dbFails) return { error: { message: 'DB unavailable' } }
      if (name === 'record_parent_auth_failure') {
        if (options.rateLimited) return { data: false }
        const previous = rows.get(args.p_id)
        const row = previous ?? { id: args.p_id, occurrences: 0 }
        if (!row.first_seen) Object.assign(row, {
          first_seen: '2026-09-26T20:00:00Z', first_step: args.p_step, first_error: args.p_error,
          first_email: row.email ?? args.p_email, first_email_source: row.email_source ?? args.p_email_source,
        })
        row.latest_step = args.p_step; row.latest_error = args.p_error; row.occurrences++
        rows.set(args.p_id, row)
        return { data: true }
      }
      const row = rows.get(args.p_id)
      if (!row || row.notified_at || row.lease_until) return { data: [] }
      row.lease_until = 'claimed'
      return { data: [{ ...row }] }
    },
    from: () => ({
      insert: async row => { rows.set(row.id, { ...row, occurrences: 0 }); return { error: null } },
      update: values => ({ eq: async (_field, id) => { Object.assign(rows.get(id), values); return { error: null } } }),
    }),
  }
  const incidentModule = load('src/lib/auth/incidents.ts', {
    './incident-policy': incidentPolicy,
    '@/lib/supabase/admin': { createAdminSupabase: () => admin },
    '@/lib/env': { readCredential: key => ({ RESEND_API_KEY: 'test', RESEND_FROM_EMAIL: 'CLW <auth@example.com>', ALERT_EMAIL: 'owner@example.com' })[key] },
    '@/config/org.config': { ORG: { shortName: 'CLW', contactEmail: 'fallback@example.com' } },
    resend: { Resend: class { emails = { send: async (payload, opts) => {
      sends.push({ payload, opts })
      return sendFails ? { error: { name: 'RateLimit' } } : { data: { id: 'accepted-message' } }
    } } } },
  }, {}, logs, fetch, { crypto: require('node:crypto').webcrypto, TextEncoder })
  return { ...incidentModule, rows, sends, logs, recover: () => { sendFails = false } }
}

test('actual incident sender groups concurrent failures into one email with required diagnostics', async () => {
  const h = incidentsHarness()
  const input = { attemptId: incidentId, step: 'reset_link', email: 'parent@example.com', error: { code: 'otp_expired', message: 'Link expired', status: 403 } }
  await Promise.all([h.reportParentAuthFailure(input), h.reportParentAuthFailure(input)])
  assert.equal(h.rows.get(incidentId).occurrences, 2)
  assert.equal(h.sends.length, 1)
  assert.deepEqual(Array.from(h.sends[0].payload.to), ['owner@example.com'])
  for (const expected of ['parent@example.com', 'reset_link', 'otp_expired', 'Link expired', '2026-09-26T20:00:00Z', incidentId]) assert.ok(h.sends[0].payload.text.includes(expected))
  assert.doesNotMatch(JSON.stringify(h.logs), /parent@example.com/)
})

test('a confirmation link opened in another browser is recorded but never paged', async () => {
  const h = incidentsHarness()
  await h.reportParentAuthFailure({
    attemptId: incidentId, step: 'confirmation_link',
    error: { code: 'pkce_code_verifier_not_found', name: 'AuthPKCECodeVerifierMissingError', status: 400,
      message: 'PKCE code verifier not found in storage.' },
  })
  // Recorded with diagnostics intact, so volume is still countable in the table.
  assert.equal(h.rows.get(incidentId).occurrences, 1)
  assert.equal(h.rows.get(incidentId).first_step, 'confirmation_link')
  // But nobody is woken, and the retry sweep must not mail it later either.
  assert.equal(h.sends.length, 0)
  assert.equal(h.rows.get(incidentId).message_id, 'suppressed:self-healing')
  assert.ok(h.rows.get(incidentId).notified_at)
})

test('re-entering the password you already have is recorded but never paged', async () => {
  const h = incidentsHarness()
  await h.reportParentAuthFailure({
    attemptId: incidentId, step: 'password_save', email: 'parent@example.com',
    error: { code: 'same_password', name: 'AuthApiError', status: 422,
      message: 'New password should be different from the old password.' },
  })
  assert.equal(h.rows.get(incidentId).occurrences, 1)
  assert.equal(h.sends.length, 0)
  assert.equal(h.rows.get(incidentId).message_id, 'suppressed:self-healing')
})

test('a real password_save failure still pages', async () => {
  const h = incidentsHarness()
  await h.reportParentAuthFailure({
    attemptId: incidentId, step: 'password_save',
    error: { code: 'weak_password', message: 'Password is too short' },
  })
  assert.equal(h.sends.length, 1)
  assert.ok(h.sends[0].payload.text.includes('weak_password'))
})

test('a genuinely blocking failure on the same step still pages', async () => {
  const h = incidentsHarness()
  await h.reportParentAuthFailure({
    attemptId: incidentId, step: 'confirmation_link',
    error: { code: 'otp_expired', message: 'Email link is invalid or has expired' },
  })
  assert.equal(h.sends.length, 1)
  assert.ok(h.sends[0].payload.text.includes('otp_expired'))
})

test('failed alert delivery remains pending and retries with identical payload and idempotency key', async () => {
  const h = incidentsHarness({ sendFails: true })
  const input = { attemptId: incidentId, step: 'reset_link', error: { code: 'otp_expired' } }
  assert.equal((await h.reportParentAuthFailure(input)).recorded, false)
  assert.equal(h.rows.get(incidentId).notified_at, undefined)
  assert.equal(h.rows.get(incidentId).lease_until, null)
  h.recover()
  await h.reportParentAuthFailure({ ...input, step: 'password_save', error: { message: 'Second failure' }, email: 'later@example.com' })
  assert.deepEqual(h.sends[0].payload, h.sends[1].payload)
  assert.equal(h.sends[0].opts.idempotencyKey, h.sends[1].opts.idempotencyKey)
  assert.equal(h.rows.get(incidentId).latest_step, 'password_save')
  assert.equal(h.rows.get(incidentId).message_id, 'accepted-message')
})

test('reset recipient is available even when verification fails without a session', async () => {
  const h = incidentsHarness()
  await h.registerResetAttempt(incidentId, 'parent@example.com')
  await h.reportParentAuthFailure({ attemptId: incidentId, step: 'reset_link', error: { code: 'otp_expired' }, email: 'spoof@example.com' })
  assert.match(h.sends[0].payload.text, /parent@example.com/)
  assert.doesNotMatch(h.sends[0].payload.text, /spoof@example.com/)
})

test('rate-limited and unavailable incident storage cannot send uncontrolled emails or break auth', async () => {
  for (const options of [{ rateLimited: true }, { dbFails: true }]) {
    const h = incidentsHarness(options)
    const result = await h.reportParentAuthFailure({ attemptId: incidentId, step: 'family_setup', error: 'Failure' })
    assert.equal(result.recorded, false)
    assert.equal(h.sends.length, 0)
  }
})

test('diagnostics exclude token URLs, passwords, JWTs, and extra auth response fields', () => {
  const details = incidentPolicy.safeAuthError({
    message: 'Rejected https://example.com/#token=secret password=hunter2 token_hash=SECRET_TOKEN',
    code: 'otp_expired', access_token: 'SUPER_SECRET', password: 'SECOND_SECRET',
  })
  assert.equal(details.code, 'otp_expired')
  assert.doesNotMatch(JSON.stringify(details), /hunter2|SECRET|example.com/)
})

test('password form reports expired links and password saving failures at the correct step', async () => {
  for (const [options, step, code] of [
    [{ verifyError: { code: 'otp_expired', message: 'Token used' } }, 'reset_link', 'otp_expired'],
    [{ updateError: { code: 'weak_password', message: 'Password rejected' } }, 'password_save', 'weak_password'],
  ]) {
    const h = passwordForm(options)
    await h.ready().props.onSubmit({ preventDefault() {} })
    assert.equal(h.reports.length, 1)
    assert.equal(h.reports[0][0], step)
    assert.equal(h.reports[0][1].code, code)
    assert.doesNotMatch(JSON.stringify(h.reports), /Valid-password|test-token/)
  }
  const success = passwordForm()
  await success.ready().props.onSubmit({ preventDefault() {} })
  assert.equal(success.reports.length, 0)
})

test('middleware alerts on blocked authenticated parents, not normal logged-out visits or successful setup', async () => {
  const next = require('next/server')
  for (const scenario of ['missing_profile', 'logged_out', 'lost_session', 'success']) {
    const reports = [], tasks = []
    const user = ['missing_profile', 'success'].includes(scenario) ? { id: 'user', email: 'parent@example.com' } : null
    const session = {
      user, role: scenario === 'success' ? 'parent' : null, onboardingCompleted: false,
      ...(scenario === 'missing_profile' ? { accessError: { code: 'PGRST116', message: 'No profile row' } } : {}),
      sessionError: user ? null : { code: 'session_not_found', message: 'No session' },
    }
    const mod = load('src/middleware.ts', {
      'next/server': next,
      '@/lib/auth/session': { getSessionRole: async () => session, homeForRole: () => '/login' },
      '@/lib/supabase/middleware': { getSupabaseAndResponse: async () => ({ supabase: {}, response: next.NextResponse.next() }) },
      '@/lib/auth/incident-policy': incidentPolicy,
      '@/lib/auth/incidents': { linkAttemptId: async () => incidentId, reportParentAuthFailure: async input => reports.push(input) },
    })
    const request = new next.NextRequest('https://www.clwizards.com/onboarding', { headers: {
      cookie: 'clw_auth_attempt=' + incidentId + (scenario === 'lost_session' ? '; clw_auth_pending=1' : ''),
    } })
    await mod.middleware(request, { waitUntil: task => tasks.push(task) })
    await Promise.all(tasks)
    assert.equal(reports.length, ['missing_profile', 'lost_session'].includes(scenario) ? 1 : 0)
    if (reports.length) { assert.equal(reports[0].step, 'family_setup'); assert.equal(reports[0].attemptId, incidentId) }
    if (scenario === 'missing_profile') assert.equal(reports[0].email, 'parent@example.com')
  }
})

const transient = { name: 'AuthRetryableFetchError', status: 503, message: '{}' }
const generated = { data: { properties: { hashed_token: 'SECRET_RECOVERY_TOKEN' } }, error: null }
function harness(options = {}) {
  const logs = [], sends = [], generates = [], alerts = [], afterTasks = []
  const env = {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'captcha-enabled',
    RESEND_API_KEY: 'test-key', RESEND_FROM_EMAIL: 'CLW <auth@example.com>',
    NEXT_PUBLIC_SITE_URL: 'https://www.clwizards.com', ...options.env,
  }
  const route = load('src/app/api/auth/request-password-reset/route.ts', {
    'next/server': { NextResponse: Response, after: (task) => afterTasks.push(task) },
    '@/lib/env': { readCredential: (key) => env[key]?.trim() || undefined },
    '@/lib/cron-auth': { isAuthorizedCronRequest: (request) =>
      Boolean(env.CRON_SECRET) && request.headers.get('authorization') === `Bearer ${env.CRON_SECRET}` },
    '@/lib/alerts': { sendAlert: async (subject, context) => alerts.push({ subject, context }) },
    '@/lib/auth/recovery-errors': policy,
    '@/config/org.config': { ORG: { name: 'CLW' } },
    '@/lib/turnstile': { verifyTurnstileToken: async () => options.captcha ?? { ok: true } },
    '@/lib/supabase/admin': { createAdminSupabase: () => {
      if (options.clientError) throw options.clientError
      return { auth: { admin: { generateLink: async (input) => {
        generates.push(input)
        return options.generate ? options.generate(generates.length) : generated
      } } } }
    } },
    resend: { Resend: class { emails = { send: async (payload, opts) => {
      sends.push({ payload, opts })
      return options.send ? options.send(sends.length) : { data: { id: 'provider-message-id' }, error: null }
    } } } },
  }, env, logs)
  return { logs, sends, generates, alerts, afterTasks, post: (body = { email: ' Parent@Example.com ', turnstileToken: 'captcha' }, headers = {}) =>
    route.POST(new Request('https://www.clwizards.com/api/auth/request-password-reset', {
      method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...headers },
    })) }
}

test('successful send preserves callback, normalizes email and logs provider receipt without secrets', async () => {
  const h = harness()
  const res = await h.post()
  assert.equal(res.status, 200)
  assert.equal((await res.json()).ok, true)
  assert.equal(h.generates[0].email, 'parent@example.com')
  assert.match(h.sends[0].payload.html, /https:\/\/www.clwizards.com\/update-password#recovery_token=SECRET_RECOVERY_TOKEN/)
  assert.match(JSON.stringify(h.logs), /provider-message-id/)
  assert.doesNotMatch(JSON.stringify(h.logs), /SECRET_RECOVERY_TOKEN|parent@example.com|test-key/)
})
test('a Supabase transient {} failure is retried before sending', async () => {
  const h = harness({ generate: (n) => n < 3 ? { error: transient } : generated })
  assert.equal((await h.post()).status, 200)
  assert.equal(h.generates.length, 3)
  assert.equal(h.sends.length, 1)
})
test('persistent upstream failure is 503, never fake success, and logs status/stage', async () => {
  const h = harness({ generate: () => ({ error: transient }) })
  const res = await h.post()
  assert.equal(res.status, 503)
  assert.equal(res.headers.get('Retry-After'), '60')
  assert.equal((await res.json()).ok, undefined)
  assert.equal(h.sends.length, 0)
  assert.equal(h.generates.length, 3)
  assert.match(JSON.stringify(h.logs), /generate-link.*AuthRetryableFetchError.*503/)
  await Promise.all(h.afterTasks.map((task) => task()))
  assert.equal(h.alerts[0].context.stage, 'generate-link')
})
test('invalid credentials are not retried or suppressed', async () => {
  const h = harness({ generate: () => ({ error: { name: 'AuthApiError', status: 401 } }) })
  assert.equal((await h.post()).status, 503)
  assert.equal(h.generates.length, 1)
})
test('unknown account remains enumeration-safe', async () => {
  const h = harness({ generate: () => ({ error: { code: 'user_not_found', status: 404 } }) })
  assert.equal((await h.post()).status, 200)
  assert.equal(h.sends.length, 0)
  assert.equal(h.logs.length, 0)
  assert.equal(h.alerts.length, 0)
  await Promise.all(h.afterTasks.map((task) => task()))
  assert.equal(h.alerts.length, 0)
})
test('empty token response fails rather than claiming email was sent', async () => {
  const h = harness({ generate: () => ({ data: { properties: {} } }) })
  assert.equal((await h.post()).status, 503)
  assert.equal(h.sends.length, 0)
})
test('email retry keeps the same token, payload and idempotency key', async () => {
  const h = harness({ send: (n) => n === 1 ? { error: { name: 'application_error' } } : { data: { id: 'accepted' } } })
  assert.equal((await h.post()).status, 200)
  assert.equal(h.generates.length, 1)
  assert.equal(h.sends.length, 2)
  assert.equal(JSON.stringify(h.sends[0].payload), JSON.stringify(h.sends[1].payload))
  assert.equal(h.sends[0].opts.idempotencyKey, h.sends[1].opts.idempotencyKey)
})
test('rejected mail is not reported as success or retried needlessly', async () => {
  const h = harness({ send: () => ({ error: { name: 'validation_error', statusCode: 403 } }) })
  assert.equal((await h.post()).status, 503)
  assert.equal(h.sends.length, 1)
})
test('network exceptions during generation and email send are retried', async () => {
  const h = harness({
    generate: (n) => { if (n === 1) throw new TypeError('fetch failed'); return generated },
    send: (n) => { if (n === 1) throw new TypeError('fetch failed'); return { data: { id: 'accepted' } } },
  })
  assert.equal((await h.post()).status, 200)
  assert.equal(h.generates.length, 2)
  assert.equal(h.sends.length, 2)
})
test('missing key, sender and client configuration fail visibly', async () => {
  for (const options of [{ env: { RESEND_API_KEY: '' } }, { env: { RESEND_FROM_EMAIL: '' } }, { clientError: new Error('config') }]) {
    const h = harness(options)
    assert.equal((await h.post()).status, 503)
    assert.equal(h.sends.length, 0)
  }
})
test('invalid input cannot reach auth or send mail', async () => {
  for (const body of [null, { email: 42 }, { email: 'bad' }, { email: 'valid@example.com' }]) {
    const h = harness()
    assert.equal((await h.post(body)).status, 400)
    assert.equal(h.generates.length, 0)
  }
})
test('captcha rejection is different from captcha service failure', async () => {
  const rejected = harness({ captcha: { ok: false, reason: 'rejected', errorCodes: ['timeout-or-duplicate'] } })
  assert.equal((await rejected.post()).status, 400)
  const unavailable = harness({ captcha: { ok: false, reason: 'rejected', errorCodes: ['request-failed'] } })
  assert.equal((await unavailable.post()).status, 503)
  assert.equal(unavailable.generates.length, 0)
})
test('login never renders {} and distinguishes temporary outages from credentials', () => {
  assert.match(policy.signInErrorMessage(transient), /temporarily unavailable/)
  assert.match(policy.signInErrorMessage({ message: '{}' }), /temporarily unavailable/)
  assert.match(policy.signInErrorMessage({ code: 'invalid_credentials', message: 'Invalid' }), /email or password is incorrect/)
})

test('the installed Resend SDK forwards timeout and idempotency options to fetch', async () => {
  const { Resend } = require('resend')
  const originalFetch = global.fetch
  let observed
  try {
    global.fetch = async (_url, options) => {
      observed = options
      return Response.json({ id: 'accepted' })
    }
    const signal = AbortSignal.timeout(5000)
    await new Resend('test-key').emails.send({ from: 'test@example.com', to: 'parent@example.com', subject: 'Test', text: 'Test' }, { idempotencyKey: 'test-key', signal })
    assert.equal(observed.signal, signal)
    assert.equal(observed.headers.get('Idempotency-Key'), 'test-key')
  } finally {
    global.fetch = originalFetch
  }
})

function callbackHarness(authError) {
  const calls = []
  const callback = load('src/app/auth/callback/route.ts', {
    'next/server': require('next/server'),
    '@/lib/supabase/server': { createServerSupabase: async () => ({ auth: {
      verifyOtp: async (args) => { calls.push(args); return { error: authError } },
      exchangeCodeForSession: async (code) => { calls.push(code); return { error: authError } },
    } }) },
  })
  return { calls, get: (query) => {
    const nextUrl = new URL(`https://www.clwizards.com/auth/callback?${query}`)
    nextUrl.clone = () => new URL(nextUrl)
    return callback.GET({ nextUrl })
  } }
}
test('recovery token reaches password screen, not homepage', async () => {
  const h = callbackHarness(null)
  const res = await h.get('token_hash=test-token&type=recovery&next=%2Fupdate-password')
  assert.equal(res.headers.get('location'), 'https://www.clwizards.com/update-password#recovery_token=test-token')
  assert.equal(h.calls.length, 0)
  assert.equal(res.headers.get('Cache-Control'), 'no-store')
})
test('legacy PKCE links still reach password screen', async () => {
  const h = callbackHarness(null)
  assert.equal((await h.get('code=legacy-code')).headers.get('location'), 'https://www.clwizards.com/update-password')
  assert.equal(h.calls[0], 'legacy-code')
})
test('scanner and repeated GET visits never consume even an expired token', async () => {
  const h = callbackHarness({ code: 'otp_expired' })
  for (let i = 0; i < 5; i++) {
    assert.equal((await h.get('token_hash=old&type=recovery')).headers.get('location'), 'https://www.clwizards.com/update-password#recovery_token=old')
  }
  assert.equal(h.calls.length, 0)
})
test('callback rejects missing tokens and external redirects', async () => {
  const h = callbackHarness(null)
  assert.equal((await h.get('')).headers.get('location'), 'https://www.clwizards.com/update-password?error=invalid-link')
  assert.equal((await h.get('token_hash=test&type=recovery&next=https://evil.example')).headers.get('location'), 'https://www.clwizards.com/update-password#recovery_token=test')
})

test('scheduled canary bypasses CAPTCHA only for the exact configured account and valid cron secret', async () => {
  const h = harness({ env: { PASSWORD_RESET_CANARY_EMAIL: 'canary@example.com', CRON_SECRET: 'cron-secret' } })
  const authorized = await h.post({ email: 'canary@example.com' }, { Authorization: 'Bearer cron-secret' })
  assert.equal(authorized.status, 200)
  assert.equal((await authorized.json()).messageId, 'provider-message-id')
  assert.equal(h.sends.length, 1)
  const missingSecret = await h.post({ email: 'canary@example.com' })
  assert.equal(missingSecret.status, 400)
  const differentAccount = await h.post({ email: 'another@example.com' }, { Authorization: 'Bearer cron-secret' })
  assert.equal(differentAccount.status, 400)
  assert.equal(h.sends.length, 1)
})

// Run the actual password form with deterministic hook state and mocked auth.
// This tests user events, not just source text or a copy of the implementation.
function passwordForm(options = {}) {
  const states = [], effects = [], calls = [], navigations = [], reports = []
  let cursor = 0
  const window = { location: { hash: '#recovery_token=test-token' }, history: {
    replaceState: (_state, _title, url) => { window.location.hash = ''; navigations.push(url) },
  } }
  const react = {
    ...require('react'),
    useState: (initial) => {
      const index = cursor++
      if (!(index in states)) states[index] = initial
      return [states[index], (value) => { states[index] = value }]
    },
    useRef: (value) => {
      const index = cursor++
      if (!(index in states)) states[index] = { current: value }
      return states[index]
    },
    useEffect: (effect) => { const index = cursor++; if (!(index in states)) { states[index] = true; effects.push(effect) } },
  }
  const mocks = {
    '@/lib/auth/report-client': { authAttempt: () => 'test', reportClientAuthFailure: async (...args) => reports.push(args) },
    react,
    'next/navigation': { useRouter: () => ({ replace: (url) => navigations.push(url) }), useSearchParams: () => new URLSearchParams() },
    '@/lib/supabase/browser': { createBrowserSupabase: () => ({ auth: {
      getUser: async () => { calls.push('getUser'); return { data: { user: null } } },
      verifyOtp: async (args) => { calls.push(['verify', args]); return { error: options.verifyError ?? null } },
      updateUser: async (args) => { calls.push(['update', args]); return { error: options.updateError ?? null } },
      signOut: async () => { calls.push('signOut'); return { error: null } },
    } }) },
  }
  for (const [file, names] of Object.entries({
    button: ['Button'], input: ['Input'], label: ['Label'],
    card: ['Card', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle'],
    alert: ['Alert', 'AlertDescription'],
  })) mocks[`@/components/ui/${file}`] = Object.fromEntries(names.map((name) => [name, name]))
  mocks['@/components/layout/AuthBrand'] = { AuthBrand: 'AuthBrand' }
  const page = load('src/app/update-password/page.tsx', mocks, {}, [], fetch, { window, URLSearchParams })
  const component = page.default().props.children.type
  function render() { cursor = 0; return component() }
  function nodes(node) {
    if (!node || typeof node !== 'object') return []
    if (Array.isArray(node)) return node.flatMap(nodes)
    return [node, ...nodes(node.props?.children)]
  }
  render()
  effects.forEach((effect) => effect())
  function ready() {
    const inputs = nodes(render()).filter((node) => node.type === 'Input')
    inputs.forEach((node) => node.props.onChange({ target: { value: 'Valid-password-123!' } }))
    return nodes(render()).find((node) => node.type === 'form')
  }
  return { calls, navigations, reports, render, ready, nodes }
}
test('opening and rendering password form never verifies or consumes the token', () => {
  const h = passwordForm()
  for (let i = 0; i < 5; i++) h.render()
  assert.deepEqual(h.calls, [])
})
test('explicit password submission verifies once, updates password, and returns to login', async () => {
  const h = passwordForm()
  const form = h.ready()
  await Promise.all([form.props.onSubmit({ preventDefault() {} }), form.props.onSubmit({ preventDefault() {} })])
  assert.equal(h.calls.filter((call) => call[0] === 'verify').length, 1)
  assert.equal(h.calls[0][1].type, 'recovery')
  assert.equal(h.calls[1][0], 'update')
  assert.equal(h.calls[2], 'signOut')
  assert.equal(h.navigations.at(-1), '/login?reset=success')
})
test('expired token never updates a password or reports success', async () => {
  const h = passwordForm({ verifyError: { code: 'otp_expired' } })
  await h.ready().props.onSubmit({ preventDefault() {} })
  assert.equal(h.calls.length, 1)
  assert.equal(h.navigations.length, 0)
  assert.equal(h.nodes(h.render()).filter((node) => node.type === 'Input').length, 0)
})
test('password rejection can be retried without consuming the token again', async () => {
  const h = passwordForm({ updateError: { message: 'Password rejected' } })
  await h.ready().props.onSubmit({ preventDefault() {} })
  await h.ready().props.onSubmit({ preventDefault() {} })
  assert.equal(h.calls.filter((call) => call[0] === 'verify').length, 1)
  assert.equal(h.calls.filter((call) => call[0] === 'update').length, 2)
  assert.equal(h.navigations.includes('/login?reset=success'), false)
})

const signupRouting = load('src/lib/auth/signup-routing.ts', {})
test('old signup emails landing on home are routed to confirmation without exposing fragments', () => {
  assert.equal(signupRouting.signupLandingTarget('?code=signup-code', ''), '/auth/confirm?code=signup-code&next=%2Fdashboard')
  assert.equal(signupRouting.signupLandingTarget('', '#type=signup&access_token=secret'), '/login?confirmation=complete&redirectTo=%2Fdashboard')
  assert.equal(signupRouting.signupLandingTarget('', '#error=access_denied'), '/login?confirmation=retry&redirectTo=%2Fdashboard')
  assert.equal(signupRouting.signupLandingTarget('?donation=success', ''), null)
  assert.equal(signupRouting.signupLandingTarget('', '#type=recovery'), null)
})
test('signup confirmation supports same-browser, cross-browser, duplicate and invalid links', async () => {
  for (const [query, error, expected] of [
    ['code=valid', null, '/dashboard'],
    ['code=valid&next=%2Fregistration', null, '/registration'],
    ['code=valid&next=https://evil.example', null, '/dashboard'],
    ['code=valid&next=%2F%5Cevil.example', null, '/dashboard'],
    ['code=other-browser', { code: 'flow_state_not_found' }, '/login?redirectTo=%2Fdashboard&confirmation=retry'],
    ['code=used', { code: 'invalid_grant' }, '/login?redirectTo=%2Fdashboard&confirmation=retry'],
    ['', null, '/login?redirectTo=%2Fdashboard&confirmation=retry'],
    ['error=access_denied', null, '/login?redirectTo=%2Fdashboard&confirmation=retry'],
  ]) {
    const route = load('src/app/auth/confirm/route.ts', {
      'next/server': require('next/server'),
      '@/lib/auth/signup-routing': signupRouting,
      '@/lib/supabase/server': { createServerSupabase: async () => ({ auth: { exchangeCodeForSession: async () => ({ error }) } }) },
    })
    const response = await route.GET({ nextUrl: new URL(`https://www.clwizards.com/auth/confirm?${query}`) })
    assert.equal(response.headers.get('location'), `https://www.clwizards.com${expected}`)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
  }
})

function recoveryAudit(emails, options = {}) {
  const now = Date.parse('2026-09-26T12:00:00Z')
  const calls = []
  const fetched = async (url, request) => {
    calls.push({ url: String(url), request })
    return options.response ?? Response.json({ data: emails, has_more: false })
  }
  const audit = load('src/lib/auth/recovery-audit.ts', {
    '@/lib/env': { readCredential: (key) => ({
      RESEND_AUDIT_API_KEY: 'test-provider-key', PASSWORD_RESET_CANARY_EMAIL: 'canary@example.com', ...options.env,
    })[key] },
  }, {}, [], fetched)
  return { now, calls, audit }
}

const mail = (last_event, to = 'canary@example.com', created_at = '2026-09-26T11:00:00Z') => ({
  id: 'message-id', to: [to], subject: 'Reset your password', created_at, last_event,
})
test('a canary delivered by Resend makes the independent audit healthy', async () => {
  const h = recoveryAudit([mail('delivered')])
  assert.equal((await h.audit.auditPasswordRecovery(h.now)).ok, true)
  assert.equal(h.calls.length, 1)
  assert.equal(h.calls[0].request.headers.Authorization, 'Bearer test-provider-key')
})
test('sent, bounced or suppressed messages trigger the recovery alarm', async () => {
  for (const status of ['sent', 'bounced', 'suppressed', 'failed']) {
    const h = recoveryAudit([mail(status)])
    assert.equal((await h.audit.auditPasswordRecovery(h.now)).ok, false, status)
  }
})
test('one delivered canary does not hide a parent email that failed', async () => {
  const h = recoveryAudit([mail('delivered'), mail('bounced', 'parent@example.com')])
  assert.equal((await h.audit.auditPasswordRecovery(h.now)).reason, 'delivery-bounced')
})
test('no canary, missing configuration, or provider outage fail closed', async () => {
  assert.equal((await recoveryAudit([]).audit.auditPasswordRecovery(Date.parse('2026-09-26T12:00:00Z'))).reason, 'canary-missing')
  const missing = recoveryAudit([], { env: { PASSWORD_RESET_CANARY_EMAIL: '' } })
  assert.equal((await missing.audit.auditPasswordRecovery(missing.now)).reason, 'configuration-missing')
  const outage = recoveryAudit([], { response: new Response('down', { status: 503 }) })
  assert.equal((await outage.audit.auditPasswordRecovery(outage.now)).reason, 'provider-503')
})

test('cron must authorize before generating a token', async () => {
  let sent = 0
  const env = { CRON_SECRET: 'cron-secret', PASSWORD_RESET_CANARY_EMAIL: 'canary@example.com' }
  const cron = load('src/app/api/crons/password-reset-canary/route.ts', {
    'next/server': { NextResponse: Response },
    '@/lib/cron-auth': { isAuthorizedCronRequest: (request) => request.headers.get('authorization') === 'Bearer cron-secret' },
    '@/lib/env': { readCredential: (key) => env[key] },
    '@/app/api/auth/request-password-reset/route': { POST: async () => { sent++; return Response.json({ ok: true, messageId: 'message-id' }) } },
  })
  assert.equal((await cron.GET(new Request('https://www.clwizards.com/api/crons/password-reset-canary'))).status, 401)
  assert.equal(sent, 0)
  assert.equal((await cron.GET(new Request('https://www.clwizards.com/api/crons/password-reset-canary', {
    headers: { Authorization: 'Bearer cron-secret' },
  }))).status, 200)
  assert.equal(sent, 1)
})

test('owner alert reports a provider rejection rather than swallowing it', async () => {
  const logs = []
  const alert = load('src/lib/alerts.ts', {
    resend: { Resend: class { emails = { send: async () => ({ data: null, error: { name: 'validation_error' } }) } } },
    '@/config/org.config': { ORG: { shortName: 'CLW', contactEmail: 'club@example.com' } },
  }, { RESEND_API_KEY: 'test-provider-key', RESEND_FROM_EMAIL: 'CLW <auth@example.com>' }, logs)
  await alert.sendAlert('Recovery failed', { requestId: 'test-id' })
  assert.match(JSON.stringify(logs), /Provider rejected alert email.*validation_error/)
})

// Family setup: imported families arrive with wrestlers already on file. The
// action must add only children who are not, and must be safe to submit twice.
function onboardingHarness(onFile) {
  const inserts = []
  const updates = []
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'parent-1' } } }) },
    from: () => ({
      select: () => ({ eq: async () => ({ data: onFile, error: null }) }),
      insert: async (rows) => { inserts.push(rows); onFile.push(...rows); return { error: null } },
      update: (values) => ({ eq: async () => { updates.push(values); return { error: null } } }),
    }),
  }
  const schema = load('src/lib/registration-schema.ts', { '@/config/org.config': { ORG: { practiceGroups: ['Group A', 'Group B'] } } })
  const actions = load('src/app/onboarding/actions.ts', {
    'next/cache': { revalidatePath: () => {} },
    '@/lib/supabase/server': { createServerSupabase: async () => client },
    '@/lib/supabase/admin': { createAdminSupabase: () => ({}) },
    '@/lib/twilio/opt-in': { SMS_CONSENT_TEXT: 'consent' },
    '@/lib/registration-schema': schema,
  })
  return { actions, inserts, updates }
}
const kid = (first, last, dob = '2015-04-02') => ({ first_name: first, last_name: last, date_of_birth: dob, practice_group: 'Group A' })

test('family setup does not re-add a child the club already has on file', async () => {
  const h = onboardingHarness([{ first_name: 'Sam', last_name: 'Ortiz' }])
  // Different case, stray spaces and a different birth date: still the same child.
  const result = await h.actions.completeOnboarding({ phone: '', smsOptIn: false, athletes: [kid(' sam ', 'ORTIZ', '2015-09-30')] })
  assert.equal(result.ok, true)
  assert.equal(h.inserts.length, 0)
  assert.ok(h.updates[0].onboarding_completed_at)
})

test('family setup with wrestlers on file can finish without adding anyone', async () => {
  const h = onboardingHarness([{ first_name: 'Sam', last_name: 'Ortiz' }])
  const result = await h.actions.completeOnboarding({ phone: '', smsOptIn: false, athletes: [] })
  assert.equal(result.ok, true)
  assert.equal(h.inserts.length, 0)
  assert.ok(h.updates[0].onboarding_completed_at)
})

test('family setup still adds a sibling who is not on file', async () => {
  const h = onboardingHarness([{ first_name: 'Sam', last_name: 'Ortiz' }])
  await h.actions.completeOnboarding({ phone: '', smsOptIn: false, athletes: [kid('Sam', 'Ortiz'), kid('Ana', 'Ortiz')] })
  assert.equal(h.inserts.length, 1)
  assert.deepEqual(h.inserts[0].map((row) => row.first_name), ['Ana'])
})

test('a new family must still add at least one wrestler', async () => {
  const h = onboardingHarness([])
  const result = await h.actions.completeOnboarding({ phone: '', smsOptIn: false, athletes: [] })
  assert.equal(result.ok, false)
  assert.match(result.error, /at least one athlete/)
  assert.equal(h.updates.length, 0)
})

test('submitting family setup twice creates each child once', async () => {
  const h = onboardingHarness([])
  const values = { phone: '', smsOptIn: false, athletes: [kid('Lee', 'Park'), kid('lee', 'park')] }
  await h.actions.completeOnboarding(values)
  await h.actions.completeOnboarding(values)
  assert.equal(h.inserts.length, 1)
  assert.equal(h.inserts[0].length, 1)
})

test('sign-up and password-save failures never show provider internals', () => {
  assert.doesNotMatch(policy.signUpErrorMessage({ code: 'unexpected_failure', status: 500, message: 'gomail: could not send email 1: gomail: invalid address' }), /gomail/)
  assert.match(policy.signUpErrorMessage({ code: 'unexpected_failure', status: 500, message: 'gomail' }), /typos/)
  assert.match(policy.signUpErrorMessage({ code: 'over_email_send_rate_limit', status: 429, message: 'email rate limit exceeded' }), /Too many attempts/)
  assert.match(policy.signUpErrorMessage({ code: 'captcha_failed', message: 'captcha protection: request disallowed' }), /security check expired/)
  assert.match(policy.signUpErrorMessage({ code: 'weak_password', message: 'Password should be at least 8 characters.' }), /at least 8 characters/)
  assert.match(policy.passwordSaveErrorMessage({ name: 'AuthSessionMissingError', message: 'Auth session missing!' }), /reset session has ended/)
  assert.doesNotMatch(policy.passwordSaveErrorMessage({ code: 'unexpected_failure', message: 'pq: relation does not exist' }), /pq:/)
  assert.match(policy.signInErrorMessage({ code: 'invalid_credentials', message: 'Invalid' }), /never chosen a password/)
})

test('redirect targets that leave the site are refused', () => {
  for (const hostile of ['/\\evil.example', '/\\/evil.example', '//evil.example', '/\t/evil.example', '/\n/evil.example',
    'https://evil.example', 'javascript:alert(1)', 'evil.example', '', null, undefined]) {
    assert.equal(safePath.safeInternalPath(hostile), null, `accepted ${JSON.stringify(hostile)}`)
  }
  assert.equal(safePath.safeInternalPath('/dues'), '/dues')
  assert.equal(safePath.safeInternalPath('/registration?step=2#pay'), '/registration?step=2#pay')
  assert.equal(safePath.safeInternalPath('/athletes/new?redirectTo=%2Fregistration'), '/athletes/new?redirectTo=%2Fregistration')
})

test('phone numbers are stored in one form and sent to SMS as E.164', () => {
  const phone = load('src/lib/phone.ts', {})
  for (const typed of ['8155551234', '815-555-1234', '(815) 555-1234', '815 555 1234', '815-5551234', '18155551234', '+18155551234', ' 815.555.1234 ']) {
    assert.equal(phone.normalizeUsPhone(typed), '8155551234', typed)
    assert.equal(phone.toE164(typed), '+18155551234', typed)
  }
  // Not recognisably a US number: kept as typed so a person can fix it, never sent.
  assert.equal(phone.normalizeUsPhone('555123'), '555123')
  assert.equal(phone.toE164('555123'), null)
  assert.equal(phone.toE164('28155551234'), null)
  assert.equal(phone.normalizeUsPhone('   '), null)
  assert.equal(phone.normalizeUsPhone(null), null)
})

// Shared wrestlers: a co-guardian on a club-locked link sees the wrestler but
// registers, edits and withdraws nothing; a normal link manages as before.
const familyLib = load('src/lib/family.ts', {})
function linksClient(links) {
  return { from: () => ({ select: () => ({ eq: async () => ({ data: links, error: null }) }) }) }
}
const shared = { id: 'brody', parent_id: 'jim' }
const ownKid = { id: 'beckham', parent_id: 'karley' }

test('a wrestler reached only through a locked link is read-only, own wrestlers are not', async () => {
  const links = [{ owner_id: 'jim', athlete_ids: ['brody'], locked: true }]
  const readOnly = await familyLib.resolveReadOnlyAthleteIds(linksClient(links), 'karley', [shared, ownKid])
  assert.deepEqual([...readOnly], ['brody'])
})

test('an unlocked link manages the wrestlers it covers and nothing else', async () => {
  const whole = await familyLib.resolveReadOnlyAthleteIds(linksClient([{ owner_id: 'jim', athlete_ids: null, locked: false }]), 'karley', [shared])
  assert.equal(whole.size, 0)
  const other = { id: 'sibling', parent_id: 'jim' }
  const limited = await familyLib.resolveReadOnlyAthleteIds(linksClient([{ owner_id: 'jim', athlete_ids: ['brody'], locked: false }]), 'karley', [shared, other])
  assert.deepEqual([...limited], ['sibling'])
})

// Add a wrestler: checks the whole family a parent can see, not only their own
// account, so a co-guardian cannot create a second copy of a shared child.
function addAthleteHarness(roster) {
  const inserts = []
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'guardian-1' } } }) },
    from: (table) => table === 'family_guardians'
      ? { select: () => ({ eq: async () => ({ data: [{ owner_id: 'owner-1' }], error: null }) }) }
      : {
          select: () => ({ in: async (_col, ids) => ({ data: roster.filter((r) => ids.includes(r.parent_id)), error: null }) }),
          insert: async (row) => { inserts.push(row); return { error: null } },
        },
  }
  const schema = load('src/lib/registration-schema.ts', { '@/config/org.config': { ORG: { practiceGroups: ['Group A', 'Group B'] } } })
  const actions = load('src/app/(portal)/athletes/actions.ts', {
    'next/cache': { revalidatePath: () => {} },
    '@/lib/supabase/server': { createServerSupabase: async () => client },
    '@/lib/registration-schema': schema,
    '@/lib/family': load('src/lib/family.ts', {}),
  })
  return { actions, inserts }
}

test('a co-guardian cannot add a child already on the family roster', async () => {
  const h = addAthleteHarness([{ parent_id: 'owner-1', first_name: 'Rowan', last_name: 'Saldarriaga' }])
  const result = await h.actions.addAthlete(kid(' rowan ', 'SALDARRIAGA'))
  assert.equal(result.ok, false)
  assert.match(result.error, /Rowan Saldarriaga is already on your family's roster/)
  assert.equal(h.inserts.length, 0)
})

test('adding a new sibling still works for a co-guardian', async () => {
  const h = addAthleteHarness([{ parent_id: 'owner-1', first_name: 'Rowan', last_name: 'Saldarriaga' }])
  const result = await h.actions.addAthlete(kid('Mila', 'Saldarriaga'))
  assert.equal(result.ok, true)
  assert.equal(h.inserts.length, 1)
  assert.equal(h.inserts[0].parent_id, 'guardian-1')
})

// Communications: picking an event fills in its details in plain words.
const eventLib = load('src/lib/comms/event-message.ts', {})

test('an event message names the day, time range and place', () => {
  const draft = eventLib.eventMessage({
    id: 'e1', title: 'Facility Cleaning', date: '2026-10-10', start_time: '09:00', end_time: '12:30',
    location: 'Wizards Wrestling Room', notes: 'Bring gloves.',
  })
  assert.equal(draft.subject, 'Facility Cleaning: Saturday, October 10')
  assert.equal(draft.body, 'Facility Cleaning\nWhen: Saturday, October 10, 9:00 AM – 12:30 PM\nWhere: Wizards Wrestling Room\n\nBring gloves.')
})

test('an event message leaves out what the event does not have', () => {
  const draft = eventLib.eventMessage({ id: 'e2', title: 'Parent Meeting', date: '2026-10-14', start_time: '18:30', end_time: null, location: null, notes: null })
  assert.equal(draft.body, 'Parent Meeting\nWhen: Wednesday, October 14, 6:30 PM')
})

// Site menu: the club's temporary link may only point somewhere safe.
const registry = load('src/lib/content/registry.ts', {})

test('the menu link accepts site pages and https addresses only', () => {
  assert.equal(registry.safeMenuHref('/events'), '/events')
  assert.equal(registry.safeMenuHref(' https://example.org/fundraiser '), 'https://example.org/fundraiser')
  for (const bad of ['', 'http://example.org', '//evil.example', 'javascript:alert(1)', 'example.org', '/\\evil']) {
    assert.equal(registry.safeMenuHref(bad), null, bad)
  }
})

test('the same child is recognised despite punctuation, spacing, case and accents', () => {
  const k = childKeyLib.sameChildKey
  assert.equal(k('Tre’Lyn', 'Morrow'), k('TreLyn', 'morrow'))
  assert.equal(k("Tre'Lyn", 'Morrow'), k('trelyn', 'MORROW '))
  assert.equal(k('Brayden', 'Mc Knight'), k('Brayden', 'McKnight'))
  assert.equal(k('José', 'Peña'), k('Jose', 'Pena'))
  assert.notEqual(k('Ceci', 'Nieves'), k('Cecilia', 'Nieves'))
  assert.notEqual(k('Kevin', 'Brogan'), k('Luke', 'Brogan'))
})

test('family setup skips a child already on file under different punctuation', async () => {
  const h = onboardingHarness([{ first_name: 'Tre’Lyn', last_name: 'Morrow' }])
  const result = await h.actions.completeOnboarding({ phone: '', smsOptIn: false, athletes: [kid('TreLyn', 'Morrow')] })
  assert.equal(result.ok, true)
  assert.equal(h.inserts.length, 0)
})

// Registrations: an admin may approve without the USA Wrestling card check.
// The override is recorded with who and when; the note is optional; dues and
// the waiver are still required.
function reviewHarness({ card = null, duesStatus = 'paid', signed = true } = {}) {
  const updates = []
  const tableData = {
    season_enrollments: { id: 'enr-1', status: 'submitted', season_registration_id: 'season-1', athlete_id: 'ath-1', parent_id: 'par-1', dues_payment_id: 'dues-1', usa_card_document_id: card ? 'card-1' : null },
    season_registrations: { id: 'season-1', require_usa_card: true, dues_amount_cents: 30000, season_label: '26-27' },
    athletes: { first_name: 'Sam', last_name: 'Ortiz' },
    profiles: { full_name: 'Pat Ortiz', email: null },
    dues_payments: { status: duesStatus },
    athlete_documents: card,
  }
  const listData = {
    disclosures: [{ id: 'waiver', title: 'Program waiver' }],
    disclosure_acceptances: signed ? [{ disclosure_id: 'waiver' }] : [],
  }
  function chain(table) {
    const q = {
      select: () => q, eq: () => q, in: () => q, limit: () => q,
      single: async () => ({ data: tableData[table], error: null }),
      maybeSingle: async () => ({ data: tableData[table], error: null }),
      update: (values) => { updates.push({ table, values }); return { eq: async () => ({ error: null }) } },
      then: (resolve) => resolve({ data: listData[table] ?? [], error: null }),
    }
    return q
  }
  const server = {
    auth: { getUser: async () => ({ data: { user: { id: 'tony' } } }) },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'admin' } }) }) }) }),
  }
  const actions = load('src/app/admin/registrations/actions.ts', {
    'next/cache': { revalidatePath: () => {} },
    resend: { Resend: class {} },
    '@/lib/supabase/server': { createServerSupabase: async () => server },
    '@/lib/supabase/admin': { createAdminSupabase: () => ({ from: chain }) },
    '@/config/org.config': { ORG: { domain: 'example.org', shortName: 'CLW', name: 'Club' } },
  })
  return { actions, updates }
}

test('approval still requires a verified card unless the admin overrides it', async () => {
  const h = reviewHarness()
  const result = await h.actions.reviewSeasonEnrollment({ enrollmentId: '11111111-1111-4111-a111-111111111111', status: 'approved' })
  assert.equal(result.ok, false)
  assert.match(result.error, /Verify the current-season USA Wrestling card/)
  assert.equal(h.updates.length, 0)
})

test('approving without the card check records who and when, with no note needed', async () => {
  const h = reviewHarness()
  const result = await h.actions.reviewSeasonEnrollment({ enrollmentId: '11111111-1111-4111-a111-111111111111', status: 'approved', overrideCard: true })
  assert.equal(result.ok, true)
  const { values } = h.updates.find((u) => u.table === 'season_enrollments')
  assert.equal(values.status, 'approved')
  assert.equal(values.card_override_by, 'tony')
  assert.ok(values.card_override_at)
  assert.equal(values.card_override_at, values.reviewed_at)
  assert.equal(values.card_override_note, null)
  assert.equal(values.admin_note, null)
})

test('the override keeps an optional note and never skips dues or the waiver', async () => {
  const withNote = reviewHarness()
  await withNote.actions.reviewSeasonEnrollment({ enrollmentId: '11111111-1111-4111-a111-111111111111', status: 'approved', overrideCard: true, overrideNote: ' Checked USAW lookup ' })
  assert.equal(withNote.updates.find((u) => u.table === 'season_enrollments').values.card_override_note, 'Checked USAW lookup')

  const unpaid = reviewHarness({ duesStatus: 'pending' })
  const r1 = await unpaid.actions.reviewSeasonEnrollment({ enrollmentId: '11111111-1111-4111-a111-111111111111', status: 'approved', overrideCard: true })
  assert.equal(r1.ok, false)
  assert.match(r1.error, /dues must be paid or waived/)

  const unsigned = reviewHarness({ signed: false })
  const r2 = await unsigned.actions.reviewSeasonEnrollment({ enrollmentId: '11111111-1111-4111-a111-111111111111', status: 'approved', overrideCard: true })
  assert.equal(r2.ok, false)
  assert.match(r2.error, /Program waiver/)
})

test('a normal approval with a verified card records no override', async () => {
  const h = reviewHarness({ card: { id: 'card-1', verified: true } })
  const result = await h.actions.reviewSeasonEnrollment({ enrollmentId: '11111111-1111-4111-a111-111111111111', status: 'approved' })
  assert.equal(result.ok, true)
  assert.equal('card_override_by' in h.updates.find((u) => u.table === 'season_enrollments').values, false)
})

// Messages to families missing documents: read the uploads, honour "on file".
function recipientsHarness({ athletes, docs, season = { registration_open_date: '2026-08-01' } }) {
  const tables = {
    athletes: athletes,
    athlete_documents: docs,
    profiles: [...new Set(athletes.map((a) => a.parent_id))].map((id) => ({ id, is_active: true })),
  }
  let profileFilter = null
  function chain(table) {
    const q = {
      select: () => q, eq: () => q, order: () => q, limit: () => q,
      in: (_col, ids) => { if (table === 'profiles') profileFilter = ids; return q },
      maybeSingle: async () => ({ data: table === 'season_registrations' ? season : null, error: null }),
      then: (resolve) => resolve({ data: table === 'profiles' ? tables.profiles.filter((p) => profileFilter.includes(p.id)) : tables[table] ?? [], error: null }),
    }
    return q
  }
  return load('src/lib/comms/recipients.ts', { '@/lib/supabase/admin': { createAdminSupabase: () => ({ from: chain }) } })
}

test('missing birth certificate skips uploads and wrestlers marked on file', async () => {
  const lib = recipientsHarness({
    athletes: [
      { id: 'a', parent_id: 'p-uploaded', birth_certificate_on_file: false },
      { id: 'b', parent_id: 'p-onfile', birth_certificate_on_file: true },
      { id: 'c', parent_id: 'p-missing', birth_certificate_on_file: false },
    ],
    docs: [{ athlete_id: 'a', doc_type: 'birth_certificate', verified: false, uploaded_at: '2026-09-01T00:00:00Z' }],
  })
  const recipients = await lib.resolveRecipients({ type: 'missing_document', documents: ['birth_certificate'] })
  assert.deepEqual(recipients.map((r) => r.id), ['p-missing'])
})

test('missing USA card counts verified cards and this season\'s uploads only', async () => {
  const lib = recipientsHarness({
    athletes: [
      { id: 'old-verified', parent_id: 'p1', birth_certificate_on_file: false },
      { id: 'new-upload', parent_id: 'p2', birth_certificate_on_file: false },
      { id: 'old-unverified', parent_id: 'p3', birth_certificate_on_file: false },
      { id: 'none', parent_id: 'p4', birth_certificate_on_file: false },
    ],
    docs: [
      { athlete_id: 'old-verified', doc_type: 'usa_wrestling_card', verified: true, uploaded_at: '2025-09-01T00:00:00Z' },
      { athlete_id: 'new-upload', doc_type: 'usa_wrestling_card', verified: false, uploaded_at: '2026-09-01T00:00:00Z' },
      { athlete_id: 'old-unverified', doc_type: 'usa_wrestling_card', verified: false, uploaded_at: '2025-09-01T00:00:00Z' },
    ],
  })
  const recipients = await lib.resolveRecipients({ type: 'missing_document', documents: ['usa_wrestling_card'] })
  assert.deepEqual(recipients.map((r) => r.id).sort(), ['p3', 'p4'])
})
