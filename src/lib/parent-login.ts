import { randomUUID } from 'node:crypto'
import { Resend } from 'resend'
import { z } from 'zod'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { readCredential } from '@/lib/env'
import { registerResetAttempt } from '@/lib/auth/incidents'
import { ORG } from '@/config/org.config'

// Tony or Tyler gives a second parent their own login from a wrestler in
// Families (Tyler, Oct 27). Same result as the club's hand-made co-parent
// logins: a parent account linked to the wrestlers picked, locked so neither
// parent can remove the other. They can see, pay, upload and sign; the
// registration and wrestler details stay with the family's own account.

type AdminClient = ReturnType<typeof createAdminSupabase>

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const parentLoginSchema = z.object({
  name: z.string().trim().min(1, 'Enter their name').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  athleteIds: z.array(z.string().uuid()).min(1, 'Pick at least one wrestler').max(20),
})
export type ParentLoginInput = z.input<typeof parentLoginSchema>

export type ParentLoginResult =
  // created: a new login; emailed says whether the set-password email went out.
  | { ok: true; outcome: 'created'; emailed: boolean; wrestlers: string[] }
  // linked: they already had a parent login, now linked to these wrestlers too.
  | { ok: true; outcome: 'linked'; wrestlers: string[] }
  | { ok: false; error: string }

export type SetPasswordEmail = (input: { email: string; name: string; wrestlers: string[] }) => Promise<boolean>

export async function addParentLogin(
  admin: AdminClient,
  ownerId: string,
  values: ParentLoginInput,
  sendEmail: SetPasswordEmail = sendParentLoginEmail
): Promise<ParentLoginResult> {
  const parsed = parentLoginSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again.' }
  const { name, email } = parsed.data
  const athleteIds = [...new Set(parsed.data.athleteIds)]

  const { data: owner } = await admin
    .from('profiles')
    .select('id, email, role')
    .eq('id', ownerId)
    .eq('role', 'parent')
    .maybeSingle()
  if (!owner) return { ok: false, error: 'This family was not found.' }
  if (owner.email && owner.email.trim().toLowerCase() === email) {
    return { ok: false, error: "That's this family's own login. Enter the other parent's email." }
  }

  const { data: kidRows } = await admin
    .from('athletes')
    .select('id, first_name, last_name')
    .eq('parent_id', ownerId)
    .in('id', athleteIds)
  const kids = (kidRows ?? []) as { id: string; first_name: string; last_name: string }[]
  if (kids.length !== athleteIds.length) return { ok: false, error: 'Pick wrestlers on this family.' }
  const kidName = (id: string) => {
    const kid = kids.find((k) => k.id === id)
    return kid ? `${kid.first_name} ${kid.last_name}` : 'a wrestler'
  }

  // Profile emails are stored lowercase, the same as their logins.
  const { data: existing } = await admin
    .from('profiles')
    .select('id, role, is_active')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    if (existing.role !== 'parent') {
      return { ok: false, error: 'That email is a club staff login. Use a different email for the parent.' }
    }
    if (!existing.is_active) {
      return { ok: false, error: 'That parent login is turned off. Turn it back on from their page in Families first.' }
    }
    const { data: link } = await admin
      .from('family_guardians')
      .select('id, athlete_ids')
      .eq('owner_id', ownerId)
      .eq('guardian_id', existing.id)
      .maybeSingle()
    if (link) {
      const current: string[] | null = link.athlete_ids
      if (current === null) return { ok: false, error: 'They already see every wrestler on this family.' }
      const adding = athleteIds.filter((id) => !current.includes(id))
      if (!adding.length) return { ok: false, error: `They already see ${athleteIds.map(kidName).join(' and ')}.` }
      const { error } = await admin
        .from('family_guardians')
        .update({ athlete_ids: [...current, ...adding] })
        .eq('id', link.id)
      if (error) return { ok: false, error: 'Could not add the wrestler. Try again.' }
      return { ok: true, outcome: 'linked', wrestlers: adding.map(kidName) }
    }
    const { error } = await admin
      .from('family_guardians')
      .insert({ owner_id: ownerId, guardian_id: existing.id, athlete_ids: athleteIds, locked: true })
    if (error) return { ok: false, error: 'Could not link their login. Try again.' }
    return { ok: true, outcome: 'linked', wrestlers: athleteIds.map(kidName) }
  }

  // No password: they choose one from the email (or Set or reset password).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (createError || !created?.user) {
    if (/already/i.test(createError?.message ?? '')) {
      // Most likely a second click that already made it.
      return { ok: false, error: 'That email already has a login. Refresh the page to see it under Co-guardians.' }
    }
    return { ok: false, error: 'Could not make the login. Try again.' }
  }
  const newId = created.user.id

  // The sign-up trigger already made a parent profile. Skip the "add your
  // wrestler" setup, as an invite redemption does.
  const [first, ...rest] = name.split(/\s+/)
  const { data: profile } = await admin
    .from('profiles')
    .update({ full_name: name, first_name: first, last_name: rest.join(' ') || null, onboarding_completed_at: new Date().toISOString() })
    .eq('id', newId)
    .eq('role', 'parent')
    .select('id')
    .maybeSingle()
  const { error: linkError } = profile
    ? await admin
        .from('family_guardians')
        .insert({ owner_id: ownerId, guardian_id: newId, athlete_ids: athleteIds, locked: true })
    : { error: { message: 'profile missing' } }
  if (linkError) {
    // Undo the half-made login so it can be tried again.
    await admin.auth.admin.deleteUser(newId)
    return { ok: false, error: 'Could not make the login. Try again.' }
  }

  const wrestlers = athleteIds.map(kidName)
  const emailed = await sendEmail({ email, name, wrestlers }).catch(() => false)
  return { ok: true, outcome: 'created', emailed, wrestlers }
}

