'use server'

import { revalidatePath } from 'next/cache'

import { createServerSupabase } from '@/lib/supabase/server'

export type InviteResult = { ok: true; code: string } | { ok: false; error: string }
export type ActionResult = { ok: true } | { ok: false; error: string }

// Unambiguous alphabet (no I/O/0/1) for codes read off a phone screen.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  let s = ''
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length]
  return `${s.slice(0, 4)}-${s.slice(4)}`
}

export async function createFamilyInvite(): Promise<InviteResult> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  // Retry a couple of times on the (extremely unlikely) code collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode()
    const { error } = await supabase.from('family_invites').insert({ code, inviter_id: user.id })
    if (!error) {
      revalidatePath('/family')
      return { ok: true, code }
    }
    if (error.code !== '23505') return { ok: false, error: error.message }
  }
  return { ok: false, error: 'Could not generate a code — please try again.' }
}

export async function revokeFamilyInvite(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing invite id' }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('family_invites').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/family')
  return { ok: true }
}
