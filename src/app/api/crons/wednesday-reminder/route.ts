import { NextResponse } from 'next/server'

import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { enqueueCommsJob } from '@/lib/comms/enqueue'
import { chicagoDateString, chicagoDatePlusDays } from '@/lib/chicago-time'

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabase()
  const today = chicagoDateString()
  const fourDaysOut = chicagoDatePlusDays(4)

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, date, location, city, state')
    .eq('status', 'open')
    .gte('date', today)
    .lte('date', fourDaysOut)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let queued = 0
  for (const tournament of tournaments ?? []) {
    await enqueueCommsJob({
      target: { type: 'tournament_registrants', tournamentId: tournament.id },
      channel: 'both',
      commType: 'tournament_reminder_wednesday',
      subject: `Reminder: ${tournament.name} is coming up`,
      message: `Reminder — ${tournament.name} is on ${tournament.date} at ${tournament.location}, ${tournament.city}, ${tournament.state}. See you on the mat!`,
    })
    queued += 1
  }

  return NextResponse.json({ ok: true, tournamentsMatched: tournaments?.length ?? 0, jobsQueued: queued })
}
