'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import type { SponsorTier } from '@/types/database'

// Writes go through the authenticated server client; `admin_write_sponsor_tiers`
// RLS enforces admin-only, and /admin is middleware-gated (defense in depth).

const tierSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(60),
  // Null price = "contact us" / custom (not sold through online checkout).
  price_cents: z.union([z.coerce.number().int().min(0).max(100_000_000), z.null()]),
  sort_order: z.coerce.number().int().min(0).max(999),
  public_checkout: z.boolean(),
  active: z.boolean(),
})

export type SponsorTierInput = z.input<typeof tierSchema>
export type ActionResult = { ok: true } | { ok: false; error: string }

export async function updateSponsorTier(slug: string, values: SponsorTierInput): Promise<ActionResult> {
  if (!slug) return { ok: false, error: 'Missing tier' }
  let row
  try {
    row = tierSchema.parse(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('sponsor_tiers').update(row).eq('slug', slug as SponsorTier)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/sponsors')
  revalidatePath('/sponsorship')
  return { ok: true }
}
