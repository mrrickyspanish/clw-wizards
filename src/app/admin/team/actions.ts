'use server'

import { revalidatePath } from 'next/cache'

import { createServerSupabase } from '@/lib/supabase/server'
import { isFullAdmin } from '@/lib/auth/admin'
import type { AdminScope } from '@/types/database'

export type InviteResult = { ok: true; code: string } | { ok: false; error: string }
export type ActionResult = { ok: true } | { ok: false; error: string }

// Unambiguous alphabet (no I/O/0/1) for codes read aloud or off a screen.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  let s = ''
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length]
  return `${s.slice(0, 4)}-${s.slice(4)}`
}

export async function createAdminInvite(scope: AdminScope): Promise<InviteResult> {
  if (scope !== 'full' && scope !== 'limited') return { ok: false, error: 'Pick an access level.' }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  if (!(await isFullAdmin(supabase))) return { ok: false, error: 'Only full admins can invite admins.' }

  // Retry a couple of times on the (extremely unlikely) code collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode()
    const { error } = await supabase.from('admin_invites').insert({ code, scope, inviter_id: user.id })
    if (!error) {
      revalidatePath('/admin/team')
      return { ok: true, code }
    }
    if (error.code !== '23505') return { ok: false, error: error.message }
  }
  return { ok: false, error: 'Could not generate a code — please try again.' }
}

export async function revokeAdminInvite(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase()
  if (!(await isFullAdmin(supabase))) return { ok: false, error: 'Only full admins can manage invites.' }

  const { error } = await supabase.from('admin_invites').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/team')
  return { ok: true }
}
