type ProviderError = { name?: string; code?: string; status?: number; statusCode?: number; message?: string }

export function providerError(error: unknown): ProviderError {
  return error && typeof error === 'object' ? error as ProviderError : {}
}

export function isTransientAuthError(error: unknown) {
  const { name, status, statusCode } = providerError(error)
  const httpStatus = status ?? statusCode
  return httpStatus === 429 || (httpStatus !== undefined && httpStatus >= 500) ||
    ['AuthRetryableFetchError', 'TypeError', 'AbortError', 'TimeoutError', 'application_error', 'internal_server_error', 'rate_limit_exceeded'].includes(name ?? '')
}

export async function retryTransient<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt >= 2 || !isTransientAuthError(error)) throw error
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
    }
  }
}

export function signInErrorMessage(error: unknown) {
  const { code, message } = providerError(error)
  if (isTransientAuthError(error) || !message || message.trim() === '{}') {
    return 'Sign in is temporarily unavailable. Please wait a minute and try again. You do not need to reset your password for this error.'
  }
  // Most families were imported by the club with no password at all, so for
  // them "incorrect" is true of any password they could type. Say what to do.
  if (code === 'invalid_credentials') return 'The email or password is incorrect. If the club set up your account and you have never chosen a password, use Forgot password to set one.'
  if (code === 'captcha_failed') return 'The security check expired. Complete it again and sign in.'
  return message
}

const TOO_MANY = 'Too many attempts in a short time. Wait a minute, then try again.'

/**
 * Sign-up failures in the club's words. The page used to show the provider's
 * message verbatim, which is how a parent whose address had a typo got
 * "gomail: could not send email 1: gomail: invalid address ...".
 */
export function signUpErrorMessage(error: unknown) {
  const { code, message } = providerError(error)
  // Specific codes first. A 500 here is usually NOT transient: in production
  // it was the confirmation email bouncing off a malformed address, and
  // "wait a minute and try again" would send the parent round the same loop.
  // The provider's own text for weak_password lists the actual password rules,
  // which is the one thing the parent needs to read.
  if (code === 'weak_password') return message && message.trim() !== '{}' ? message : 'Choose a stronger password.'
  if (code === 'captcha_failed') return 'The security check expired. Complete it again and create your account.'
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return TOO_MANY
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'That email address does not look right. Check it for typos and try again.'
  if (code === 'email_exists' || code === 'user_already_exists') return 'An account already exists for that email. Sign in, or use Forgot password to set a password.'
  if (code === 'signup_disabled') return 'New accounts are not open right now. Please contact the club.'
  const checkAddress = 'We could not create your account with that email address. Check it for typos (for example, two dots in a row) and try again. If it keeps happening, contact the club.'
  if (code === 'unexpected_failure') return checkAddress
  if (isTransientAuthError(error)) return 'We could not create your account right now. Please wait a minute and try again.'
  return checkAddress
}

/** Password-save failures on the reset form, in the club's words. */
export function passwordSaveErrorMessage(error: unknown) {
  const { code, name, message } = providerError(error)
  if (code === 'weak_password') return message && message.trim() !== '{}' ? message : 'Choose a stronger password.'
  if (code === 'over_request_rate_limit') return TOO_MANY
  if (code === 'session_not_found' || code === 'session_expired' || code === 'reauthentication_needed' || code === 'bad_jwt' || name === 'AuthSessionMissingError') {
    return 'Your reset session has ended. Request a new reset link and use the newest email.'
  }
  return 'We could not save your password right now. Please try again in a moment.'
}
