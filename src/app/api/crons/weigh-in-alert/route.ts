import { NextResponse } from 'next/server'

import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { enqueueCommsJob } from '@/lib/comms/enqueue'
import { chicagoDatePlusDays } from '@/lib/chicago-time'

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabase()
  const tomorrow = chicagoDatePlusDays(1)

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, weigh_in_time, location')
    .eq('weigh_in_date', tomorrow)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let queued = 0
  for (const tournament of tournaments ?? []) {
    await enqueueCommsJob({
      target: { type: 'tournament_registrants', tournamentId: tournament.id },
      channel: 'sms',
      commType: 'tournament_reminder_weigh_in',
      message: `Weigh-ins for ${tournament.name} are tomorrow${tournament.weigh_in_time ? ` at ${tournament.weigh_in_time}` : ''} at ${tournament.location}.`,
    })
    queued += 1
  }

  return NextResponse.json({ ok: true, tournamentsMatched: tournaments?.length ?? 0, jobsQueued: queued })
}
