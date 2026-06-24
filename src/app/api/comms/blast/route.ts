import { NextResponse } from 'next/server'

import { createServerSupabase } from '@/lib/supabase/server'
import { getSessionRole } from '@/lib/auth/session'
import { getQstashClient, siteUrl } from '@/lib/qstash'
import type { CommTarget } from '@/lib/comms/recipients'
import type { CommType } from '@/types/database'

export interface BlastRequestBody {
  target: CommTarget
  channel: 'email' | 'sms' | 'both'
  commType: CommType
  subject?: string // required when channel includes email
  message: string
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { role } = await getSessionRole(supabase)

  if (role !== 'admin' && role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = (await request.json()) as BlastRequestBody

  if (!body.message || !body.target || !body.channel || !body.commType) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }
  if (body.channel !== 'sms' && !body.subject) {
    return NextResponse.json({ error: 'Subject is required for email sends.' }, { status: 400 })
  }

  await getQstashClient().publishJSON({
    url: `${siteUrl()}/api/comms/blast-job`,
    body,
  })

  return NextResponse.json({ ok: true, queued: true })
}
