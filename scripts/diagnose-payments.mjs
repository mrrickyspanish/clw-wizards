/**
 * Ten-second triage for "the payment links aren't working."
 *
 * Run this from a machine that can reach Stripe and the live site. It is
 * strictly read-only: it retrieves, it never creates, charges or mutates
 * anything, and it never prints a key.
 *
 * It exists because the four things that break payments on this site are
 * indistinguishable from the outside -- a parent sees a button that does not
 * work in all four cases -- but are trivially distinguishable from Stripe's own
 * records. This asks Stripe directly and names which one it is.
 *
 *   node scripts/diagnose-payments.mjs
 *
 * Reads STRIPE_SECRET_KEY and NEXT_PUBLIC_SITE_URL from the environment, or
 * from .env.local if present. To check the deployed environment rather than a
 * local file, pull the real values first:
 *
 *   vercel env pull .env.local --environment production
 */

import { readFileSync, existsSync } from 'node:fs'
import Stripe from 'stripe'

// ── Environment ──────────────────────────────────────────────────────────────

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (!match) continue
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    if (!process.env[match[1]]) process.env[match[1]] = value
  }
}

const results = []
const record = (ok, label, detail) => {
  results.push({ ok, label, detail })
  console.log(`${ok === true ? '  OK  ' : ok === false ? ' FAIL ' : ' WARN '} ${label}${detail ? ` -- ${detail}` : ''}`)
}

console.log('\nPayment path diagnosis\n' + '='.repeat(60))

// ── 1. NEXT_PUBLIC_SITE_URL ──────────────────────────────────────────────────
// Stripe requires absolute return URLs. A value with no scheme makes every
// checkout 500 while the rest of the site keeps working perfectly.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
let siteOrigin = null
if (!siteUrl) {
  record(false, 'NEXT_PUBLIC_SITE_URL', 'not set -- checkout cannot build return URLs')
} else if (!/^https?:\/\//i.test(siteUrl)) {
  record(false, 'NEXT_PUBLIC_SITE_URL', `"${siteUrl}" has no https:// prefix -- this alone breaks every payment link`)
} else {
  try {
    siteOrigin = new URL(siteUrl).origin
    record(true, 'NEXT_PUBLIC_SITE_URL', siteOrigin)
  } catch {
    record(false, 'NEXT_PUBLIC_SITE_URL', `"${siteUrl}" is not a valid URL`)
  }
}

// ── 2. Stripe credentials ────────────────────────────────────────────────────

const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
if (!secretKey) {
  record(false, 'STRIPE_SECRET_KEY', 'not set -- /api/checkout refuses every request')
  summarise()
  process.exit(1)
}

if (process.env.STRIPE_SECRET_KEY !== secretKey) {
  record('warn', 'STRIPE_SECRET_KEY', 'has surrounding whitespace (the app trims it, but fix it at the source)')
}

const mode = secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_') ? 'live'
  : secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_') ? 'test'
  : 'unrecognised'

if (mode === 'test') {
  record(false, 'Stripe key mode', 'TEST key -- checkout renders normally and declines every real card')
} else if (mode === 'unrecognised') {
  record('warn', 'Stripe key mode', 'prefix not recognised as sk_/rk_ live or test')
} else {
  record(true, 'Stripe key mode', 'live')
}

const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim())
record(
  hasWebhookSecret,
  'STRIPE_WEBHOOK_SECRET',
  hasWebhookSecret ? 'set' : 'MISSING -- cards succeed and dues balances never update'
)

const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })

// ── 3. Is the key actually accepted? ─────────────────────────────────────────

try {
  const balance = await stripe.balance.retrieve()
  record(true, 'Stripe accepts the key', `livemode=${balance.livemode}`)
} catch (error) {
  const type = error?.type ?? 'unknown'
  const reason = type === 'StripeAuthenticationError'
    ? 'key rejected -- rotated, revoked or wrong account. THIS IS YOUR BUG.'
    : type === 'StripePermissionError' ? 'restricted key lacks the needed scope'
    : type === 'StripeConnectionError' || type === 'StripeAPIError'
      ? 'could not reach Stripe from this machine -- check this box\'s own network before blaming the key'
    : type
  record(false, 'Stripe accepts the key', reason)
  summarise()
  process.exit(1)
}

