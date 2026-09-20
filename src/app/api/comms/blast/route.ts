import { NextResponse } from 'next/server'

import { createServerSupabase } from '@/lib/supabase/server'
import { getSessionRole } from '@/lib/auth/session'
import {
  getQstashClient,
  siteUrl,
  isPubliclyReachableSiteUrl,
  QstashNotConfiguredError,
} from '@/lib/qstash'
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

  let body: BlastRequestBody
  try {
    body = (await request.json()) as BlastRequestBody
  } catch {
    return NextResponse.json({ error: 'Could not read the request body.' }, { status: 400 })
  }

  if (!body.message || !body.target || !body.channel || !body.commType) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }
  if (body.channel !== 'sms' && !body.subject) {
    return NextResponse.json({ error: 'Subject is required for email sends.' }, { status: 400 })
  }

  // QStash calls /api/comms/blast-job back over the public internet, and that
  // route rejects anything it can't verify. Both of these would otherwise let
  // the publish "succeed" while no parent ever receives the email.
  if (!isPubliclyReachableSiteUrl()) {
    return NextResponse.json(
      {
        error:
          'The email queue can’t call this site back. Set NEXT_PUBLIC_SITE_URL to the public site address, then redeploy.',
      },
      { status: 503 }
    )
  }
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
    return NextResponse.json(
      {
        error:
          'The email queue is missing its signing keys, so queued sends would be rejected. Set QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY, then redeploy.',
      },
      { status: 503 }
    )
  }

  try {
    await getQstashClient().publishJSON({
      url: `${siteUrl()}/api/comms/blast-job`,
      body,
    })
  } catch (err) {
    if (err instanceof QstashNotConfiguredError) {
      return NextResponse.json(
        {
          error:
            'The email queue isn’t configured yet, so nothing was sent. Set QSTASH_TOKEN on this environment, then redeploy.',
        },
        { status: 503 }
      )
    }

    const detail = err instanceof Error ? err.message : 'Unknown queue error'
    console.error('[comms/blast] QStash publish failed:', detail)
    return NextResponse.json(
      { error: `The email queue rejected this send, so nothing went out. ${detail}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, queued: true })
}
