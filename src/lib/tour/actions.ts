'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'

export type ActionResult = { ok: true } | { ok: false; error: string }

const surfaceSchema = z.enum(['parent', 'admin'])
export type TourSurface = z.infer<typeof surfaceSchema>

export async function markTourSeen(rawSurface: TourSurface): Promise<ActionResult> {
  const parsed = surfaceSchema.safeParse(rawSurface)
  if (!parsed.success) return { ok: false, error: 'Invalid tour surface' }

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }

  const now = new Date().toISOString()
  const { error } =
    parsed.data === 'parent'
      ? await supabase.from('profiles').update({ parent_tour_seen_at: now }).eq('id', auth.user.id)
      : await supabase.from('profiles').update({ admin_tour_seen_at: now }).eq('id', auth.user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(parsed.data === 'parent' ? '/dashboard' : '/admin')
  return { ok: true }
}
