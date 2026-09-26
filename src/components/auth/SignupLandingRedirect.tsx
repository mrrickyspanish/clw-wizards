'use client'

import { useEffect } from 'react'
import { signupLandingTarget } from '@/lib/auth/signup-routing'

export function SignupLandingRedirect() {
  useEffect(() => {
    const target = signupLandingTarget(window.location.search, window.location.hash)
    if (target) window.location.replace(target)
  }, [])
  return null
}
