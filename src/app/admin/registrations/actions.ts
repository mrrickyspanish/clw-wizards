'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'

export type ActionResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Admin access required.' }
  return { ok: true, userId: auth.user.id }
}

function revalidateRegistrationSurfaces() {
  revalidatePath('/admin/registrations')
  revalidatePath('/registration')
  revalidatePath('/dashboard')
  revalidatePath('/documents')
}

const documentSchema = z.object({ documentId: z.string().uuid(), verified: z.boolean() })

export async function setDocumentVerified(values: z.input<typeof documentSchema>): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const parsed = documentSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid document.' }

  const admin = createAdminSupabase()
  const { data: document, error: documentError } = await admin
    .from('athlete_documents')
    .select('id, doc_type')
    .eq('id', parsed.data.documentId)
    .maybeSingle()

  if (documentError) return { ok: false, error: documentError.message }
  if (!document || document.doc_type !== 'usa_wrestling_card') {
    return { ok: false, error: 'USA Wrestling card not found.' }
  }

  if (!parsed.data.verified) {
    const { data: approvedEnrollment } = await admin
      .from('season_enrollments')
      .select('id')
      .eq('usa_card_document_id', parsed.data.documentId)
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle()

    if (approvedEnrollment) {
      return { ok: false, error: 'This card belongs to an approved registration and can no longer be unverified.' }
    }
  }

  const { data, error } = await admin
    .from('athlete_documents')
    .update({
      verified: parsed.data.verified,
      verified_by: parsed.data.verified ? auth.userId : null,
      verified_at: parsed.data.verified ? new Date().toISOString() : null,
    })
    .eq('id', parsed.data.documentId)
    .eq('doc_type', 'usa_wrestling_card')
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Document not found.' }

  revalidateRegistrationSurfaces()
  return { ok: true }
}

export type SignedUrlResult = { ok: true; url: string } | { ok: false; error: string }

export async function getAdminDocumentUrl(documentId: string): Promise<SignedUrlResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  if (!z.string().uuid().safeParse(documentId).success) return { ok: false, error: 'Invalid document.' }

  const admin = createAdminSupabase()
  const { data: document, error } = await admin
    .from('athlete_documents')
    .select('file_url')
    .eq('id', documentId)
    .maybeSingle()

  if (error || !document) return { ok: false, error: error?.message ?? 'Document not found.' }

  const { data, error: urlError } = await admin.storage.from('athlete-documents').createSignedUrl(document.file_url, 120)
  if (urlError || !data) return { ok: false, error: urlError?.message ?? 'Could not open document.' }
  return { ok: true, url: data.signedUrl }
}

const reviewSchema = z.object({
  enrollmentId: z.string().uuid(),
  status: z.enum(['changes_requested', 'approved', 'withdrawn']),
  note: z.string().trim().max(1000).optional().nullable(),
})

export async function reviewSeasonEnrollment(values: z.input<typeof reviewSchema>): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const parsed = reviewSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid review.' }
  if (parsed.data.status === 'changes_requested' && !parsed.data.note) {
    return { ok: false, error: 'Tell the parent what needs to be updated.' }
  }

  const admin = createAdminSupabase()
  const { data: enrollment, error: enrollmentError } = await admin
    .from('season_enrollments')
    .select('*')
    .eq('id', parsed.data.enrollmentId)
    .maybeSingle()

  if (enrollmentError || !enrollment) {
    return { ok: false, error: enrollmentError?.message ?? 'Registration not found.' }
  }
  if (enrollment.status === 'approved' && parsed.data.status !== 'approved') {
    return { ok: false, error: 'Approved registrations are locked. Contact a full administrator for a manual correction.' }
  }

  const [{ data: season }, { data: athlete }, { data: parent }, { data: dues }, { data: card }] = await Promise.all([
    admin.from('season_registrations').select('*').eq('id', enrollment.season_registration_id).single(),
    admin.from('athletes').select('first_name, last_name').eq('id', enrollment.athlete_id).single(),
    admin.from('profiles').select('full_name, email').eq('id', enrollment.parent_id).single(),
    enrollment.dues_payment_id
      ? admin.from('dues_payments').select('status').eq('id', enrollment.dues_payment_id).single()
      : Promise.resolve({ data: null, error: null }),
    enrollment.usa_card_document_id
      ? admin.from('athlete_documents').select('id, verified').eq('id', enrollment.usa_card_document_id).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!season || !athlete) return { ok: false, error: 'Registration details are incomplete.' }

  if (parsed.data.status === 'approved') {
    if (season.require_usa_card && !card?.verified) {
      return { ok: false, error: 'Verify the current-season USA Wrestling card before approving this registration.' }
    }
    if (season.dues_amount_cents > 0 && dues?.status !== 'paid' && dues?.status !== 'waived') {
      return { ok: false, error: 'Season dues must be paid or waived before approval.' }
    }
  }

  const { error: updateError } = await admin
    .from('season_enrollments')
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.note || null,
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', enrollment.id)

  if (updateError) return { ok: false, error: updateError.message }

  if (parent?.email) {
    try {
      await sendStatusEmail({
        to: parent.email,
        parentName: parent.full_name,
        athleteName: `${athlete.first_name} ${athlete.last_name}`,
        seasonLabel: season.season_label,
        status: parsed.data.status,
        note: parsed.data.note || null,
      })
    } catch (error) {
      console.error('Season registration status email failed:', error)
    }
  }

  revalidateRegistrationSurfaces()
  return { ok: true }
}

async function sendStatusEmail(params: {
  to: string
  parentName: string | null
  athleteName: string
  seasonLabel: string
  status: 'changes_requested' | 'approved' | 'withdrawn'
  note: string | null
}) {
  const key = process.env.RESEND_API_KEY
  if (!key) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`
  const firstName = params.parentName?.split(' ')[0] || 'there'
  const subject =
    params.status === 'approved'
      ? `${params.athleteName} is approved for ${params.seasonLabel}`
      : params.status === 'changes_requested'
        ? `Update needed for ${params.athleteName}'s registration`
        : `${params.athleteName}'s registration was withdrawn`

  const statusCopy =
    params.status === 'approved'
      ? `The club approved ${params.athleteName}'s registration for ${params.seasonLabel}. The wrestler is cleared for the season.`
      : params.status === 'changes_requested'
        ? `The club reviewed ${params.athleteName}'s registration and needs an update before it can be approved.`
        : `${params.athleteName}'s registration for ${params.seasonLabel} was marked withdrawn.`

  const resend = new Resend(key)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`,
    to: params.to,
    subject,
    text: `Hi ${firstName},\n\n${statusCopy}${params.note ? `\n\nClub note: ${params.note}` : ''}\n\nView registration: ${siteUrl}/registration\n\n${ORG.name}`,
  })

  if (error) throw new Error(error.message)
}
