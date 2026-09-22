import { NextResponse } from 'next/server'
import { Resend } from 'resend'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { readCredential } from '@/lib/env'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { ORG } from '@/config/org.config'

/**
 * Sends the password-reset email ourselves through Resend, instead of
 * letting supabase.auth.resetPasswordForEmail() do it through Supabase's own
 * email system.
 *
 * Two independent problems with that path, discovered live tonight:
 *
 * 1. Supabase's default project email relay is rate-limited to roughly 3-4
 *    emails/hour, project-wide, across every auth email type. Not something
 *    a real password-reset flow can run on.
 * 2. Even after routing Supabase Auth through Resend via custom SMTP, the
 *    email Supabase builds still links to the raw Supabase project domain
 *    (https://<ref>.supabase.co/auth/v1/verify?...), not clwizards.com. A
 *    live test confirmed the email left Resend ("sent") but never reached
 *    an inbox ("delivered" never fired) -- a sender/link domain mismatch is
 *    exactly the pattern spam and phishing filters are built to catch, and
 *    *.supabase.co specifically is a well-known target since so many
 *    phishing kits ride free Supabase projects. Fixing the link itself
 *    requires Supabase's Custom Domain for Auth, which needs a paid plan.
 *
 * admin.generateLink() sidesteps both: it hands back a token without
 * sending anything itself, so the email is entirely ours to build and send
 * -- through the exact pipeline that already reliably delivers every other
 * email this app sends, with a link that stays on clwizards.com throughout.
 * The token it returns (hashed_token) is verified by the *already-existing*
 * token_hash + type=recovery branch in auth/callback/route.ts -- the same
 * code path Supabase's own recovery links use under the hood, just reached
 * by a link we control instead of one Supabase emails directly.
 */
export async function POST(request: Request) {
  let body: { email?: string; turnstileToken?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  // Mirrors the captchaToken check resetPasswordForEmail() used to enforce
  // on Supabase's side -- moving the send off that path means this endpoint
  // has to enforce it itself, or the form's Turnstile widget would be
  // decorative.
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    const verified = body.turnstileToken ? await verifyTurnstileToken(body.turnstileToken) : false
    if (!verified) {
      return NextResponse.json(
        { error: 'Complete the security check before requesting a reset link.' },
        { status: 400 }
      )
    }
  }

  const siteUrl = (readCredential('NEXT_PUBLIC_SITE_URL') ?? new URL(request.url).origin).replace(/\/$/, '')
  const admin = createAdminSupabase()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/update-password')}`,
    },
  })

  // Enumeration safety: whatever happened -- no account, Supabase error,
  // Resend error below -- the response back to the browser is identical
  // either way. Never let this endpoint answer "does this email exist."
  const ok = () => NextResponse.json({ ok: true })

  if (error || !data?.properties?.hashed_token) {
    if (error && !/user not found/i.test(error.message)) {
      console.error('generateLink failed for password reset:', error.message)
    }
    return ok()
  }

  const resetLink = `${siteUrl}/auth/callback?token_hash=${encodeURIComponent(
    data.properties.hashed_token
  )}&type=recovery&next=${encodeURIComponent('/update-password')}`

  const resendKey = readCredential('RESEND_API_KEY')
  if (!resendKey) {
    console.error('Password reset email not sent: RESEND_API_KEY is not configured.')
    return ok()
  }

  const fromAddress = readCredential('RESEND_FROM_EMAIL') ?? `${ORG.shortName} <onboarding@resend.dev>`
  const resend = new Resend(resendKey)

  const html = `<p>Follow this link to reset the password for your ${ORG.name} account:</p>
<p><a href="${resetLink}">Reset your password</a></p>
<p style="color:#666;font-size:14px;">If the button above doesn't work, copy and paste this link into your browser:<br/>${resetLink}</p>
<p style="color:#666;font-size:14px;">If you didn't request a password reset, you can safely ignore this email.</p>`

  // One retry on a transient send failure, same as the payment-receipt
  // pipeline: a password reset a family is actively waiting on is exactly
  // the kind of send worth not giving up on after one blip.
  try {
    const first = await resend.emails.send({ from: fromAddress, to: [email], subject: 'Reset your password', html })
    if (first.error) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const second = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: 'Reset your password',
        html,
      })
      if (second.error) console.error('Password reset email failed after retry:', second.error.message)
    }
  } catch (err) {
    console.error('Password reset email threw:', err)
  }

  return ok()
}
