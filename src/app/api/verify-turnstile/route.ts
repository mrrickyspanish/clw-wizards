import { NextRequest, NextResponse } from 'next/server'

import { verifyTurnstileToken } from '@/lib/turnstile'

export async function POST(req: NextRequest) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    return NextResponse.json({ success: false, error: 'Turnstile is not configured' }, { status: 503 })
  }

  const { token } = await req.json()

  if (!token) {
    return NextResponse.json({ success: false, error: 'No token provided' }, { status: 400 })
  }

  const verified = await verifyTurnstileToken(token)
  if (!verified) {
    return NextResponse.json({ success: false, error: 'Turnstile verification failed' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
