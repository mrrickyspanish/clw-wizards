'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'

export type ActionResult = { ok: true } | { ok: false; error: string }

const surfaceSchema = z.enum(['parent', 'admin'])
export type TourSurface = z.infer<typeof surfaceSchema>

// Accounts pinned to see the tour on every load, for demoing/testing —
// dismissing it never persists "seen" for these. Remove an email to restore
// normal once-and-done behavior for that account.
const ALWAYS_SHOW_TOUR_EMAILS = new Set(['rjlbarnes92@gmail.com'])

export async function markTourSeen(rawSurface: TourSurface): Promise<ActionResult> {
  const parsed = surfaceSchema.safeParse(rawSurface)
  if (!parsed.success) return { ok: false, error: 'Invalid tour surface' }

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }

  if (auth.user.email && ALWAYS_SHOW_TOUR_EMAILS.has(auth.user.email.toLowerCase())) {
    return { ok: true }
  }

  const now = new Date().toISOString()
  const { error } =
    parsed.data === 'parent'
      ? await supabase.from('profiles').update({ parent_tour_seen_at: now }).eq('id', auth.user.id)
      : await supabase.from('profiles').update({ admin_tour_seen_at: now }).eq('id', auth.user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(parsed.data === 'parent' ? '/dashboard' : '/admin')
  return { ok: true }
}
