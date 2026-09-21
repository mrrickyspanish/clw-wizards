import { NextResponse } from 'next/server'

import { verifyQstashSignature } from '@/lib/qstash'
import { resolveRecipients } from '@/lib/comms/recipients'
import { sendCommEmail } from '@/lib/comms/send-email'
import { sendSms } from '@/lib/twilio/send-sms'
import type { BlastRequestBody } from '@/app/api/comms/blast/route'

/**
 * Resend rejects anything past 10 requests/second with a 429.
 *
 * This previously sent in batches of 25 fired concurrently, looping straight
 * into the next batch: production logs measured 25, 68 and 33 requests in
 * consecutive seconds against a 10/second ceiling, and 106 of 126 sends came
 * back 429. Every one was logged as a failed row nobody was shown.
 *
 * Batching is the wrong shape for a rate limit. Even a batch small enough to
 * fit under the ceiling straddles it at the boundary, because one batch's
 * requests land late in its window while the next batch's land early in the
 * following one. Spacing individual requests is what the limit actually
 * measures, so each send starts a fixed interval after the previous one.
 *
 * Eight per second rather than ten leaves room for clock jitter and for the
 * retries QStash may deliver.
 */
const SENDS_PER_SECOND = 8
const MIN_SEND_INTERVAL_MS = Math.ceil(1000 / SENDS_PER_SECOND)

/**
 * Paced sending is bounded by the function timeout: SENDS_PER_SECOND for
 * maxDuration seconds, so roughly 480 recipients. That clears the current
 * roster comfortably. A list beyond it needs the job split across several
 * QStash messages rather than a longer timeout.
 */
export const maxDuration = 60

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

  const wantsEmail = payload.channel === 'email' || payload.channel === 'both'
  const wantsSms = payload.channel === 'sms' || payload.channel === 'both'

  // Requests are started on a fixed cadence but not awaited in sequence: a
  // slow response delays that recipient, never the ones behind it.
  const inFlight: Promise<void>[] = []
  let nextSlotAt = Date.now()

  for (const profile of recipients) {
    const waitMs = nextSlotAt - Date.now()
    if (waitMs > 0) await sleep(waitMs)
    nextSlotAt = Date.now() + MIN_SEND_INTERVAL_MS

    inFlight.push(
      (async () => {
        if (wantsEmail && profile.email) {
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

        if (wantsSms && profile.sms_opt_in && profile.phone) {
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
      })()
    )
  }

  await Promise.all(inFlight)

  return NextResponse.json({
    ok: true,
    totalRecipients: recipients.length,
    emailsSent,
    emailsFailed,
    smsSent,
    smsFailed,
  })
}
