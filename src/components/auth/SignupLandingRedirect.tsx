'use client'

import { useEffect } from 'react'
import { signupLandingTarget } from '@/lib/auth/signup-routing'
import { reportClientAuthFailure } from '@/lib/auth/report-client'

export function SignupLandingRedirect() {
  useEffect(() => {
    const target = signupLandingTarget(window.location.search, window.location.hash)
    const query = new URLSearchParams(window.location.search)
    const fragment = new URLSearchParams(window.location.hash.slice(1))
    const failure = query.has('error') ? query : fragment.has('error') ? fragment : null
    if (target && failure) {
      // Wait for the report before navigating away; the action is bounded by
      // the server's provider timeout. The parent can still use the page.
      void reportClientAuthFailure(failure.get('type') === 'recovery' ? 'reset_link' : 'confirmation_link', {
        code: failure.get('error_code') ?? failure.get('error'), message: failure.get('error_description'),
      }).finally(() => window.location.replace(target))
    } else if (target) window.location.replace(target)
  }, [])
  return null
}
