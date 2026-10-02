'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { SMS_CONSENT_TEXT } from '@/lib/twilio/opt-in'
import { athleteSchema } from '@/lib/registration-schema'
import { normalizeUsPhone } from '@/lib/phone'

export type ActionResult = { ok: true } | { ok: false; error: string }

const onboardingSchema = z.object({
  phone: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  smsOptIn: z.boolean(),
  // May be empty when the family already has wrestlers on file -- see below.
  athletes: z.array(athleteSchema),
})

/**
 * Same child, same family: a first and last name match. Birth dates are
 * deliberately NOT part of the key. Production had two families whose parent
 * typed a different birth date from the one the club imported, and matching on
 * the date as well would have let both copies through. Two children in one
 * family sharing a first and last name is not a case this club has.
 */
function sameChildKey(firstName: string, lastName: string) {
  return `${firstName.trim().toLowerCase()}|${lastName.trim().toLowerCase()}`
}

export type OnboardingInput = z.input<typeof onboardingSchema>

export async function completeOnboarding(values: OnboardingInput): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }

  const { phone, smsOptIn, athletes } = parsed.data

  // Families the club imported already have their wrestlers on file, created
  // with the account. This step used to require at least one wrestler and
  // insert whatever arrived, so every imported family that claimed its account
  // re-entered its children and got a second copy of each: same name, no
  // registration, no dues, and a "Register" button beside the real one. It was
  // also unsafe to submit twice -- a retry after an error inserted the whole
  // list again. Read what is already there and add only children who are not.
  const { data: onFile, error: onFileError } = await supabase
    .from('athletes')
    .select('first_name, last_name')
    .eq('parent_id', auth.user.id)
  if (onFileError) {
    console.error('[onboarding] could not read existing athletes', { code: onFileError.code })
    return { ok: false, error: 'We could not load your family right now. Please try again in a moment.' }
  }

  const seen = new Set((onFile ?? []).map((a) => sameChildKey(a.first_name, a.last_name)))
  const newAthletes = athletes.filter((a) => {
    const key = sameChildKey(a.first_name, a.last_name)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if ((onFile?.length ?? 0) === 0 && newAthletes.length === 0) {
    return { ok: false, error: 'Add at least one athlete' }
  }

  // Insert athletes BEFORE stamping onboarding_completed_at. If this write
  // fails, the parent stays un-onboarded and middleware keeps them on this
  // page for a clean retry — rather than being flagged complete with no
  // athletes on file (which onboarding exists to prevent). The retry is safe
  // now: anything the failed attempt did insert is skipped above.
  const { error: athletesError } = newAthletes.length === 0 ? { error: null } : await supabase.from('athletes').insert(
    newAthletes.map((a) => ({
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

  if (athletesError) {
    console.error('[onboarding] athlete insert failed', { code: athletesError.code })
    return { ok: false, error: 'We could not save your wrestlers. Please try again in a moment.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      phone: normalizeUsPhone(phone),
      sms_opt_in: smsOptIn,
      sms_opt_in_at: smsOptIn ? new Date().toISOString() : null,
      consent_text: smsOptIn ? SMS_CONSENT_TEXT : null,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', auth.user.id)

  if (profileError) {
    console.error('[onboarding] profile update failed', { code: profileError.code })
    return { ok: false, error: 'We could not finish setting up your account. Please try again in a moment.' }
  }

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
