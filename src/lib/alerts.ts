import { Resend } from 'resend'
import { ORG } from '@/config/org.config'

const ALERT_EMAIL = process.env.ALERT_EMAIL ?? ORG.contactEmail

/**
 * Best-effort email notification for failures on money/comms paths (Stripe
 * webhook, checkout, SMS/email blasts). Never throws — a broken alert must
 * not take down the request that triggered it.
 */
export async function sendAlert(subject: string, context: Record<string, unknown> = {}) {
  const resendKey = process.env.RESEND_API_KEY

  if (!resendKey) {
    console.error(`[alert] Could not send "${subject}" — RESEND_API_KEY is not set.`, context)
    return
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`
  const resend = new Resend(resendKey)

  const detailLines = Object.entries(context)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n')

  try {
    await resend.emails.send({
      from: fromAddress,
      to: [ALERT_EMAIL],
      subject: `[${ORG.shortName} Alert] ${subject}`,
      text: `${subject}\n\n${detailLines}\n\nTime: ${new Date().toISOString()}`,
    })
  } catch (err) {
    console.error('[alert] Failed to send alert email:', err)
  }
}
