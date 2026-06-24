import { Resend } from 'resend'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'
import type { CommType } from '@/types/database'

interface SendCommEmailParams {
  profileId: string
  to: string
  subject: string
  html: string
  commType: CommType
  tournamentId?: string
}

interface SendCommEmailResult {
  ok: boolean
  id?: string
  errorMessage?: string
}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`

/**
 * Sends a single comms email and logs the outcome to communication_log, same
 * convention as lib/twilio/send-sms.ts. Callers resolve the recipient list
 * themselves (see lib/comms/recipients.ts) — this function only sends + logs.
 */
export async function sendCommEmail({
  profileId,
  to,
  subject,
  html,
  commType,
  tournamentId,
}: SendCommEmailParams): Promise<SendCommEmailResult> {
  const supabase = createAdminSupabase()
  const resendKey = process.env.RESEND_API_KEY

  if (!resendKey) {
    await supabase.from('communication_log').insert({
      channel: 'email',
      comm_type: commType,
      recipient_id: profileId,
      recipient_email: to,
      tournament_id: tournamentId ?? null,
      subject,
      body_preview: html.slice(0, 160),
      status: 'failed',
    })
    return { ok: false, errorMessage: 'RESEND_API_KEY is not configured.' }
  }

  try {
    const resend = new Resend(resendKey)
    const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to: [to], subject, html })

    if (error) throw new Error(error.message)

    await supabase.from('communication_log').insert({
      channel: 'email',
      comm_type: commType,
      recipient_id: profileId,
      recipient_email: to,
      tournament_id: tournamentId ?? null,
      subject,
      body_preview: html.slice(0, 160),
      status: 'sent',
      external_id: data?.id ?? null,
    })

    return { ok: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Resend error'

    await supabase.from('communication_log').insert({
      channel: 'email',
      comm_type: commType,
      recipient_id: profileId,
      recipient_email: to,
      tournament_id: tournamentId ?? null,
      subject,
      body_preview: html.slice(0, 160),
      status: 'failed',
    })

    return { ok: false, errorMessage: message }
  }
}
