'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { resolveRecipients, type CommTarget } from '@/lib/comms/recipients'

export type PreviewRecipient = { name: string; email: string | null }

export type PreviewResult =
  | { ok: true; count: number; recipients: PreviewRecipient[] }
  | { ok: false; error: string }

// Lets an admin see how many parents a target resolves to before they hit send.
// Recipient resolution uses the service-role client (it spans other families'
// rows), so this is gated to admin/staff first — same access bar as the blast
// endpoint itself.
export async function previewRecipients(target: CommTarget): Promise<PreviewResult> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    return { ok: false, error: 'Admin access required' }
  }

  // The whole list, alphabetical, so an admin can scroll it and check exactly
  // who a send reaches before it goes out.
  const recipients = (await resolveRecipients(target))
    .map((r) => ({ name: r.full_name || r.email || 'Unnamed parent', email: r.email }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return { ok: true, count: recipients.length, recipients }
}

export type BoardActionResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Admin access required' }
  return { ok: true }
}

const boardSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
})

/** Add someone to the board copy list: they get one copy of every message sent to families. */
export async function addBoardRecipient(values: z.input<typeof boardSchema>): Promise<BoardActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const parsed = boardSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('board_copy_recipients').insert(parsed.data)
  if (error) {
    // 23505: that address is already on the list.
    return { ok: false, error: error.code === '23505' ? 'That email is already on the board copy list.' : error.message }
  }
  revalidatePath('/admin/communications')
  return { ok: true }
}

export async function removeBoardRecipient(id: string): Promise<BoardActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Invalid person' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('board_copy_recipients').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/communications')
  return { ok: true }
}
