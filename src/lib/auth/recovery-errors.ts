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
  if (code === 'invalid_credentials') return 'The email or password is incorrect. Check your details or use Forgot password.'
  if (code === 'captcha_failed') return 'The security check expired. Complete it again and sign in.'
  return message
}
