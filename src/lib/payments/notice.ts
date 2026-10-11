import { Resend } from 'resend'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { formatCents } from '@/lib/format/money'
import { ORG } from '@/config/org.config'

/**
 * Payment notices: one short email to the people on the "Payment notices"
 * list (Admin -> Communications) every time money moves through Stripe --
 * dues, donations, sponsorships, renewals, and the ones a treasurer most needs
 * to see: refunds, disputes and failed recurring cards. Names and amounts
 * only; never card details.
 *
 * A notice must never fail or repeat a payment: callers send it only after
 * the payment is recorded, and every error here is caught and logged.
 */

export type PaymentNotice = { subject: string; lines: (string | null | undefined)[] }

/** The list's addresses. An empty or unreadable list falls back to the club contact. */
export async function paymentNoticeRecipients(): Promise<string[]> {
  try {
    const { data, error } = await createAdminSupabase().from('payment_notice_recipients').select('email')
    if (error) throw error
    const seen = new Set<string>()
    const emails = (data ?? [])
      .map((row) => (row.email as string).trim())
      .filter((email) => email && !seen.has(email.toLowerCase()) && Boolean(seen.add(email.toLowerCase())))
    if (emails.length) return emails
  } catch (err) {
    console.error('Payment notice list unavailable, sending to the club contact:', err)
  }
  return [ORG.contactEmail]
}

export async function sendPaymentNotice(notice: PaymentNotice): Promise<void> {
  try {
    const key = process.env.RESEND_API_KEY
    if (!key) return
    const to = await paymentNoticeRecipients()
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`).replace(/\/$/, '')
    const text = [...notice.lines.filter((line): line is string => line != null), '', `Dues: ${siteUrl}/admin/dues`].join('\n')
    const resend = new Resend(key)
    const send = () =>
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`,
        to,
        subject: notice.subject,
        text,
      })
    // One retry covers a passing Resend or network blip.
    let { error } = await send()
    if (error) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      ;({ error } = await send())
    }
    if (error) console.error('Payment notice email failed:', error.message)
  } catch (err) {
    console.error('Payment notice email failed:', err)
  }
}

export type DuesNoticeFacts = {
  parentName: string | null
  wrestlerName: string | null
  paidNowCents: number
  paidTotalCents: number
  amountCents: number
  season: string
  // This season's dues rows, for the running count.
  seasonRows: { status: string; amount_cents: number; amount_paid_cents: number }[]
}

export function duesPaymentNotice(f: DuesNoticeFacts): PaymentNotice {
  const who = f.wrestlerName ?? 'a wrestler'
  const remaining = Math.max(0, f.amountCents - f.paidTotalCents)
  const settled = f.seasonRows.filter((row) => row.status === 'paid' || row.status === 'waived').length
  const collected = f.seasonRows.reduce((sum, row) => sum + row.amount_paid_cents, 0)
  return {
    subject: `Dues paid: ${who} (${formatCents(f.paidNowCents)})`,
    lines: [
      `${f.parentName ?? 'A family'} paid ${formatCents(f.paidNowCents)} in season dues for ${who}.`,
      remaining === 0
        ? 'Paid in full.'
        : `${formatCents(f.paidTotalCents)} paid of ${formatCents(f.amountCents)}, ${formatCents(remaining)} left.`,
      '',
      `${f.season}: ${settled} of ${f.seasonRows.length} wrestlers paid in full, ${formatCents(collected)} collected.`,
    ],
  }
}

export function giftNotice(f: {
  kind: 'donation' | 'sponsorship'
  name: string | null
  email: string | null
  amountCents: number
  recurring: boolean
  renewal?: boolean
  tier?: string | null
}): PaymentNotice {
  const who = f.name ?? f.email ?? 'Someone'
  const what = f.kind === 'donation' ? 'donation' : `sponsorship${f.tier ? ` (${f.tier})` : ''}`
  return {
    subject: `${f.renewal ? 'Renewal' : f.kind === 'donation' ? 'Donation' : 'New sponsor'}: ${who} (${formatCents(f.amountCents)})`,
    lines: [
      f.renewal
        ? `${who}'s recurring ${what} renewed: ${formatCents(f.amountCents)}.`
        : `${who} gave a ${f.recurring ? 'recurring ' : ''}${what} of ${formatCents(f.amountCents)}.`,
      f.email && f.name ? `Email: ${f.email}` : null,
    ],
  }
}

export function moneyOutNotice(f: {
  kind: 'refund' | 'dispute' | 'failed'
  who: string | null
  amountCents: number
  detail?: string | null
}): PaymentNotice {
  const who = f.who ?? 'a payer'
  const amount = formatCents(f.amountCents)
  const subject =
    f.kind === 'refund'
      ? `Refund: ${amount} to ${who}`
      : f.kind === 'dispute'
        ? `Payment disputed: ${amount} from ${who}`
        : `Recurring payment failed: ${who} (${amount})`
  const first =
    f.kind === 'refund'
      ? `A payment from ${who} was refunded: ${amount}.`
      : f.kind === 'dispute'
        ? `${who} disputed a ${amount} payment with their bank. Stripe will ask the club for evidence; respond in the Stripe dashboard before the deadline.`
        : `${who}'s recurring ${amount} payment did not go through. Stripe will retry the card over the next few weeks.`
  return { subject, lines: [first, f.detail ?? null] }
}
