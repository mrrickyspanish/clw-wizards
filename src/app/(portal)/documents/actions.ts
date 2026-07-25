'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { resolveFamilyOwnerIds } from '@/lib/family'

export type ActionResult = { ok: true } | { ok: false; error: string }

const recordSchema = z.object({
  athleteId: z.string().uuid(),
  docType: z.enum(['birth_certificate', 'usa_wrestling_card', 'other']),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1).max(200),
})

// The file itself is uploaded client-side to the private 'athlete-documents'
// bucket (storage RLS requires the path to start with the user's id). This just
// records the metadata row, which parents_own_athlete_docs RLS scopes to self.
export async function recordDocument(values: z.input<typeof recordSchema>): Promise<ActionResult> {
  const parsed = recordSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const { athleteId, docType, fileUrl, fileName } = parsed.data

  // Confirm the athlete is on the user's family roster (own or co-guardianed)
  // before attaching a document.
  const familyOwnerIds = await resolveFamilyOwnerIds(supabase, user.id)
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('id', athleteId)
    .in('parent_id', familyOwnerIds)
    .maybeSingle()
  if (!athlete) return { ok: false, error: 'That wrestler is not on your roster.' }

  // Replace-in-place: a slot holds one document per (athlete, doc_type). Record
  // the caller's own prior row(s) for this slot, insert the new upload, then
  // remove the old one(s) — so "Replace" swaps the file instead of stacking a
  // second row (the older of which the documents view was surfacing). Insert
  // first so a failure here never empties the slot; the cleanup delete is
  // RLS-scoped to the caller's own rows. A replaced doc starts unverified again
  // (fresh row defaults verified=false), which is correct — it needs re-review.
  const { data: priorOwn } = await supabase
    .from('athlete_documents')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('doc_type', docType)
    .eq('parent_id', user.id)

  const { error } = await supabase.from('athlete_documents').insert({
    athlete_id: athleteId,
    parent_id: user.id,
    doc_type: docType,
    file_url: fileUrl,
    file_name: fileName,
  })
  if (error) return { ok: false, error: error.message }

  const priorIds = (priorOwn ?? []).map((r) => r.id)
  if (priorIds.length) {
    await supabase.from('athlete_documents').delete().in('id', priorIds)
  }

  revalidatePath('/documents')
  revalidatePath('/dashboard')
  return { ok: true }
}

export type SignedUrlResult = { ok: true; url: string } | { ok: false; error: string }

// Private bucket: hand back a short-lived signed URL for viewing.
export async function getDocumentUrl(path: string): Promise<SignedUrlResult> {
  if (!path) return { ok: false, error: 'Missing file' }
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.storage.from('athlete-documents').createSignedUrl(path, 60)
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not open file' }
  return { ok: true, url: data.signedUrl }
}
