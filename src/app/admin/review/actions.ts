'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'
import { setDocumentVerified } from '../registrations/actions'

export type ActionResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not authenticated.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Admin access required.' }
  return { ok: true, userId: auth.user.id }
}

function revalidateReviewSurfaces() {
  revalidatePath('/admin/review')
  revalidatePath('/admin/registrations')
  revalidatePath('/admin/families', 'layout')
  revalidatePath('/admin', 'layout')
  revalidatePath('/documents')
  revalidatePath('/registration')
  revalidatePath('/dashboard')
}

const verifySchema = z.object({
  documentId: z.string().uuid(),
  // USA card only: the number read off the card. Blank leaves the number as is.
  cardNumber: z.string().trim().max(40, 'That card number is too long.').optional(),
})

/**
 * Verify an upload from To review. For a USA card, the card number typed next
 * to it is saved on the wrestler first, so reading the card and recording it
 * is one step.
 */
export async function verifyUpload(values: z.input<typeof verifySchema>): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const parsed = verifySchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const admin = createAdminSupabase()
  const { data: doc, error } = await admin
    .from('athlete_documents')
    .select('id, athlete_id, doc_type')
    .eq('id', parsed.data.documentId)
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!doc) return { ok: false, error: 'That upload is no longer on file. Refresh the page.' }

  if (doc.doc_type === 'usa_wrestling_card' && parsed.data.cardNumber) {
    const { error: cardError } = await admin
      .from('athletes')
      .update({ usa_wrestling_card_number: parsed.data.cardNumber })
      .eq('id', doc.athlete_id)
    if (cardError) return { ok: false, error: cardError.message }
  }

  const result = await setDocumentVerified({ documentId: doc.id, verified: true })
  if (!result.ok) return result
  revalidateReviewSurfaces()
  return { ok: true }
}

const rejectSchema = z.object({
  documentId: z.string().uuid(),
  reason: z.string().trim().min(1, 'Choose or type a reason.').max(300, 'Keep the reason under 300 characters.'),
})

/**
 * Reject an upload that isn't right. The upload is removed, so the wrestler
 * is missing that document again everywhere (missing-document emails,
 * Registrations, Families, the family's Documents page). What was rejected and
 * why is kept in document_rejections, the file stays in storage, and the
 * family is emailed the reason with a link to upload a new one.
 */
export async function rejectUpload(values: z.input<typeof rejectSchema>): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const parsed = rejectSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const admin = createAdminSupabase()
  const { data: doc, error } = await admin
    .from('athlete_documents')
    .select('id, athlete_id, parent_id, doc_type, file_name, file_url, uploaded_at, verified')
    .eq('id', parsed.data.documentId)
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!doc) return { ok: false, error: 'That upload is no longer on file. Refresh the page.' }
  if (doc.doc_type !== 'usa_wrestling_card' && doc.doc_type !== 'birth_certificate') {
    return { ok: false, error: 'Only USA cards and birth certificates are reviewed here.' }
  }
  if (doc.verified) return { ok: false, error: 'This upload is already verified. Undo the verification first.' }

  // A card an approved registration rests on stays, the same rule as unverifying.
  if (doc.doc_type === 'usa_wrestling_card') {
    const { data: approved } = await admin
      .from('season_enrollments')
      .select('id')
      .eq('usa_card_document_id', doc.id)
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle()
    if (approved) return { ok: false, error: 'This card belongs to an approved registration and can’t be rejected.' }
  }

  const { data: rejection, error: logError } = await admin
    .from('document_rejections')
    .insert({
      athlete_id: doc.athlete_id,
      parent_id: doc.parent_id,
      doc_type: doc.doc_type,
      reason: parsed.data.reason,
      file_name: doc.file_name,
      file_url: doc.file_url,
      uploaded_at: doc.uploaded_at,
      rejected_by: auth.userId,
    })
    .select('id')
    .single()
  if (logError || !rejection) return { ok: false, error: logError?.message ?? 'Could not record the rejection.' }

  const { error: removeError } = await admin.from('athlete_documents').delete().eq('id', doc.id)
  if (removeError) {
    // Keep the two in step: no rejection on record for an upload still on file.
    await admin.from('document_rejections').delete().eq('id', rejection.id)
    return { ok: false, error: removeError.message }
  }

  await emailFamily(admin, doc.athlete_id, doc.parent_id, doc.doc_type, parsed.data.reason)
  revalidateReviewSurfaces()
  return { ok: true }
}

// The parent who uploaded it and the wrestler's own account, once each.
async function emailFamily(
  admin: ReturnType<typeof createAdminSupabase>,
  athleteId: string,
  uploaderId: string,
  docType: 'usa_wrestling_card' | 'birth_certificate',
  reason: string
) {
  try {
    const key = process.env.RESEND_API_KEY
    if (!key) return
    const { data: athlete } = await admin
      .from('athletes')
      .select('first_name, last_name, parent_id')
      .eq('id', athleteId)
      .maybeSingle()
    if (!athlete) return
    const { data: people } = await admin
      .from('profiles')
      .select('email, full_name')
      .in('id', [...new Set([uploaderId, athlete.parent_id])])
    const recipients = (people ?? []).filter((p) => p.email)
    if (!recipients.length) return

    const label = docType === 'usa_wrestling_card' ? 'USA Wrestling card' : 'birth certificate'
    const wrestler = `${athlete.first_name} ${athlete.last_name}`
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`).replace(/\/$/, '')
    const resend = new Resend(key)
    for (const person of recipients) {
      const firstName = person.full_name?.split(' ')[0] || 'there'
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`,
        to: person.email as string,
        subject: `Please upload a new ${label} for ${wrestler}`,
        text: `Hi ${firstName},\n\nThe club looked at the ${label} uploaded for ${wrestler} and needs a new one.\n\n${reason}\n\nUpload it here: ${siteUrl}/documents\n\n${ORG.name}`,
      })
      if (error) console.error('Rejection email failed:', error.message)
    }
  } catch (err) {
    console.error('Rejection email failed:', err)
  }
}
