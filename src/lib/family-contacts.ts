import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

import { normalizeUsPhone, toE164 } from '@/lib/phone'
import type { Database, FamilyContact } from '@/types/database'

/**
 * Family contacts: other people who get a family's club emails, such as a
 * second parent with no login of their own (Tyler, Oct 22). The account owner
 * manages them on Profile and admins on the family's page; both go through
 * saveFamilyContact so the rules match. Removing one keeps the row
 * (removed_at), so a later registration form does not quietly add it back.
 */

export const MAX_FAMILY_CONTACTS = 3

export const familyContactSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, 'Enter their name').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160).optional().or(z.literal('')),
    phone: z.string().trim().max(20).optional().or(z.literal('')),
    // Admins only: saveFamilyContact ignores it for a family's own edits.
    isCoach: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.email || v.phone), { message: 'Enter an email or a cell number', path: ['email'] })
  .refine((v) => !v.phone || toE164(v.phone) !== null, { message: 'Enter a 10-digit cell number', path: ['phone'] })

export type FamilyContactInput = z.input<typeof familyContactSchema>
export type FamilyContactResult = { ok: true } | { ok: false; error: string }

export type FamilyContactView = Pick<FamilyContact, 'id' | 'name' | 'email' | 'phone' | 'athlete_ids' | 'source' | 'is_coach'>

/** The active contacts on a family, oldest first. */
export async function listFamilyContacts(
  supabase: SupabaseClient<Database>,
  ownerId: string
): Promise<FamilyContactView[]> {
  const { data } = await supabase
    .from('family_contacts')
    .select('id, name, email, phone, athlete_ids, source, is_coach')
    .eq('owner_id', ownerId)
    .is('removed_at', null)
    .order('created_at', { ascending: true })
  return (data ?? []) as FamilyContactView[]
}

/** Adds a contact (no id) or changes one, for the family that owns it. */
export async function saveFamilyContact(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  values: FamilyContactInput,
  source: 'family' | 'admin'
): Promise<FamilyContactResult> {
  const parsed = familyContactSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details' }
  const { id, name } = parsed.data
  const email = parsed.data.email || null
  const phone = normalizeUsPhone(parsed.data.phone)
  // Only an admin marks a coach (the database refuses it from a family too).
  const coach = source === 'admin' && parsed.data.isCoach !== undefined ? { is_coach: parsed.data.isCoach } : {}

  const { data: owner } = await supabase.from('profiles').select('email').eq('id', ownerId).maybeSingle()
  if (email && owner?.email && owner.email.trim().toLowerCase() === email) {
    return { ok: false, error: 'That is the account email already. It gets every message.' }
  }

  if (!id) {
    const current = await listFamilyContacts(supabase, ownerId)
    if (current.length >= MAX_FAMILY_CONTACTS) {
      return { ok: false, error: `Up to ${MAX_FAMILY_CONTACTS} people can be added. Remove one first.` }
    }
  }

  const { error } = id
    ? await supabase
        .from('family_contacts')
        .update({ name, email, phone, ...coach })
        .eq('id', id)
        .eq('owner_id', ownerId)
        .is('removed_at', null)
    : await supabase.from('family_contacts').insert({ owner_id: ownerId, name, email, phone, source, ...coach })
  if (error) {
    // 23505: that email is already on this family's list.
    return { ok: false, error: error.code === '23505' ? 'That email is already on the list.' : error.message }
  }
  return { ok: true }
}

export async function removeFamilyContact(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  id: string
): Promise<FamilyContactResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Invalid contact' }
  const { error } = await supabase
    .from('family_contacts')
    .update({ removed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ownerId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * "Ava and Max" when a contact gets messages about only some of the family's
 * wrestlers, or null when it covers all of them (or there is only one).
 */
export function contactScopeLabel(
  athleteIds: string[] | null,
  wrestlers: { id: string; first_name: string }[]
): string | null {
  if (athleteIds === null || wrestlers.length < 2) return null
  const covered = wrestlers.filter((w) => athleteIds.includes(w.id))
  if (covered.length === wrestlers.length) return null
  if (!covered.length) return 'a wrestler no longer on this family'
  const names = covered.map((w) => w.first_name)
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/**
 * Whether a person said Yes to coaching on a registration form: the forms'
 * parents/guardians matched by email, or by name when there is no email.
 */
export function coachInterestMatcher(
  forms: { name: string | null; email: string | null; coach_interest: string | null }[]
): (email: string | null | undefined, name: string | null | undefined) => boolean {
  const yes = forms.filter((f) => (f.coach_interest ?? '').trim().toLowerCase() === 'yes')
  const emails = new Set(yes.flatMap((f) => (f.email ? [f.email.trim().toLowerCase()] : [])))
  const names = new Set(yes.flatMap((f) => (f.name ? [f.name.trim().toLowerCase()] : [])))
  return (email, name) =>
    Boolean((email && emails.has(email.trim().toLowerCase())) || (name && names.has(name.trim().toLowerCase())))
}
