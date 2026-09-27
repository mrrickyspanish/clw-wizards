export const FAILURE_STEPS = ['confirmation_link', 'reset_link', 'password_save', 'family_setup'] as const
export type FailureStep = typeof FAILURE_STEPS[number]
export const ATTEMPT_COOKIE = 'clw_auth_attempt'
export const validAttempt = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

// Only error diagnostics, never serialize an auth response, user object or URL.
export function safeAuthError(error: unknown) {
  const value = error && typeof error === 'object' ? error as Record<string, unknown> : {}
  const clean = (v: unknown) => typeof v === 'string' ? v
    .replace(/https?:\/\/\S+/gi, '[URL removed]')
    .replace(/((?:password|token(?:_hash)?|recovery_token|access_token|refresh_token|authorization|code_verifier)\s*[=:]\s*)[^\s,;]+/gi, '$1[redacted]')
    .replace(/\beyJ[A-Za-z0-9_.-]+/g, '[token removed]')
    .replace(/[A-Za-z0-9_-]{40,}/g, '[opaque value removed]')
    .replace(/[\r\n\x00-\x1f]/g, ' ').slice(0, 700) : ''
  return {
    name: clean(value.name) || 'AuthFlowError',
    code: clean(value.code).slice(0, 100),
    message: clean(value.message ?? (typeof error === 'string' ? error : '')) || 'No error detail supplied',
    status: typeof value.status === 'number' ? value.status : null,
  }
}
export function safeEmail(value: unknown) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? value.trim().toLowerCase() : null
}

/**
 * A confirmation link opened somewhere other than where signup started.
 *
 * The PKCE verifier is written by the browser that submitted the signup form.
 * Tapping the emailed link from a mail app opens it in a different browser --
 * an in-app webview, or the phone's default -- which has no verifier, so the
 * code exchange fails. On a phone that is the NORMAL path, not the exception.
 *
 * Nobody is blocked when it happens. Supabase confirms the address at its own
 * verify endpoint before it ever redirects back here with a code, so the
 * account is already confirmed; only the automatic sign-in is lost. The
 * confirm route falls through to /login, which tells the parent to sign in
 * with the password they just chose, and they do.
 *
 * It still paged the club as "Parent blocked: confirmation_link". An alert that
 * fires on a self-healing condition, names it blocking, and offers nothing to
 * act on is worse than no alert: it spends the attention that a real failure
 * needs. Recorded in parent_auth_incidents either way -- count them there to
 * see volume -- but it does not wake anyone.
 */
const SELF_HEALING_CONFIRMATION_CODES = new Set(['pkce_code_verifier_not_found'])
const SELF_HEALING_CONFIRMATION_NAMES = new Set(['AuthPKCECodeVerifierMissingError'])

export function isSelfHealingFailure(step: FailureStep, error: unknown) {
  if (step !== 'confirmation_link') return false
  const { code, name } = safeAuthError(error)
  return SELF_HEALING_CONFIRMATION_CODES.has(code) || SELF_HEALING_CONFIRMATION_NAMES.has(name)
}
