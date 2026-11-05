import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { readCredential } from '@/lib/env'

export async function GET() {
  try {
    if (!readCredential('RESEND_API_KEY') || !readCredential('RESEND_FROM_EMAIL') || !readCredential('CRON_SECRET')) throw new Error('Missing configuration')
    const { count, error } = await createAdminSupabase().from('parent_auth_incidents')
      .select('id', { count: 'exact', head: true }).is('notified_at', null)
      .lt('first_seen', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    if (error || count) throw new Error('Delivery backlog')
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    // Public monitor sees health only, never emails, reference IDs or errors.
    return NextResponse.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
