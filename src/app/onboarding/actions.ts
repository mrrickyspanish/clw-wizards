'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { SMS_CONSENT_TEXT } from '@/lib/twilio/opt-in'
import { ORG } from '@/config/org.config'

export type ActionResult = { ok: true } | { ok: false; error: string }

const athleteSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date of birth is required'),
  practice_group: z.enum(ORG.practiceGroups as unknown as [string, ...string[]]),
  weight_class: z.string().trim().optional().nullable(),
  usa_wrestling_card_number: z.string().trim().optional().nullable(),
  shirt_size: z.string().trim().optional().nullable(),
})

const onboardingSchema = z.object({
  phone: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  smsOptIn: z.boolean(),
  athletes: z.array(athleteSchema).min(1, 'Add at least one athlete'),
})

export type OnboardingInput = z.input<typeof onboardingSchema>

export async function completeOnboarding(values: OnboardingInput): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }

  const { phone, smsOptIn, athletes } = parsed.data

  // Insert athletes BEFORE stamping onboarding_completed_at. If this write
  // fails, the parent stays un-onboarded and middleware keeps them on this
  // page for a clean retry — rather than being flagged complete with no
  // athletes on file (which onboarding exists to prevent).
  const { error: athletesError } = await supabase.from('athletes').insert(
    athletes.map((a) => ({
      parent_id: auth.user.id,
      first_name: a.first_name,
      last_name: a.last_name,
      date_of_birth: a.date_of_birth,
      practice_group: a.practice_group,
      weight_class: a.weight_class || null,
      usa_wrestling_card_number: a.usa_wrestling_card_number || null,
      shirt_size: a.shirt_size || null,
    }))
  )

  if (athletesError) return { ok: false, error: athletesError.message }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      phone: phone || null,
      sms_opt_in: smsOptIn,
      sms_opt_in_at: smsOptIn ? new Date().toISOString() : null,
      consent_text: smsOptIn ? SMS_CONSENT_TEXT : null,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', auth.user.id)

  if (profileError) return { ok: false, error: profileError.message }

  revalidatePath('/dashboard')
  return { ok: true }
}

function normalizeCode(raw: string): string {
  const s = raw.replace(/\s+/g, '').toUpperCase()
  return s.length === 8 && !s.includes('-') ? `${s.slice(0, 4)}-${s.slice(4)}` : s
}

// Join an existing family with an invite code: links the signed-in user as a
// guardian of the inviter's family and finishes onboarding (no wrestlers to add).
export async function redeemFamilyInvite(rawCode: string): Promise<ActionResult> {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }

  const code = normalizeCode(rawCode)
  if (!code) return { ok: false, error: 'Enter your invite code.' }

  // Service role: the redeemer is not the inviter, so RLS would hide the invite
  // and block the cross-family guardian link.
  const admin = createAdminSupabase()
  const { data: invite } = await admin
    .from('family_invites')
    .select('id, inviter_id, expires_at, redeemed_at')
    .eq('code', code)
    .maybeSingle()

  if (!invite) return { ok: false, error: 'That invite code is not valid.' }
  if (invite.redeemed_at) return { ok: false, error: 'That invite has already been used.' }
  if (new Date(invite.expires_at).getTime() < Date.now()) return { ok: false, error: 'That invite has expired.' }
  if (invite.inviter_id === auth.user.id) return { ok: false, error: 'You cannot join your own family.' }

  const { error: linkError } = await admin
    .from('family_guardians')
    .upsert({ owner_id: invite.inviter_id, guardian_id: auth.user.id }, { onConflict: 'owner_id,guardian_id' })
  if (linkError) return { ok: false, error: linkError.message }

  await admin
    .from('family_invites')
    .update({ redeemed_by: auth.user.id, redeemed_at: new Date().toISOString() })
    .eq('id', invite.id)

  const { error: profileError } = await admin
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', auth.user.id)
  if (profileError) return { ok: false, error: profileError.message }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function skipOnboarding(): Promise<ActionResult> {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', auth.user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}
