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

// Count of OTHER active full admins (excluding the given id) — the guard that
// stops the club from ever being left with no one who can edit content or
// manage the team.
async function otherActiveFullAdmins(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  excludeId: string
): Promise<number> {
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('admin_scope', 'full')
    .eq('is_active', true)
    .neq('id', excludeId)
  return count ?? 0
}

// Remove or restore an admin's access. Deactivating flips is_active=false, which
// getSessionRole already treats as "no role" — so access is revoked immediately
// and reversibly (nothing is deleted).
export async function setAdminActive(targetId: string, active: boolean): Promise<ActionResult> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  if (!(await isFullAdmin(supabase))) return { ok: false, error: 'Only full admins can manage the team.' }
  if (targetId === user.id) return { ok: false, error: "You can't change your own access here." }

  const { data: target } = await supabase
    .from('profiles')
    .select('id, role, admin_scope, is_active')
    .eq('id', targetId)
    .maybeSingle()
  if (!target || target.role !== 'admin') return { ok: false, error: 'That account is not an admin.' }

  // Don't strip the last full admin.
  if (!active && target.admin_scope === 'full' && target.is_active) {
    if ((await otherActiveFullAdmins(supabase, targetId)) === 0) {
      return { ok: false, error: 'This is the last active full admin — promote another full admin first.' }
    }
  }

  const { error } = await supabase.from('profiles').update({ is_active: active }).eq('id', targetId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/team')
  return { ok: true }
}

// Change an admin's tier (full <-> limited). Can't change your own (you'd risk
// locking yourself out of team/content), and can't demote the last full admin.
export async function setAdminScope(targetId: string, scope: AdminScope): Promise<ActionResult> {
  if (scope !== 'full' && scope !== 'limited') return { ok: false, error: 'Pick an access level.' }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }
  if (!(await isFullAdmin(supabase))) return { ok: false, error: 'Only full admins can manage the team.' }
  if (targetId === user.id) return { ok: false, error: "You can't change your own access level." }

  const { data: target } = await supabase
    .from('profiles')
    .select('id, role, admin_scope, is_active')
    .eq('id', targetId)
    .maybeSingle()
  if (!target || target.role !== 'admin') return { ok: false, error: 'That account is not an admin.' }

  // Demoting a full admin to limited can't remove the last one.
  if (scope === 'limited' && target.admin_scope === 'full' && target.is_active) {
    if ((await otherActiveFullAdmins(supabase, targetId)) === 0) {
      return { ok: false, error: 'This is the last active full admin — promote another full admin first.' }
    }
  }

  const { error } = await supabase.from('profiles').update({ admin_scope: scope }).eq('id', targetId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/team')
  return { ok: true }
}
