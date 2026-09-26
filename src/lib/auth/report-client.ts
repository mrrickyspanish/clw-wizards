import { reportAuthFailure } from '@/app/auth/report-failure'
import { ATTEMPT_COOKIE, safeAuthError, safeEmail, validAttempt, type FailureStep } from './incident-policy'

let memoryAttempt = ''
export function markAuthNavigation() {
  document.cookie = 'clw_auth_pending=1; Path=/; Max-Age=60; SameSite=Lax; Secure'
}
export function authAttempt(email?: string, explicitId?: string | null, fresh = false) {
  let previous = memoryAttempt
  try {
    previous = sessionStorage.getItem(ATTEMPT_COOKIE) ?? previous
    if (email && safeEmail(email) !== sessionStorage.getItem('clw_auth_email')) fresh = true
  } catch { /* storage disabled */ }
  const cookieId = document.cookie.split('; ').find(value => value.startsWith(`${ATTEMPT_COOKIE}=`))?.split('=')[1]
  if (validAttempt(cookieId)) previous = cookieId
  const id = validAttempt(explicitId) ? explicitId : !fresh && validAttempt(previous) ? previous : crypto.randomUUID()
  memoryAttempt = id
  try {
    sessionStorage.setItem(ATTEMPT_COOKIE, id)
    if (email) sessionStorage.setItem('clw_auth_email', safeEmail(email) ?? '')
  } catch { /* best-effort context */ }
  document.cookie = `${ATTEMPT_COOKIE}=${id}; Path=/; Max-Age=1800; SameSite=Lax; Secure`
  return id
}

export async function reportClientAuthFailure(step: FailureStep, error: unknown, email?: string) {
  const attemptId = authAttempt()
  let knownEmail = email
  try { knownEmail ??= sessionStorage.getItem('clw_auth_email') ?? undefined } catch { /* unavailable */ }
  // Keep failure UI responsive. Two transport attempts, same incident ID.
  for (let retry = 0; retry < 2; retry++) {
    try {
      const result = await reportAuthFailure({ attemptId, step, error: safeAuthError(error), email: knownEmail })
      if (result?.recorded) break
    } catch { /* Offline reporting cannot be delivered until connectivity returns. */ }
  }
  return attemptId
}
