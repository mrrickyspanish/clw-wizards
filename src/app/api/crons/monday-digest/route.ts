import { NextResponse } from 'next/server'

import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { enqueueCommsJob } from '@/lib/comms/enqueue'
import { chicagoDateString } from '@/lib/chicago-time'

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabase()
  const today = chicagoDateString()

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('name, date, location, city, state')
    .eq('status', 'open')
    .gt('date', today)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!tournaments?.length) {
    return NextResponse.json({ ok: true, tournamentsMatched: 0, jobsQueued: 0 })
  }

  const listItems = tournaments
    .map((t) => `<li>${t.name} — ${t.date} (${t.location}, ${t.city}, ${t.state})</li>`)
    .join('')

  await enqueueCommsJob({
    target: { type: 'all' },
    channel: 'email',
    commType: 'open_tournaments_digest',
    subject: "Upcoming tournaments — don't miss the registration window",
    message: `<p>Here's what's open for registration right now:</p><ul>${listItems}</ul>`,
  })

  return NextResponse.json({ ok: true, tournamentsMatched: tournaments.length, jobsQueued: 1 })
}
