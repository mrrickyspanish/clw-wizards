export function signupDestination(value: string | null) {
  return value === '/registration' ? '/registration' : '/dashboard'
}

// Older confirmation emails (and disallowed redirect URLs) fall back to the
// homepage. Recognize only auth responses, leaving ordinary visits alone.
export function signupLandingTarget(search: string, hash: string) {
  const query = new URLSearchParams(search)
  const fragment = new URLSearchParams(hash.replace(/^#/, ''))
  if (query.has('code')) {
    const params = new URLSearchParams({ code: query.get('code')!, next: '/dashboard' })
    return `/auth/confirm?${params}`
  }
  if (query.has('error') || fragment.has('error')) {
    return '/login?confirmation=retry&redirectTo=%2Fdashboard'
  }
  if (fragment.get('type') === 'signup') {
    return '/login?confirmation=complete&redirectTo=%2Fdashboard'
  }
  return null
}
