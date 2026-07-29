'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { SMS_CONSENT_TEXT } from '@/lib/twilio/opt-in'
import { ORG } from '@/config/org.config'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Admin can read every athlete via RLS, but the write policies only let a
// parent mutate their own athletes. Admin family management therefore goes
// through the service-role client, gated by this explicit admin check first.
async function assertAdmin(): Promise<ActionResult> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Admin access required' }
  return { ok: true }
}

const parentSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(120),
  email: z.string().trim().email('Enter a valid email').max(254),
  phone: z.string().trim().max(20, 'Phone must be 20 characters or fewer').optional().nullable(),
  practice_group: z
    .enum(ORG.practiceGroups as unknown as [string, ...string[]])
    .or(z.literal(''))
    .optional()
    .nullable(),
  sms_opt_in: z.boolean(),
})

export type ParentInput = z.input<typeof parentSchema>

export async function updateParent(id: string, values: ParentInput): Promise<ActionResult> {
  const auth = await assertAdmin()
  if (!auth.ok) return auth
  if (!id) return { ok: false, error: 'Missing parent id' }

  let parsed
  try {
    parsed = parentSchema.parse(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }

  const admin = createAdminSupabase()
  const { data: current, error: currentError } = await admin
    .from('profiles')
    .select('id, role, full_name, email, sms_opt_in, sms_opt_in_at, consent_text')
    .eq('id', id)
    .eq('role', 'parent')
    .maybeSingle()

  if (currentError) return { ok: false, error: currentError.message }
  if (!current) return { ok: false, error: 'Parent account not found.' }

  const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(id)
  if (authUserError || !authUser.user) {
    return { ok: false, error: authUserError?.message ?? 'Could not load the parent login.' }
  }

  const email = parsed.email.toLowerCase()
  const previousAuthEmail = authUser.user.email ?? current.email ?? ''
  const previousMetadata = authUser.user.user_metadata ?? {}

  // Keep the login identity and the public profile synchronized. The admin API
  // changes the sign-in email immediately without requiring a second confirmation.
  const { error: loginError } = await admin.auth.admin.updateUserById(id, {
    email,
    user_metadata: { ...previousMetadata, full_name: parsed.full_name },
  })

  if (loginError) {
    if (/already|registered|exists/i.test(loginError.message)) {
      return { ok: false, error: 'That email is already attached to another account.' }
    }
    return { ok: false, error: loginError.message }
  }

  const enablingSms = parsed.sms_opt_in && !current.sms_opt_in
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: parsed.full_name,
      email,
      phone: parsed.phone || null,
      practice_group: parsed.practice_group || null,
      sms_opt_in: parsed.sms_opt_in,
      sms_opt_in_at: enablingSms ? new Date().toISOString() : current.sms_opt_in_at,
      consent_text: enablingSms ? SMS_CONSENT_TEXT : current.consent_text,
    })
    .eq('id', id)
    .eq('role', 'parent')

  if (profileError) {
    // Avoid leaving the login email and profile email out of sync if the profile
    // write fails after the Auth update.
    await admin.auth.admin.updateUserById(id, {
      ...(previousAuthEmail ? { email: previousAuthEmail } : {}),
      user_metadata: previousMetadata,
    })
    return { ok: false, error: profileError.message }
  }

  revalidatePath('/admin/families')
  revalidatePath(`/admin/families/${id}`)
  revalidatePath('/dashboard')
  revalidatePath('/profile')
  return { ok: true }
}

const athleteSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date of birth is required'),
  practice_group: z.enum(ORG.practiceGroups as unknown as [string, ...string[]]),
  weight_class: z.string().trim().optional().nullable(),
  usa_wrestling_card_number: z.string().trim().optional().nullable(),
  shirt_size: z.string().trim().optional().nullable(),
  active: z.boolean(),
})

export type AthleteInput = z.input<typeof athleteSchema>

export async function updateAthlete(id: string, values: AthleteInput): Promise<ActionResult> {
  const auth = await assertAdmin()
  if (!auth.ok) return auth
  if (!id) return { ok: false, error: 'Missing athlete id' }

  let parsed
  try {
    parsed = athleteSchema.parse(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }

  const supabase = createAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      date_of_birth: parsed.date_of_birth,
      practice_group: parsed.practice_group,
      weight_class: parsed.weight_class || null,
      usa_wrestling_card_number: parsed.usa_wrestling_card_number || null,
      shirt_size: parsed.shirt_size || null,
      active: parsed.active,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/families')
  revalidatePath(`/admin/families/${id}`)
  return { ok: true }
}

export async function setFamilyActive(parentId: string, isActive: boolean): Promise<ActionResult> {
  const auth = await assertAdmin()
  if (!auth.ok) return auth
  if (!parentId) return { ok: false, error: 'Missing family id' }

  const supabase = createAdminSupabase()
  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', parentId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/families')
  revalidatePath(`/admin/families/${parentId}`)
  return { ok: true }
}
