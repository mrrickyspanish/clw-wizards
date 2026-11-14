// Homefield demo (RJ, Nov 14): a private copy of the platform for recording a
// walkthrough, branded as a made-up club (Kestrel Falls) and filled only with
// invented data. Switched on per deployment with NEXT_PUBLIC_DEMO_MODE=1; the
// live club never sets it.

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === '1'

/** The live club's Supabase project. A demo deployment must never point at it. */
export const PRODUCTION_SUPABASE_REF = 'nerrrzuocgaohrzurnny'

/**
 * Keys that let the site reach people or real money: email, texts, the message
 * queue, alerts, scheduled jobs, the bot check and analytics. A demo deployment
 * wipes them at startup (src/instrumentation.ts), so nothing can be sent no
 * matter which page or job asks.
 */
export const OUTBOUND_KEYS = [
  'RESEND_API_KEY',
  'RESEND_AUDIT_API_KEY',
  'RESEND_FROM_EMAIL',
  'ALERT_EMAIL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_MESSAGING_SERVICE_SID',
  'TWILIO_PHONE_NUMBER',
  'TWILIO_FORWARD_TO',
  'QSTASH_TOKEN',
  'QSTASH_URL',
  'QSTASH_CURRENT_SIGNING_KEY',
  'QSTASH_NEXT_SIGNING_KEY',
  'CRON_SECRET',
  'FAMILY_REMINDERS',
  'PASSWORD_RESET_CANARY_EMAIL',
  'TURNSTILE_SECRET_KEY',
  'ADMIN_SIGNUP_CODE',
  'ADMIN_ROSTER_SHEET_URL',
] as const

/** Stripe keys only survive in a demo when they are test-mode keys. */
const STRIPE_KEYS = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] as const

export function scrubDemoEnv(env: Record<string, string | undefined>): string[] {
  const removed: string[] = []
  for (const key of OUTBOUND_KEYS) {
    if (env[key] !== undefined) {
      delete env[key]
      removed.push(key)
    }
  }
  const secret = env.STRIPE_SECRET_KEY ?? ''
  if (secret && !/^(sk|rk)_test_/.test(secret)) {
    for (const key of STRIPE_KEYS) delete env[key]
    removed.push(...STRIPE_KEYS)
  }
  return removed
}

/** Reasons a demo deployment must refuse to run. Empty means safe. */
export function demoProblems(env: Record<string, string | undefined>): string[] {
  const problems: string[] = []
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url) problems.push('No demo database is set (NEXT_PUBLIC_SUPABASE_URL).')
  if (url.includes(PRODUCTION_SUPABASE_REF)) problems.push('This demo points at the live club database.')
  if (env.VERCEL_ENV === 'production') problems.push('Demo mode is on in the live (production) deployment.')
  return problems
}
