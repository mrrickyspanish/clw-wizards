'use server'

import { z } from 'zod'

import { createAdminSupabase } from '@/lib/supabase/admin'
import type { AdminScope } from '@/types/database'

export type ActionResult = { ok: true } | { ok: false; error: string }

const schema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name').max(120),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  code: z.string().trim().min(1, 'Enter your admin access code'),
})

// Resolve an access code to the tier it grants, or null if it's not valid.
// Two sources: the ADMIN_SIGNUP_CODE env secret (bootstrap → always 'full'), and
// single-use rows in admin_invites (tier chosen by the inviting admin). Returns
// the matched invite id so the caller can mark it redeemed.
async function resolveCode(
  admin: ReturnType<typeof createAdminSupabase>,
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

/**
 * Create an admin account. Gated entirely by the access code — the tier is set
 * by the code (env bootstrap = full, or the invite's chosen scope), NEVER by
 * anything the signer picks. Runs fully server-side with the service role: it
 * verifies the code first, then creates a confirmed auth user and promotes their
 * profile to admin. The account then signs in through the normal login page.
 */
export async function createAdminAccount(values: z.input<typeof schema>): Promise<ActionResult> {
  const parsed = schema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { fullName, email, password, code } = parsed.data
  const admin = createAdminSupabase()

  const resolved = await resolveCode(admin, code)
  // Deliberately generic — don't reveal whether the code or something else was
  // the problem to someone probing the endpoint.
  if (!resolved) return { ok: false, error: 'That access code is invalid or has expired.' }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (createError || !created.user) {
    const msg = createError?.message ?? 'Could not create the account.'
    // Surface the common case cleanly.
    if (/already/i.test(msg)) return { ok: false, error: 'An account with that email already exists — sign in instead.' }
    return { ok: false, error: msg }
  }

  const userId = created.user.id

  // The handle_new_user trigger already inserted a 'parent' profile; promote it.
  const { error: promoteError } = await admin
    .from('profiles')
    .update({ role: 'admin', admin_scope: resolved.scope, full_name: fullName, email, is_active: true })
    .eq('id', userId)
  if (promoteError) {
    // Roll back the half-created account so the code/email can be retried.
    await admin.auth.admin.deleteUser(userId)
    return { ok: false, error: promoteError.message }
  }

  if (resolved.inviteId) {
    await admin
      .from('admin_invites')
      .update({ redeemed_at: new Date().toISOString(), redeemed_by: userId })
      .eq('id', resolved.inviteId)
  }

  return { ok: true }
}
