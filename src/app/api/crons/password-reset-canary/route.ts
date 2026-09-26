import { NextResponse } from 'next/server'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { readCredential } from '@/lib/env'
import { POST as requestPasswordReset } from '@/app/api/auth/request-password-reset/route'

export const maxDuration = 60

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const email = readCredential('PASSWORD_RESET_CANARY_EMAIL')
  if (!email) {
    console.error('[password-reset-canary] no canary account configured')
    return NextResponse.json({ ok: false }, { status: 503 })
  }
  // Invoke the actual public reset handler, subject to an exact email match
  // and the same CRON_SECRET. A failed link or send makes this job fail.
  const origin = (readCredential('NEXT_PUBLIC_SITE_URL') ?? new URL(request.url).origin).replace(/\/$/, '')
  const response = await requestPasswordReset(new Request(`${origin}/api/auth/request-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: request.headers.get('authorization')! },
    body: JSON.stringify({ email }),
  }))
  const result = await response.json() as { ok?: boolean; messageId?: string; requestId?: string }
  if (!response.ok || !result.messageId) {
    console.error('[password-reset-canary] no provider receipt', { requestId: result.requestId, status: response.status })
    return NextResponse.json({ ok: false }, { status: 503 })
  }
  console.info('[password-reset-canary] provider accepted', { messageId: result.messageId })
  return NextResponse.json({ ok: true, messageId: result.messageId })
}
