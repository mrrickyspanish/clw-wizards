import { NextResponse } from 'next/server'
import { auditPasswordRecovery } from '@/lib/auth/recovery-audit'

export const dynamic = 'force-dynamic'

// Public, privacy-safe result lets an independent GitHub Actions job notice
// failures even if Vercel cron stops firing or Resend cannot send alerts.
export async function GET() {
  try {
    const result = await auditPasswordRecovery()
    if (!result.ok) console.error('[password-recovery-health] failed', result)
    return NextResponse.json({ ok: result.ok, reason: result.reason }, {
      status: result.ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('[password-recovery-health] audit threw', error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ ok: false, reason: 'audit-unavailable' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    })
  }
}
