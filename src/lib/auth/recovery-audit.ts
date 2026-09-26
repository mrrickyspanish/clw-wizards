import { readCredential } from '@/lib/env'

interface SentEmail {
  id: string
  to: string[]
  subject: string
  created_at: string
  last_event: string
}

interface SentEmailPage {
  data: SentEmail[]
  has_more: boolean
}

export async function auditPasswordRecovery(now = Date.now()): Promise<{ ok: boolean; reason: string; checked: number }> {
  const key = readCredential('RESEND_API_KEY')
  const canary = readCredential('PASSWORD_RESET_CANARY_EMAIL')?.toLowerCase()
  if (!key || !canary) return { ok: false, reason: 'configuration-missing', checked: 0 }

  const recentCutoff = now - 30 * 60 * 1000
  const canaryCutoff = now - 26 * 60 * 60 * 1000
  let cursor: string | undefined
  let canaryDelivered = false
  let checked = 0

  // The installed Resend SDK predates emails.list(), so use the documented
  // read-only GET /emails endpoint. Stop after the 26-hour canary window.
  for (let page = 0; page < 20; page++) {
    const url = new URL('https://api.resend.com/emails')
    url.searchParams.set('limit', '100')
    if (cursor) url.searchParams.set('after', cursor)
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })
    if (!response.ok) return { ok: false, reason: `provider-${response.status}`, checked }
    const listing = await response.json() as SentEmailPage
    if (!Array.isArray(listing.data)) return { ok: false, reason: 'invalid-provider-response', checked }
    for (const mail of listing.data) {
      checked++
      const sentAt = Date.parse(mail.created_at)
      if (!Number.isFinite(sentAt)) return { ok: false, reason: 'invalid-provider-date', checked }
      if (sentAt < canaryCutoff) break
      if (mail.subject !== 'Reset your password') continue
      const outcome = mail.last_event.toLowerCase()
      const delivered = ['delivered', 'opened', 'clicked'].includes(outcome)
      if (mail.to.some((address) => address.toLowerCase() === canary) && delivered) canaryDelivered = true
      // Check every real parent's recovery message as well as the canary.
      if (['bounced', 'suppressed', 'complained', 'failed', 'canceled'].includes(outcome)) {
        return { ok: false, reason: `delivery-${outcome}`, checked }
      }
      if (sentAt < recentCutoff) {
        if (!delivered) return { ok: false, reason: 'delivery-overdue', checked }
      }
    }
    if (!listing.has_more || listing.data.length === 0 || Date.parse(listing.data.at(-1)!.created_at) < canaryCutoff) {
      return canaryDelivered
        ? { ok: true, reason: 'delivered', checked }
        : { ok: false, reason: 'canary-missing', checked }
    }
    cursor = listing.data.at(-1)!.id
  }
  return { ok: false, reason: 'pagination-limit', checked }
}
