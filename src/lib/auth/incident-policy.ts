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
