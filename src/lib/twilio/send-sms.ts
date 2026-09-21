import { getTwilioClient } from './client'
import { createAdminSupabase } from '@/lib/supabase/admin'
import type { CommType } from '@/types/database'

interface SendSmsParams {
  profileId: string
  to: string
  body: string
  commType: CommType
  tournamentId?: string
  // Groups this row with the rest of the same compose-form send or cron
  // firing, for the admin blast-history view.
  blastId?: string | null
}

interface SendSmsResult {
  ok: boolean
  sid?: string
  errorCode?: string
  errorMessage?: string
}

/**
 * Sends a single SMS and logs the outcome to communication_log. Callers must
 * have already filtered recipients by profiles.sms_opt_in = true — this
 * function does not re-check it, since bulk callers already query for it.
 */
export async function sendSms({
  profileId,
  to,
  body,
  commType,
  tournamentId,
  blastId,
}: SendSmsParams): Promise<SendSmsResult> {
  const supabase = createAdminSupabase()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!fromNumber) {
    await supabase.from('communication_log').insert({
      channel: 'sms',
      comm_type: commType,
      recipient_id: profileId,
      recipient_phone: to,
      tournament_id: tournamentId ?? null,
      body_preview: body.slice(0, 160),
      status: 'failed',
      blast_id: blastId ?? null,
    })
    return { ok: false, errorMessage: 'TWILIO_PHONE_NUMBER is not configured.' }
  }

  try {
    const message = await getTwilioClient().messages.create({ to, from: fromNumber, body })

    await supabase.from('communication_log').insert({
      channel: 'sms',
      comm_type: commType,
      recipient_id: profileId,
      recipient_phone: to,
      tournament_id: tournamentId ?? null,
      body_preview: body.slice(0, 160),
      status: 'sent',
      external_id: message.sid,
      blast_id: blastId ?? null,
    })

    return { ok: true, sid: message.sid }
  } catch (err) {
    // Twilio error codes worth knowing: 21211 invalid number, 21610 unsubscribed
    // (recipient texted STOP), 21614 not SMS-capable. Logged as failed either way.
    const code = (err as { code?: number })?.code
    const message = err instanceof Error ? err.message : 'Unknown Twilio error'

    await supabase.from('communication_log').insert({
      channel: 'sms',
      comm_type: commType,
      recipient_id: profileId,
      recipient_phone: to,
      tournament_id: tournamentId ?? null,
      body_preview: body.slice(0, 160),
      status: 'failed',
      external_id: code ? String(code) : null,
      blast_id: blastId ?? null,
    })

    return { ok: false, errorCode: code ? String(code) : undefined, errorMessage: message }
  }
}
