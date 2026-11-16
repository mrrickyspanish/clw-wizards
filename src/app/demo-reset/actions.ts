'use server'

import { timingSafeEqual } from 'node:crypto'

import { DEMO_FLAVOR, DEMO_MODE } from '@/lib/demo'
import { resetDemo, type ResetResult } from '@/lib/demo-seed'
import { resetChurchDemo } from '@/lib/demo-seed-church'

// Reset the Homefield demo to its starting state. Only exists in a demo
// deployment, and only with the demo password RJ set (DEMO_PASSWORD), which is
// also the password of every demo login.
export async function resetDemoAction(typed: string): Promise<ResetResult> {
  if (!DEMO_MODE) return { ok: false, error: 'Not available.' }
  const password = process.env.DEMO_PASSWORD ?? ''
  if (!password) return { ok: false, error: 'DEMO_PASSWORD is not set for this demo.' }
  const a = Buffer.from(typed)
  const b = Buffer.from(password)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await new Promise((r) => setTimeout(r, 1500))
    return { ok: false, error: 'Wrong demo password.' }
  }
  return DEMO_FLAVOR === 'church' ? resetChurchDemo(password) : resetDemo(password)
}