// ── 4. Is anyone reaching Stripe at all? ─────────────────────────────────────
// This is the single most useful signal. Sessions being created means the site
// is fine and the problem is downstream (cards, webhook). Zero sessions while
// parents are trying means nobody is getting past /api/checkout.

const dayAgo = Math.floor(Date.now() / 1000) - 86400
try {
  const sessions = await stripe.checkout.sessions.list({ limit: 100, created: { gte: dayAgo } })
  const complete = sessions.data.filter((s) => s.status === 'complete').length
  const open = sessions.data.filter((s) => s.status === 'open').length
  const expired = sessions.data.filter((s) => s.status === 'expired').length

  if (sessions.data.length === 0) {
    record(false, 'Checkout sessions (24h)', 'ZERO -- nobody is getting past /api/checkout. The fault is on the site, not Stripe.')
  } else {
    record(true, 'Checkout sessions (24h)', `${sessions.data.length} created: ${complete} complete, ${open} open, ${expired} expired`)
    if (complete === 0 && sessions.data.length > 2) {
      console.log('       ^ sessions created but none completed: cards are failing at Stripe, not links')
    }
  }
} catch (error) {
  record('warn', 'Checkout sessions (24h)', error?.message ?? 'could not list')
}

// ── 5. Are cards being declined? ─────────────────────────────────────────────

try {
  const intents = await stripe.paymentIntents.list({ limit: 100, created: { gte: dayAgo } })
  const failed = intents.data.filter((i) => i.status === 'requires_payment_method' && i.last_payment_error)
  if (failed.length > 0) {
    const codes = [...new Set(failed.map((i) => i.last_payment_error?.decline_code ?? i.last_payment_error?.code))]
    record('warn', 'Declined payments (24h)', `${failed.length} -- ${codes.join(', ')}`)
  } else {
    record(true, 'Declined payments (24h)', 'none')
  }
} catch (error) {
  record('warn', 'Declined payments (24h)', error?.message ?? 'could not list')
}

// ── 6. Webhook endpoint health ───────────────────────────────────────────────
// A payment that succeeds on the card but never posts back leaves the parent
// charged and the dues record still reading as owed -- which reaches the club
// as "the payment didn't work" even though the money moved.

try {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 })
  const live = endpoints.data.filter((e) => e.status === 'enabled')
  if (live.length === 0) {
    record(false, 'Stripe webhook endpoint', 'none enabled -- dues balances will never update after payment')
  } else {
    for (const endpoint of live) {
      const pointsAtSite = siteOrigin ? endpoint.url.startsWith(siteOrigin) : true
      record(pointsAtSite ? true : 'warn', 'Stripe webhook endpoint', `${endpoint.url}${pointsAtSite ? '' : ' -- does NOT match NEXT_PUBLIC_SITE_URL'}`)
    }
  }
} catch (error) {
  record('warn', 'Stripe webhook endpoint', error?.message ?? 'could not list (restricted key?)')
}

// ── 7. The live health endpoint, once deployed ───────────────────────────────

if (siteOrigin) {
  try {
    const response = await fetch(`${siteOrigin}/api/health/checkout`, { signal: AbortSignal.timeout(20000) })
    const body = await response.json().catch(() => ({}))
    record(response.ok, 'Live /api/health/checkout', body.reason ?? (body.ok ? `ok (${body.mode})` : `HTTP ${response.status}`))
  } catch (error) {
    record('warn', 'Live /api/health/checkout', `unreachable (${error?.message ?? 'error'}) -- not deployed yet?`)
  }
}

summarise()

function summarise() {
  const failures = results.filter((r) => r.ok === false)
  console.log('='.repeat(60))
  if (failures.length === 0) {
    console.log('\nNo configuration fault found. If parents are still stuck, get one')
    console.log('to read out the exact on-screen message -- it now carries a (ref: CODE).\n')
    return
  }
  console.log(`\n${failures.length} problem${failures.length === 1 ? '' : 's'} found:\n`)
  for (const failure of failures) console.log(`  * ${failure.label}: ${failure.detail}`)
  console.log('')
}
