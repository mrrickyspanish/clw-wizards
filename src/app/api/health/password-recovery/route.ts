import { NextResponse } from 'next/server'
import { auditPasswordRecovery } from '@/lib/auth/recovery-audit'

export const dynamic = 'force-dynamic'

// Public, privacy-safe result lets an independent GitHub Actions job notice
// failures even if Vercel cron stops firing or Resend cannot send alerts.
export async function GET(request: Request) {
  // The public checker must not become an unbounded Resend API proxy. Reject
  // query variants so the stable URL can be cached briefly by the CDN.
  if (new URL(request.url).search) return NextResponse.json({ ok: false }, { status: 400 })
  try {
    const result = await auditPasswordRecovery()
    if (!result.ok) console.error('[password-recovery-health] failed', result)
    return NextResponse.json({ ok: result.ok, reason: result.reason }, {
      status: result.ok ? 200 : 503,
      headers: { 'Cache-Control': result.ok ? 'public, s-maxage=120' : 'no-store' },
    })
  } catch (error) {
    console.error('[password-recovery-health] audit threw', error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ ok: false, reason: 'audit-unavailable' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    })
  }
}
