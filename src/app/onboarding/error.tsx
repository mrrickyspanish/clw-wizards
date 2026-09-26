'use client'

import { useEffect } from 'react'
import { reportClientAuthFailure } from '@/lib/auth/report-client'

export default function FamilySetupError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportClientAuthFailure('family_setup', { name: error.name, message: error.message, code: error.digest })
  }, [error])
  return <div className="mx-auto max-w-md space-y-4 px-6 py-16">
    <h1 className="text-2xl text-clw-gold">We couldn’t open family setup</h1>
    <p>Please try again. If this continues, contact the club for help.</p>
    <button onClick={reset} className="rounded bg-clw-gold px-5 py-3 text-black">Try again</button>
  </div>
}
