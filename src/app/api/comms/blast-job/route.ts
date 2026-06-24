import { NextResponse } from 'next/server'

import { verifyQstashSignature } from '@/lib/qstash'
import { resolveRecipients } from '@/lib/comms/recipients'
import { sendCommEmail } from '@/lib/comms/send-email'
import { sendSms } from '@/lib/twilio/send-sms'
import type { BlastRequestBody } from '@/app/api/comms/blast/route'

const BATCH_SIZE = 25

export async function POST(request: Request) {
  const rawBody = await request.text()
  const verified = await verifyQstashSignature(request, rawBody)
  if (!verified) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as BlastRequestBody
  const recipients = await resolveRecipients(payload.target)

  const tournamentId = payload.target.type === 'tournament_registrants' ? payload.target.tournamentId : undefined

  let emailsSent = 0
  let emailsFailed = 0
  let smsSent = 0
  let smsFailed = 0

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (profile) => {
        if ((payload.channel === 'email' || payload.channel === 'both') && profile.email) {
          const result = await sendCommEmail({
            profileId: profile.id,
            to: profile.email,
            subject: payload.subject ?? '',
            html: payload.message,
            commType: payload.commType,
            tournamentId,
          })
          if (result.ok) emailsSent += 1
          else emailsFailed += 1
        }

        if ((payload.channel === 'sms' || payload.channel === 'both') && profile.sms_opt_in && profile.phone) {
          const result = await sendSms({
            profileId: profile.id,
            to: profile.phone,
            body: payload.message,
            commType: payload.commType,
            tournamentId,
          })
          if (result.ok) smsSent += 1
          else smsFailed += 1
        }
      })
    )
  }

  return NextResponse.json({
    ok: true,
    totalRecipients: recipients.length,
    emailsSent,
    emailsFailed,
    smsSent,
    smsFailed,
  })
}
