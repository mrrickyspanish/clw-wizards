import { randomUUID } from 'node:crypto'
import { NextResponse, after } from 'next/server'
import { Resend } from 'resend'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { readCredential } from '@/lib/env'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { providerError, retryTransient } from '@/lib/auth/recovery-errors'
import { ORG } from '@/config/org.config'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { sendAlert } from '@/lib/alerts'

export const maxDuration = 60

// Keep the working same-site callback. Provider failures must not look like
// sent mail. Only an explicitly nonexistent account gets neutral success.
export async function POST(request: Request) {
  const requestId = randomUUID()
  const ok = () => NextResponse.json({ ok: true, requestId }, { headers: { 'Cache-Control': 'no-store' } })
  let stage = 'request'
  let email = ''
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }
    const input = body && typeof body === 'object' ? body as Record<string, unknown> : {}
    email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    // The scheduled canary can exercise this exact production route without a
    // browser CAPTCHA. Its secret is restricted to one dedicated account.
    const canaryEmail = readCredential('PASSWORD_RESET_CANARY_EMAIL')?.toLowerCase()
    const authorizedCanary = Boolean(canaryEmail && email === canaryEmail && isAuthorizedCronRequest(request))

    stage = 'captcha'
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !authorizedCanary) {
      if (typeof input.turnstileToken !== 'string' || !input.turnstileToken) {
        return NextResponse.json({ error: 'Complete the security check before requesting a reset link.' }, { status: 400 })
      }
      const result = await verifyTurnstileToken(input.turnstileToken)
      if (!result.ok) {
        const serviceFailure = result.reason === 'not-configured' ||
          result.errorCodes.some((code) => ['invalid-input-secret', 'request-failed', 'internal-error'].includes(code))
        if (serviceFailure) throw { name: 'SecurityCheckUnavailable', code: result.errorCodes.join(',') }
        return NextResponse.json({ error: 'The security check expired. Tick the box again and resend.' }, { status: 400 })
      }
    }

    stage = 'configuration'
    const resendKey = readCredential('RESEND_API_KEY')
    const fromAddress = readCredential('RESEND_FROM_EMAIL')
    if (!resendKey || !fromAddress || fromAddress.includes('onboarding@resend.dev')) {
      throw { name: 'ResetEmailConfigurationError' }
    }
    const siteUrl = (readCredential('NEXT_PUBLIC_SITE_URL') ?? new URL(request.url).origin).replace(/\/$/, '')
    const admin = createAdminSupabase((input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }))
    stage = 'generate-link'
    const data = await retryTransient(async () => {
      const result = await admin.auth.admin.generateLink({
        type: 'recovery', email,
        options: { redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/update-password')}` },
      })
      if (result.error) throw result.error
      return result.data
    })
    if (!data?.properties?.hashed_token) throw { name: 'MissingRecoveryToken' }

    const resetLink = `${siteUrl}/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=${encodeURIComponent('/update-password')}`
    const html = `<p>Follow this link to reset the password for your ${ORG.name} account:</p>
<p><a href="${resetLink}">Reset your password</a></p>
<p>If the button above doesn't work, copy and paste this link into your browser:<br/>${resetLink}</p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>`

    stage = 'send-email'
    const resend = new Resend(resendKey)
    const delivery = await retryTransient(async () => {
      // Same key, payload and token on every email retry.
      const sendOptions = { idempotencyKey: `password-reset/${requestId}`, signal: AbortSignal.timeout(5_000) }
      const result = await resend.emails.send({
        from: fromAddress, to: [email], subject: 'Reset your password', html,
        text: `Reset your ${ORG.name} password: ${resetLink}\n\nIf you did not request this, ignore this email.`,
      }, sendOptions)
      if (result.error) throw result.error
      if (!result.data?.id) throw { name: 'MissingEmailReceipt' }
      return result.data
    })
    // Never log addresses, credentials, tokens or full provider responses.
    console.info('[password-reset] accepted', { requestId, messageId: delivery.id })
    return authorizedCanary
      ? NextResponse.json({ ok: true, requestId, messageId: delivery.id }, { headers: { 'Cache-Control': 'no-store' } })
      : ok()
  } catch (error) {
    const details = providerError(error)
    if (stage === 'generate-link' && (details.code === 'user_not_found' || /user (?:with this email )?not found/i.test(details.message ?? ''))) {
      // Keep the public response enumeration-safe, but give the club enough
      // detail to resolve an unregistered parent before days of retries.
      after(() => sendAlert('Password reset requested for an unknown account', { requestId, email }))
      return ok()
    }
    console.error('[password-reset] failed', {
      requestId, stage, name: details.name ?? 'UnknownError',
      status: details.status ?? details.statusCode, code: details.code,
    })
    // If Supabase or our configuration breaks, the owner hears about it on
    // the first request, rather than waiting for the daily canary. Resend
    // outages are independently caught by the GitHub health check.
    if (stage !== 'send-email' && stage !== 'request') {
      after(() => sendAlert('Password recovery failed before email send', {
        requestId, stage, status: details.status ?? details.statusCode, code: details.code,
      }))
    }
    return NextResponse.json({
      error: `We could not complete your reset request. Please wait a minute, then try again. If this continues, contact the club with reference ${requestId}.`,
      requestId,
    }, { status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } })
  }
}
