'use server'

import { z } from 'zod'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { createStatelessSupabase } from '@/lib/supabase/stateless'
import type { AdminScope, AppRole } from '@/types/database'

type AdminClient = ReturnType<typeof createAdminSupabase>

export type ActionResult =
  | { status: 'created' }
  // The email already belongs to a non-admin account whose password checked
  // out. Nothing has changed yet — the signer has to say yes first.
  | { status: 'needs-upgrade-confirm'; currentRole: Exclude<AppRole, 'admin'> }
  | { status: 'error'; message: string }

const schema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name').max(120),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  code: z.string().trim().min(1, 'Enter your admin access code'),
  // Only set on the second submit, once the signer has been told the email
  // already has an account and has agreed to convert it.
  confirmUpgrade: z.boolean().optional(),
})

// Resolve an access code to the tier it grants, or null if it's not valid.
// Two sources: the ADMIN_SIGNUP_CODE env secret (bootstrap → always 'full'), and
// single-use rows in admin_invites (tier chosen by the inviting admin). Returns
// the matched invite id so the caller can mark it redeemed.
async function resolveCode(
  admin: AdminClient,
  code: string
): Promise<{ scope: AdminScope; inviteId: string | null } | null> {
  const bootstrap = process.env.ADMIN_SIGNUP_CODE
  if (bootstrap && code === bootstrap) return { scope: 'full', inviteId: null }

  const { data: invite } = await admin
    .from('admin_invites')
    .select('id, scope, expires_at, redeemed_at')
    .eq('code', code)
    .maybeSingle()

  if (!invite) return null
  if (invite.redeemed_at) return null
  if (new Date(invite.expires_at).getTime() < Date.now()) return null
  return { scope: invite.scope as AdminScope, inviteId: invite.id }
}

// Stamp the admin role onto an existing profile row. Shared by both paths: a
// brand-new signup (whose trigger-created profile starts as 'parent') and an
// existing account being converted. Returns an error message, or null on success.
async function applyAdminRole(
  admin: AdminClient,
  userId: string,
  values: { fullName: string; email: string; scope: AdminScope }
): Promise<string | null> {
  const { error } = await admin
    .from('profiles')
    .update({
      role: 'admin',
      admin_scope: values.scope,
      full_name: values.fullName,
      email: values.email,
      is_active: true,
    })
    .eq('id', userId)
  return error?.message ?? null
}

async function redeemInvite(admin: AdminClient, inviteId: string | null, userId: string) {
  if (!inviteId) return
  await admin
    .from('admin_invites')
    .update({ redeemed_at: new Date().toISOString(), redeemed_by: userId })
    .eq('id', inviteId)
}

/**
 * Convert an account that already exists into an admin, in place.
 *
 * This is the "signed up at /signup by mistake" path: the person is sent the
 * plain signup link, ends up with a parent account, and then needs admin. Rather
 * than stranding them, they come back through /admin-signup with the same
 * details and the account they already have is promoted — same user id, same
 * password, family and athlete records still attached.
 *
 * Ownership is proved by the password before anything is revealed or changed,
 * so this never becomes a way to discover which emails have accounts.
 */
async function upgradeExistingAccount(
  admin: AdminClient,
  values: {
    email: string
    password: string
    fullName: string
    resolved: { scope: AdminScope; inviteId: string | null }
    confirmUpgrade: boolean
  }
): Promise<ActionResult> {
  const { data: signIn, error: signInError } = await createStatelessSupabase().auth.signInWithPassword({
    email: values.email,
    password: values.password,
  })

  if (signInError || !signIn.user) {
    if (/confirm/i.test(signInError?.message ?? '')) {
      return {
        status: 'error',
        message:
          'That email already has an account, but it has not been confirmed yet. Open the confirmation link we emailed you, then come back and finish here.',
      }
    }
    return {
      status: 'error',
      message:
        'That email already has an account. Enter that account’s current password to switch it over to admin, or sign in instead.',
    }
  }

  const userId = signIn.user.id

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) return { status: 'error', message: profileError.message }
  if (!profile) {
    return { status: 'error', message: 'That account is missing its profile. Ask a full admin to sort it out.' }
  }
  if (profile.role === 'admin') {
    return { status: 'error', message: 'That account is already an admin — sign in instead.' }
  }

  if (!values.confirmUpgrade) {
    return { status: 'needs-upgrade-confirm', currentRole: profile.role }
  }

  // No rollback here, unlike a fresh signup: this is a real account that
  // existed before we touched it, so a failed update leaves it as it was.
  const applyError = await applyAdminRole(admin, userId, {
    fullName: values.fullName,
    email: values.email,
    scope: values.resolved.scope,
  })
  if (applyError) return { status: 'error', message: applyError }

  await redeemInvite(admin, values.resolved.inviteId, userId)
  return { status: 'created' }
}

/**
 * Create an admin account. Gated entirely by the access code — the tier is set
 * by the code (env bootstrap = full, or the invite's chosen scope), NEVER by
 * anything the signer picks. Runs fully server-side with the service role: it
 * verifies the code first, then creates a confirmed auth user and promotes their
 * profile to admin. The account then signs in through the normal login page.
 *
 * If the email is already taken, this hands off to the conversion path above
 * instead of dead-ending — but only after the code has already been checked, so
 * an invalid code never gets that far.
 */
export async function createAdminAccount(values: z.input<typeof schema>): Promise<ActionResult> {
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { fullName, password, code, confirmUpgrade } = parsed.data
  // Supabase stores auth emails lowercased; match that so the profile lookup
  // and the update land on the same row no matter how it was typed.
  const email = parsed.data.email.toLowerCase()
  const admin = createAdminSupabase()

  const resolved = await resolveCode(admin, code)
  // Deliberately generic — don't reveal whether the code or something else was
  // the problem to someone probing the endpoint.
  if (!resolved) return { status: 'error', message: 'That access code is invalid or has expired.' }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (createError || !created.user) {
    const msg = createError?.message ?? 'Could not create the account.'
    if (/already/i.test(msg)) {
      return upgradeExistingAccount(admin, {
        email,
        password,
        fullName,
        resolved,
        confirmUpgrade: confirmUpgrade ?? false,
      })
    }
    return { status: 'error', message: msg }
  }

  const userId = created.user.id

  // The handle_new_user trigger already inserted a 'parent' profile; promote it.
  const promoteError = await applyAdminRole(admin, userId, { fullName, email, scope: resolved.scope })
  if (promoteError) {
    // Roll back the half-created account so the code/email can be retried.
    await admin.auth.admin.deleteUser(userId)
    return { status: 'error', message: promoteError }
  }

  await redeemInvite(admin, resolved.inviteId, userId)
  return { status: 'created' }
}
