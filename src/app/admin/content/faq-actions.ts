'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'

// Writes go through the authenticated server client; `admin_write_faq` RLS
// enforces admin-only, and /admin is middleware-gated (defense in depth).

const faqSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(300),
  answer: z.string().trim().min(1, 'Answer is required').max(4000),
  sort_order: z.coerce.number().int().min(0).max(999),
  active: z.boolean(),
})

export type FaqInput = z.input<typeof faqSchema>
export type ActionResult = { ok: true } | { ok: false; error: string }

function normalize(values: FaqInput) {
  const parsed = faqSchema.parse(values)
  return {
    question: parsed.question,
    answer: parsed.answer,
    sort_order: parsed.sort_order,
    active: parsed.active,
  }
}

function revalidate() {
  revalidatePath('/faq')
  revalidatePath('/admin/content')
}

export async function createFaqItem(values: FaqInput): Promise<ActionResult> {
  let row
  try {
    row = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('faq_items').insert(row)
  if (error) return { ok: false, error: error.message }
  revalidate()
  return { ok: true }
}

export async function updateFaqItem(id: string, values: FaqInput): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing FAQ id' }
  let row
  try {
    row = normalize(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('faq_items').update(row).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidate()
  return { ok: true }
}

export async function deleteFaqItem(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing FAQ id' }
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('faq_items').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidate()
  return { ok: true }
}
