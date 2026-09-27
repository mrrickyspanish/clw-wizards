import { randomUUID } from 'node:crypto'
import { NextResponse, after } from 'next/server'
import { Resend } from 'resend'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { readCredential } from '@/lib/env'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { providerError, retryTransient } from '@/lib/auth/recovery-errors'
import { signupDestination } from '@/lib/auth/signup-routing'
import { sendAlert } from '@/lib/alerts'
import { ORG } from '@/config/org.config'

export const maxDuration = 60

/**
 * Creates a parent account and sends the confirmation email OURSELVES.
 *
 * Password recovery was moved off Supabase's built-in email months ago and now
 * goes out through Resend. Signup confirmation was left behind on
 * `supabase.auth.signUp()`, which sends through Supabase's own sender — and
 * that sender is a shared development convenience with a low project-wide
 * hourly cap, not a delivery service. Past the cap it simply stops sending.
 *
 * Nothing surfaces when that happens. `signUp()` still resolves successfully,
 * the site still says "check your email", and the parent waits for a message
 * that was never sent. They cannot confirm, so they cannot sign in, so they
 * cannot reach the pay button — which arrives at the club as "the payment links
 * are broken." Registration opening is exactly the burst that trips the cap,
 * and exactly the week it does the most damage.
 *
 * So this route does what the recovery route does: generate the link with the
 * admin API, then send it through the same provider that carries every other
 * email this club depends on, with the same retry, the same idempotency key and
 * the same alert on failure.
 */
export async function POST(request: Request) {
  const requestId = randomUUID()
  let stage = 'request'
  let email = ''

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const password = typeof input.password === 'string' ? input.password : ''
    const fullName = typeof input.fullName === 'string' ? input.fullName.trim().slice(0, 160) : ''

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Choose a password of at least 8 characters.' }, { status: 400 })
    }

    stage = 'captcha'
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      if (typeof input.turnstileToken !== 'string' || !input.turnstileToken) {
        return NextResponse.json({ error: 'Complete the security check before creating your account.' }, { status: 400 })
      }
      const result = await verifyTurnstileToken(input.turnstileToken)
      if (!result.ok) {
        const serviceFailure = result.reason === 'not-configured' ||
          result.errorCodes.some((code) => ['invalid-input-secret', 'request-failed', 'internal-error'].includes(code))
        if (serviceFailure) throw { name: 'SecurityCheckUnavailable', code: result.errorCodes.join(',') }
        return NextResponse.json({ error: 'The security check expired. Tick the box again and try once more.' }, { status: 400 })
      }
    }

    // Refuse to fall back to Supabase's sender. Half-configured is how this
    // broke in the first place: a working-looking signup that mails nothing.
    stage = 'configuration'
    const resendKey = readCredential('RESEND_API_KEY')
    const fromAddress = readCredential('RESEND_FROM_EMAIL')
    if (!resendKey || !fromAddress || fromAddress.includes('onboarding@resend.dev')) {
      throw { name: 'SignupEmailConfigurationError' }
    }

    const siteUrl = (readCredential('NEXT_PUBLIC_SITE_URL') ?? new URL(request.url).origin).replace(/\/$/, '')
    const next = signupDestination(typeof input.redirectTo === 'string' ? input.redirectTo : null)
    const admin = createAdminSupabase((url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10_000) }))

    // generateLink creates the account and returns the token WITHOUT sending
    // anything. That is the whole point: the send is ours.
    stage = 'generate-link'
    let data
    try {
      data = await retryTransient(async () => {
        const result = await admin.auth.admin.generateLink({
          type: 'signup',
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (result.error) throw result.error
        return result.data
      })
    } catch (error) {
      const details = providerError(error)
      // An address that already has an account is an ordinary mistake, not an
      // incident. Say so plainly and point at the two doors that work.
      if (details.code === 'email_exists' || details.code === 'user_already_exists' ||
        /already (been )?registered|already exists/i.test(details.message ?? '')) {
        return NextResponse.json({
          error: 'An account already exists for that email. Sign in instead, or use Forgot password if you cannot get in.',
          code: 'ACCOUNT-EXISTS',
        }, { status: 409 })
      }
      if (details.code === 'weak_password') {
        return NextResponse.json({ error: details.message ?? 'Choose a stronger password.' }, { status: 400 })
      }
      throw error
    }

    const tokenHash = data?.properties?.hashed_token
    if (!tokenHash) throw { name: 'MissingConfirmationToken' }

    const confirmLink =
      `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=signup&next=${encodeURIComponent(next)}`

    const html = `<p>Welcome to ${ORG.name}. Confirm your email address to finish setting up your account:</p>
<p><a href="${confirmLink}">Confirm my email</a></p>
<p>If the link above doesn't work, copy and paste this into your browser:<br/>${confirmLink}</p>
<p>If you didn't create this account, you can safely ignore this email.</p>`

    stage = 'send-email'
    const resend = new Resend(resendKey)
    const delivery = await retryTransient(async () => {
      const result = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: `Confirm your ${ORG.shortName} account`,
        html,
        text: `Welcome to ${ORG.name}. Confirm your email address to finish setting up your account:\n\n${confirmLink}\n\nIf you didn't create this account, ignore this email.`,
        // Resend's request options accept `query` and `idempotencyKey` only --
        // an AbortSignal passed here is silently dropped, so it is not passed.
        // The retry below, and the route's maxDuration, bound this instead.
      }, { idempotencyKey: `signup-confirmation/${requestId}` })
      if (result.error) throw result.error
      if (!result.data?.id) throw { name: 'MissingEmailReceipt' }
      return result.data
    })

    // Never log addresses, credentials, tokens or full provider responses.
    console.info('[signup-confirmation] sent', { requestId, messageId: delivery.id })
    return NextResponse.json({ ok: true, requestId }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const details = providerError(error)
    console.error('[signup-confirmation] failed', {
      requestId, stage, name: details.name ?? 'UnknownError',
      status: details.status ?? details.statusCode, code: details.code,
    })
    if (stage !== 'request') {
      after(() => sendAlert('Parent signup confirmation email failed', {
        requestId, stage, status: details.status ?? details.statusCode, code: details.code,
      }))
    }
    return NextResponse.json({
      error: `We could not finish creating your account. Please wait a minute and try again. If this continues, contact the club with reference ${requestId}.`,
      requestId,
    }, { status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } })
  }
}
