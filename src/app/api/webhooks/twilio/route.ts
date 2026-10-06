import twilio from 'twilio'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { getTwilioClient } from '@/lib/twilio/client'
import { twilioSender } from '@/lib/twilio/sender'
import { toE164 } from '@/lib/phone'
import { siteUrl } from '@/lib/qstash'

// Texts sent TO the club number land here (the Messaging Service's incoming
// message webhook). Twilio itself answers STOP, START and HELP and blocks
// sends to anyone who stopped; this keeps the site's opt-in record in step
// with that, and passes every other reply on to a coach's phone
// (TWILIO_FORWARD_TO), since nobody reads the club number's inbox.

const STOP_WORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT', 'REVOKE'])
const START_WORDS = new Set(['START', 'YES', 'UNSTOP'])
const HELP_WORDS = new Set(['HELP', 'INFO'])

// An empty reply: Twilio sends nothing back beyond its own STOP/HELP answers.
function emptyTwiml() {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}

function displayPhone(e164: string): string {
  const d = e164.replace(/^\+1/, '')
  return /^\d{10}$/.test(d) ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : e164
}

// The address Twilio signed. Behind Vercel the request URL can come through as
// http, so the configured public address is tried as well.
function signedUrls(request: Request): string[] {
  const seen = new URL(request.url)
  seen.protocol = 'https:'
  return [...new Set([request.url, seen.toString(), `${siteUrl()}/api/webhooks/twilio`])]
}

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const signature = request.headers.get('x-twilio-signature') ?? ''
  const raw = await request.text()
  const params = Object.fromEntries(new URLSearchParams(raw))

  if (!authToken || !signature || !signedUrls(request).some((url) => twilio.validateRequest(authToken, signature, url, params))) {
    return new Response('Invalid signature', { status: 403 })
  }

  const from = toE164(params.From)
  const body = (params.Body ?? '').trim()
  const keyword = (params.OptOutType || body).toUpperCase()
  if (!from) return emptyTwiml()

  const supabase = createAdminSupabase()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone, consent_text')
    .not('phone', 'is', null)
  const senders = (profiles ?? []).filter((p) => toE164(p.phone) === from)

  if (STOP_WORDS.has(keyword)) {
    if (senders.length) {
      await supabase.from('profiles').update({ sms_opt_in: false }).in('id', senders.map((p) => p.id))
    }
    return emptyTwiml()
  }

  if (START_WORDS.has(keyword)) {
    // Only someone who opted in on the site before (and so has consent on
    // record) is switched back on by texting START.
    const returning = senders.filter((p) => p.consent_text)
    if (returning.length) {
      await supabase
        .from('profiles')
        .update({ sms_opt_in: true, sms_opt_in_at: new Date().toISOString() })
        .in('id', returning.map((p) => p.id))
    }
    return emptyTwiml()
  }

  if (HELP_WORDS.has(keyword)) return emptyTwiml()

  // Any other reply goes to the coach's phone. Never back to the coach's own
  // texts, which would loop.
  const forwardTo = toE164(process.env.TWILIO_FORWARD_TO)
  const sender = twilioSender()
  const hasMedia = Number(params.NumMedia ?? 0) > 0
  if (forwardTo && sender && from !== forwardTo && (body || hasMedia)) {
    const who = senders.map((p) => p.full_name).filter(Boolean).join(' / ') || 'Unknown number'
    const text = `CLW reply from ${who} ${displayPhone(from)}: ${body}${hasMedia ? ' [sent a photo]' : ''}`.slice(0, 640)
    try {
      await getTwilioClient().messages.create({ to: forwardTo, body: text, ...sender })
    } catch (err) {
      console.error('[twilio webhook] could not forward a reply:', err instanceof Error ? err.message : err)
    }
  }

  return emptyTwiml()
}
