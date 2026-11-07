import { Resend } from 'resend'
import { z } from 'zod'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { readCredential } from '@/lib/env'
import { setPasswordLink } from '@/lib/parent-login'
import { ORG } from '@/config/org.config'
import type { AdminScope } from '@/types/database'

// Invite admin (Tyler, Nov 7): a full admin types a name and email on Admin
// team and picks Full or Limited; the site makes the admin login and emails a
// one-time link to set a password. Same as Add parent login, no code to pass
// along. An admin who also has a family uses a second email for this login
// (Ricky, Nov 5), so their family login stays as it is.

type AdminClient = ReturnType<typeof createAdminSupabase>

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const adminInviteSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter their name').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    // Typed twice: a typo would email a stranger a way into every family's records.
    emailAgain: z.string().trim().toLowerCase(),
    scope: z.enum(['full', 'limited'], { message: 'Pick Full or Limited access.' }),
  })
  .refine((v) => v.email === v.emailAgain, { message: "The two emails don't match.", path: ['emailAgain'] })
export type AdminInviteInput = z.input<typeof adminInviteSchema>

export type AdminInviteResult = { ok: true; emailed: boolean } | { ok: false; error: string }

export type AdminLoginEmail = (input: { email: string; name: string; scope: AdminScope }) => Promise<boolean>

export async function inviteAdmin(
  admin: AdminClient,
  values: AdminInviteInput,
  sendEmail: AdminLoginEmail = sendAdminLoginEmail
): Promise<AdminInviteResult> {
  const parsed = adminInviteSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again.' }
  const { name, email, scope } = parsed.data

  // Profile emails are stored lowercase, the same as their logins.
  const { data: existing } = await admin.from('profiles').select('id, role, is_active').eq('email', email).maybeSingle()
  if (existing) {
    if (existing.role === 'admin') {
      return {
        ok: false,
        error: existing.is_active
          ? "They're already an admin."
          : "That admin's access is turned off. Use Restore access on their row below.",
      }
    }
    return {
      ok: false,
      error: "That email is a family login. Use a second email for the admin login, so the family login stays as it is.",
    }
  }

  // No password: they choose one from the email (or Set or reset password).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (createError || !created?.user) {
    if (/already/i.test(createError?.message ?? '')) {
      return { ok: false, error: 'That email already has a login. Refresh the page to see if they are on the list.' }
    }
    return { ok: false, error: 'Could not make the login. Try again.' }
  }
  const newId = created.user.id

  // The sign-up trigger made a parent profile; make it the admin login.
  const [first, ...rest] = name.split(/\s+/)
  const { data: profile } = await admin
    .from('profiles')
    .update({
      role: 'admin',
      admin_scope: scope,
      full_name: name,
      first_name: first,
      last_name: rest.join(' ') || null,
      email,
      is_active: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', newId)
    .select('id')
    .maybeSingle()
  if (!profile) {
    // Undo the half-made login so it can be tried again.
    await admin.auth.admin.deleteUser(newId)
    return { ok: false, error: 'Could not make the login. Try again.' }
  }

  const emailed = await sendEmail({ email, name, scope }).catch(() => false)
  return { ok: true, emailed }
}

/**
 * The "your admin login is ready" email: a one-time link to choose a password.
 * Its own subject, so the password-reset health check (which watches "Reset
 * your password") is not set off by it. Returns false if it did not go out.
 */
export async function sendAdminLoginEmail({
  email,
  name,
  scope,
}: {
  email: string
  name: string
  scope: AdminScope
}): Promise<boolean> {
  const resendKey = readCredential('RESEND_API_KEY')
  const fromAddress = readCredential('RESEND_FROM_EMAIL')
  const siteUrl = readCredential('NEXT_PUBLIC_SITE_URL')?.replace(/\/$/, '')
  if (!resendKey || !fromAddress || !siteUrl) return false

  const made = await setPasswordLink(email, siteUrl)
  if (!made) return false
  const { link, attemptId } = made
  const first = name.split(/\s+/)[0] || name
  const access =
    scope === 'full'
      ? 'full access: families, dues, tournaments, messages and the public website'
      : 'access to families, dues, tournaments and messages'
  const html = `<p>Hi ${escapeHtml(first)},</p>
<p>The club set up your ${escapeHtml(ORG.name)} admin login, with ${access}.</p>
<p><a href="${link}">Set your password</a></p>
<p>The link works once. If it has expired, go to ${siteUrl}/login, tap Set or reset password and enter this email.</p>
<p>If the button doesn't work, copy and paste this link into your browser:<br/>${link}</p>`

  const result = await new Resend(resendKey).emails
    .send(
      {
        from: fromAddress,
        to: [email],
        subject: `Your ${ORG.name} admin login is ready`,
        html,
        text: `Hi ${first},\n\nThe club set up your ${ORG.name} admin login, with ${access}.\n\nSet your password: ${link}\n\nThe link works once. If it has expired, go to ${siteUrl}/login, tap Set or reset password and enter this email.`,
      },
      { idempotencyKey: `admin-login/${attemptId}` }
    )
    .catch(() => null)
  return Boolean(result && !result.error && result.data?.id)
}
