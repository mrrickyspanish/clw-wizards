'use server'

import { revalidatePath } from 'next/cache'

import { createServerSupabase } from '@/lib/supabase/server'
import {
  removeFamilyContact,
  saveFamilyContact,
  type FamilyContactInput,
  type FamilyContactResult,
} from '@/lib/family-contacts'

// The signed-in parent's own contacts only: RLS lets an owner read and change
// rows where owner_id is their id, and nothing else.

export async function saveMyFamilyContact(values: FamilyContactInput): Promise<FamilyContactResult> {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }
  const result = await saveFamilyContact(supabase, auth.user.id, values, 'family')
  if (result.ok) revalidatePath('/profile')
  return result
}

export async function removeMyFamilyContact(id: string): Promise<FamilyContactResult> {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not signed in' }
  const result = await removeFamilyContact(supabase, auth.user.id, id)
  if (result.ok) revalidatePath('/profile')
  return result
}
