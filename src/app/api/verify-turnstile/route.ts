import { NextRequest, NextResponse } from 'next/server'

import { verifyTurnstileToken } from '@/lib/turnstile'

export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token) {
    return NextResponse.json({ success: false, error: 'No token provided' }, { status: 400 })
  }

  const result = await verifyTurnstileToken(token)

  if (!result.ok) {
    return result.reason === 'not-configured'
      ? NextResponse.json({ success: false, error: 'Turnstile is not configured' }, { status: 503 })
      : NextResponse.json({ success: false, error: 'Turnstile verification failed' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
