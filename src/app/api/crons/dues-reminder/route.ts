import { NextResponse } from 'next/server'

import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { enqueueCommsJob } from '@/lib/comms/enqueue'

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await enqueueCommsJob({
    target: { type: 'outstanding_dues' },
    channel: 'both',
    commType: 'dues_reminder',
    subject: 'Reminder: club dues are outstanding',
    message:
      'This is a reminder that your club dues have an outstanding balance. Please log in to your parent portal to view your balance and pay online.',
  })

  return NextResponse.json({ ok: true, jobsQueued: 1 })
}
