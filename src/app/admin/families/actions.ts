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

export async function updateParent(
  id: string,
  values: ParentInput,
  familyId?: string
): Promise<ActionResult> {
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

  // Keep the login identity and the profile synchronized. The admin API changes
  // the sign-in email immediately without requiring a second confirmation.
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
  revalidatePath(`/admin/families/${familyId ?? id}`)
  if (familyId && familyId !== id) revalidatePath(`/admin/families/${id}`)
  revalidatePath('/dashboard')
  revalidatePath('/profile')
  return { ok: true }
}

const athleteSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date of birth is required'),
  // Empty means unassigned, which is how an imported wrestler starts: the
  // registration form never asks for a group, staff place them afterwards.
  practice_group: z
    .enum(ORG.practiceGroups as unknown as [string, ...string[]])
    .or(z.literal(''))
    .optional()
    .nullable(),
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
      practice_group: parsed.practice_group || null,
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

/**
 * Permanent deletion is reserved for full admins, a step above the admin check
 * every other action here uses. Deactivating a family is reversible and any
 * admin can do it; this is not, so it sits with the tier that already owns the
 * irreversible surfaces (site content, admin invites).
 */
async function assertFullAdmin(): Promise<ActionResult> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_scope')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' || profile?.admin_scope !== 'full') {
    return { ok: false, error: 'Full admin access is required to delete a family.' }
  }
  return { ok: true }
}

export type FamilyDeletionPreview = {
  parentName: string
  email: string | null
  athletes: number
  enrollments: number
  duesRecords: number
  signedAgreements: number
  documents: number
  coGuardianLinks: number
  /**
   * Dues rows that carry an actual payment. Surfaced so the admin knows the
   * payment history goes with the account, not to stop them.
   */
  duesWithPayments: number
}

/**
 * What deleting this family would destroy. The dialog shows this before asking
 * for confirmation, so nobody types a name to approve a list they never saw.
 */
export async function getFamilyDeletionPreview(
  parentId: string
): Promise<{ ok: true; preview: FamilyDeletionPreview } | { ok: false; error: string }> {
  const auth = await assertFullAdmin()
  if (!auth.ok) return auth
  if (!parentId) return { ok: false, error: 'Missing parent id' }

  const admin = createAdminSupabase()

  const { data: parent, error: parentError } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', parentId)
    .eq('role', 'parent')
    .maybeSingle()

  if (parentError) return { ok: false, error: parentError.message }
  if (!parent) return { ok: false, error: 'Parent account not found.' }

  const { data: athleteRows } = await admin.from('athletes').select('id').eq('parent_id', parentId)
  const athleteIds = (athleteRows ?? []).map((row) => row.id as string)

  const [dues, enrollments, agreements, documents, guardianLinks] = await Promise.all([
    admin
      .from('dues_payments')
      .select('id, amount_paid_cents, status, stripe_payment_intent_id')
      .eq('parent_id', parentId),
    admin.from('season_enrollments').select('id', { count: 'exact', head: true }).eq('parent_id', parentId),
    admin.from('disclosure_acceptances').select('id', { count: 'exact', head: true }).eq('accepted_by', parentId),
    admin.from('athlete_documents').select('id', { count: 'exact', head: true }).eq('parent_id', parentId),
    admin.from('family_guardians').select('id', { count: 'exact', head: true }).eq('owner_id', parentId),
  ])

  const duesRows = dues.data ?? []
  // A waived or pending record carries no money. A payment that actually
  // settled does, and it cascades away with the profile -- worth naming in the
  // dialog so the choice is made with that on screen.
  const paidRows = duesRows.filter(
    (row) => (row.amount_paid_cents ?? 0) > 0 || Boolean(row.stripe_payment_intent_id)
  )

  return {
    ok: true,
    preview: {
      parentName: parent.full_name ?? 'Unnamed parent',
      email: parent.email ?? null,
      athletes: athleteIds.length,
      enrollments: enrollments.count ?? 0,
      duesRecords: duesRows.length,
      signedAgreements: agreements.count ?? 0,
      documents: documents.count ?? 0,
      coGuardianLinks: guardianLinks.count ?? 0,
      duesWithPayments: paidRows.length,
    },
  }
}