/**
 * The "your login is ready" email: a one-time link to choose a password, the
 * same link the Set or reset password page sends. Its own subject, so the
 * password-reset health check (which watches "Reset your password") is not
 * set off by a mistyped address here. Returns false if it did not go out.
 */
export async function sendParentLoginEmail({
  email,
  name,
  wrestlers,
}: {
  email: string
  name: string
  wrestlers: string[]
}): Promise<boolean> {
  const resendKey = readCredential('RESEND_API_KEY')
  const fromAddress = readCredential('RESEND_FROM_EMAIL')
  const siteUrl = readCredential('NEXT_PUBLIC_SITE_URL')?.replace(/\/$/, '')
  if (!resendKey || !fromAddress || !siteUrl) return false

  const { data, error } = await createAdminSupabase().auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/update-password')}` },
  })
  const token = data?.properties?.hashed_token
  if (error || !token) return false

  // Ties a problem on the set-password page back to this email.
  const attemptId = randomUUID()
  await registerResetAttempt(attemptId, email)
  const link = `${siteUrl}/update-password#recovery_token=${encodeURIComponent(token)}&attempt=${attemptId}`
  const first = name.split(/\s+/)[0] || name
  const kids = wrestlers.length > 1 ? `${wrestlers.slice(0, -1).join(', ')} and ${wrestlers.at(-1)}` : wrestlers[0]
  const html = `<p>Hi ${escapeHtml(first)},</p>
<p>The club set up your ${escapeHtml(ORG.name)} login, so you can see ${escapeHtml(kids)}, pay dues, upload documents and sign forms.</p>
<p><a href="${link}">Set your password</a></p>
<p>The link works once. If it has expired, go to ${siteUrl}/login, tap Set or reset password and enter this email.</p>
<p>If the button doesn't work, copy and paste this link into your browser:<br/>${link}</p>`

  const result = await new Resend(resendKey).emails
    .send(
      {
        from: fromAddress,
        to: [email],
        subject: `Your ${ORG.name} login is ready`,
        html,
        text: `Hi ${first},\n\nThe club set up your ${ORG.name} login, so you can see ${kids}, pay dues, upload documents and sign forms.\n\nSet your password: ${link}\n\nThe link works once. If it has expired, go to ${siteUrl}/login, tap Set or reset password and enter this email.`,
      },
      { idempotencyKey: `parent-login/${attemptId}` }
    )
    .catch(() => null)
  return Boolean(result && !result.error && result.data?.id)
}

/** When each account last signed in (null: never). Admin pages only. */
export async function lastSignIns(admin: AdminClient, ids: string[]): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>()
  await Promise.all(
    [...new Set(ids)].map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id)
      if (data?.user) out.set(id, data.user.last_sign_in_at ?? null)
    })
  )
  return out
}
