import { Resend } from 'resend'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'

/**
 * Upload notices: one short email to the people on the "Upload notices" list
 * (Admin -> Communications) when a family uploads a USA Wrestling card or a
 * birth certificate, with a link straight to it on the To review page, so
 * nobody has to click through families to find it.
 *
 * A notice must never fail an upload: callers send it after the upload is
 * saved, and every error here is caught and logged. An empty list sends nothing.
 */

export type ReviewableDocType = 'birth_certificate' | 'usa_wrestling_card'

export const DOC_LABELS: Record<ReviewableDocType, string> = {
  birth_certificate: 'Birth certificate',
  usa_wrestling_card: 'USA Wrestling card',
}

export function uploadNotice(f: {
  docType: ReviewableDocType
  documentId: string
  wrestlerName: string
  uploaderName: string | null
  siteUrl: string
}): { subject: string; text: string } {
  const label = DOC_LABELS[f.docType]
  const site = f.siteUrl.replace(/\/$/, '')
  return {
    subject: `${label} uploaded: ${f.wrestlerName}`,
    text: [
      `${f.uploaderName ?? 'A family'} uploaded ${f.wrestlerName}'s ${f.docType === 'birth_certificate' ? 'birth certificate' : label}.`,
      '',
      `Review it: ${site}/admin/review#doc-${f.documentId}`,
    ].join('\n'),
  }
}

async function uploadNoticeRecipients(): Promise<string[]> {
  const { data, error } = await createAdminSupabase().from('upload_notice_recipients').select('email')
  if (error) throw error
  const seen = new Set<string>()
  return (data ?? [])
    .map((row) => (row.email as string).trim())
    .filter((email) => email && !seen.has(email.toLowerCase()) && Boolean(seen.add(email.toLowerCase())))
}

export async function sendUploadNotice(f: {
  docType: ReviewableDocType
  documentId: string
  wrestlerName: string
  uploaderName: string | null
}): Promise<void> {
  try {
    const key = process.env.RESEND_API_KEY
    if (!key) return
    const to = await uploadNoticeRecipients()
    if (!to.length) return
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`
    const { subject, text } = uploadNotice({ ...f, siteUrl })
    const resend = new Resend(key)
    const send = () =>
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`,
        to,
        subject,
        text,
      })
    // One retry covers a passing Resend or network blip.
    let { error } = await send()
    if (error) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      ;({ error } = await send())
    }
    if (error) console.error('Upload notice email failed:', error.message)
  } catch (err) {
    console.error('Upload notice email failed:', err)
  }
}
