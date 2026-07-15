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

// --- Sponsor records (the businesses shown in the marquee) ---------------------

const sponsorSchema = z.object({
  name: z.string().trim().min(1, 'Business name is required').max(160),
  tier: z.enum(['platinum', 'yellow', 'black', 'white', 'wizard_for_life']),
  logo_url: z.string().trim().url('Logo must be a valid URL').optional().nullable().or(z.literal('')),
  website_url: z.string().trim().url('Website must be a valid URL').optional().nullable().or(z.literal('')),
  contact_name: z.string().trim().max(160).optional().nullable(),
  contact_email: z.string().trim().email('Enter a valid email').optional().nullable().or(z.literal('')),
  amount_cents: z.union([z.coerce.number().int().min(0).max(100_000_000), z.null()]),
  recurring: z.boolean(),
  active: z.boolean(),
  golf_outing_hole: z.boolean(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export type SponsorInput = z.input<typeof sponsorSchema>

function normalizeSponsor(values: SponsorInput) {
  const parsed = sponsorSchema.parse(values)
  return {
    name: parsed.name,
    tier: parsed.tier,
    logo_url: parsed.logo_url || null,
    website_url: parsed.website_url || null,
    contact_name: parsed.contact_name || null,
    contact_email: parsed.contact_email || null,
    amount_cents: parsed.amount_cents,
    recurring: parsed.recurring,
    active: parsed.active,
    golf_outing_hole: parsed.golf_outing_hole,
    notes: parsed.notes || null,
  }
}

export async function createSponsor(values: SponsorInput): Promise<ActionResult> {
  let row
  try {
    row = normalizeSponsor(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('sponsors').insert(row)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/sponsors')
  revalidatePath('/sponsorship')
  return { ok: true }
}

export async function updateSponsor(id: string, values: SponsorInput): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing sponsor id' }
  let row
  try {
    row = normalizeSponsor(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('sponsors').update(row).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/sponsors')
  revalidatePath('/sponsorship')
  return { ok: true }
}

export async function deleteSponsor(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing sponsor id' }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/sponsors')
  revalidatePath('/sponsorship')
  return { ok: true }
}
