'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { SMS_CONSENT_TEXT } from '@/lib/twilio/opt-in'

// Writes go through the authenticated server client; the "Users can update own
// profile" RLS policy (auth.uid() = id) means a parent can only ever touch
// their own row here — no admin client needed.

const contactPrefsSchema = z.object({
  phone: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  smsOptIn: z.boolean(),
})

export type ContactPrefsInput = z.input<typeof contactPrefsSchema>
export type ActionResult = { ok: true } | { ok: false; error: string }

export async function updateContactPrefs(values: ContactPrefsInput): Promise<ActionResult> {
  const parsed = contactPrefsSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }

  const { phone, smsOptIn } = parsed.data
  const { error } = await supabase
    .from('profiles')
    .update({
      phone: phone || null,
      sms_opt_in: smsOptIn,
      sms_opt_in_at: smsOptIn ? new Date().toISOString() : null,
      consent_text: smsOptIn ? SMS_CONSENT_TEXT : null,
    })
    .eq('id', auth.user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}
