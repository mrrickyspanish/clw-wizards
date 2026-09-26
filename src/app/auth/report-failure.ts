'use server'

import { headers } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'
import { incidentFingerprint, reportParentAuthFailure } from '@/lib/auth/incidents'
import { FAILURE_STEPS, safeAuthError, safeEmail, validAttempt, type FailureStep } from '@/lib/auth/incident-policy'

// Server Actions enforce same-origin POSTs. Still validate all client data and
// enforce a database-backed source limit; action identifiers aren't secrets.
export async function reportAuthFailure(input: {
  attemptId: string; step: FailureStep; error: unknown; email?: string | null;
}) {
  if (!input || !validAttempt(input.attemptId) || !FAILURE_STEPS.includes(input.step)) return
  const requestHeaders = await headers()
  const ip = requestHeaders.get('x-vercel-forwarded-for') ?? requestHeaders.get('x-real-ip') ?? 'unknown'
  let email = safeEmail(input.email)
  let emailSource = email ? 'browser supplied (unverified)' : 'unavailable'
  try {
    const { data } = await (await createServerSupabase()).auth.getUser()
    if (data.user?.email) { email = data.user.email; emailSource = 'authenticated user' }
  } catch { /* A rejected link may have no working session. */ }
  return reportParentAuthFailure({ ...input, error: safeAuthError(input.error), email, emailSource,
    sourceKey: await incidentFingerprint(`client:${ip}`),
  })
}
