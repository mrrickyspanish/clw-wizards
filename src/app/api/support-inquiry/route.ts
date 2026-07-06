import { NextResponse } from 'next/server'
import { Resend } from 'resend'

import { ORG } from '@/config/org.config'
import { sendAlert } from '@/lib/alerts'

interface SupportInquiryBody {
  firstName?: string
  lastName?: string
  email?: string
  topic?: string
  message?: string
  company?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_TOPICS = new Set([
  'Donation',
  'Booster Club',
  'Corporate Sponsorship',
  'Volunteer',
  'General Question',
])

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function POST(request: Request) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'Email service is not configured yet.' }, { status: 500 })
  }

  let body: SupportInquiryBody
  try {
    body = (await request.json()) as SupportInquiryBody
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot field. Real visitors never see or complete it.
  if (clean(body.company, 120)) {
    return NextResponse.json({ ok: true })
  }

  const firstName = clean(body.firstName, 80)
  const lastName = clean(body.lastName, 80)
  const email = clean(body.email, 180).toLowerCase()
  const topic = clean(body.topic, 80)
  const message = clean(body.message, 3000)

  if (!firstName || !lastName || !EMAIL_PATTERN.test(email) || !ALLOWED_TOPICS.has(topic) || message.length < 10) {
    return NextResponse.json({ error: 'Complete every required field with valid information.' }, { status: 400 })
  }

  const resend = new Resend(resendKey)
  const to = process.env.ALERT_EMAIL ?? ORG.contactEmail
  const from = process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`
  const fullName = `${firstName} ${lastName}`

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `${ORG.shortName} support inquiry: ${topic}`,
      html: `
        <h2>${escapeHtml(topic)}</h2>
        <p><strong>From:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replaceAll('\n', '<br />')}</p>
      `,
    })

    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Support inquiry email failed:', error)
    await sendAlert('Support inquiry email failed', {
      email,
      topic,
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Unable to send your message. Please try again.' }, { status: 500 })
  }
}