/**
 * Permanently removes a family: the login, the profile, and everything that
 * cascades off it (athletes, enrollments, dues, documents, guardian links).
 *
 * Built for clearing test accounts, but not restricted to them: what the
 * dialog shows before confirming is the safeguard, not a rule about which
 * families qualify.
 */
export async function deleteFamilyPermanently(
  parentId: string,
  typedConfirmation: string
): Promise<ActionResult> {
  const auth = await assertFullAdmin()
  if (!auth.ok) return auth
  if (!parentId) return { ok: false, error: 'Missing parent id' }

  const previewResult = await getFamilyDeletionPreview(parentId)
  if (!previewResult.ok) return previewResult
  const { preview } = previewResult

  if (typedConfirmation.trim() !== preview.parentName.trim()) {
    return { ok: false, error: 'The name you typed does not match this family.' }
  }

  const admin = createAdminSupabase()

  const { data: athleteRows } = await admin.from('athletes').select('id').eq('parent_id', parentId)
  const athleteIds = (athleteRows ?? []).map((row) => row.id as string)

  // Stored files are not covered by any cascade, so they would outlive the rows
  // that point at them and sit in the bucket unreferenced.
  const { data: documents } = await admin
    .from('athlete_documents')
    .select('file_url')
    .eq('parent_id', parentId)

  const paths = (documents ?? []).map((row) => row.file_url as string).filter(Boolean)
  if (paths.length) {
    const { error: storageError } = await admin.storage.from('athlete-documents').remove(paths)
    // A missing object should not strand the whole deletion; the rows still go.
    if (storageError) console.warn('Could not remove athlete documents from storage:', storageError.message)
  }

  // disclosure_acceptances.accepted_by is ON DELETE RESTRICT, so signed
  // agreements block the profile delete until they are cleared explicitly.
  // Acceptances tied to this family's athletes cascade on their own; these are
  // the ones this parent signed, which may include another family's athlete if
  // they were ever a co-guardian.
  const { error: acceptanceError } = await admin
    .from('disclosure_acceptances')
    .delete()
    .eq('accepted_by', parentId)

  if (acceptanceError) return { ok: false, error: `Could not clear signed agreements: ${acceptanceError.message}` }

  if (athleteIds.length) {
    const { error: athleteAcceptanceError } = await admin
      .from('disclosure_acceptances')
      .delete()
      .in('athlete_id', athleteIds)
    if (athleteAcceptanceError) {
      return { ok: false, error: `Could not clear signed agreements: ${athleteAcceptanceError.message}` }
    }
  }

  // profiles.id references auth.users ON DELETE CASCADE, so removing the login
  // takes the profile and everything hanging off it in one step.
  const { error: deleteError } = await admin.auth.admin.deleteUser(parentId)
  if (deleteError) return { ok: false, error: deleteError.message }

  revalidatePath('/admin/families')
  revalidatePath('/admin/registrations')
  revalidatePath('/admin/dues')
  return { ok: true }
}

export async function setFamilyActive(
  parentId: string,
  isActive: boolean,
  familyId?: string
): Promise<ActionResult> {
  const auth = await assertAdmin()
  if (!auth.ok) return auth
  if (!parentId) return { ok: false, error: 'Missing parent id' }

  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', parentId)
    .eq('role', 'parent')
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Parent account not found.' }

  revalidatePath('/admin/families')
  revalidatePath(`/admin/families/${familyId ?? parentId}`)
  if (familyId && familyId !== parentId) revalidatePath(`/admin/families/${parentId}`)
  return { ok: true }
}
