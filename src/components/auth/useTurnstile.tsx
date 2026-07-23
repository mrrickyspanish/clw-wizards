'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    clwTurnstileSuccess?: (token: string) => void
    clwTurnstileExpired?: () => void
    turnstile?: { reset: () => void }
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/**
 * Cloudflare Turnstile for the Supabase-auth forms. When captcha protection is
 * enabled on the Supabase project, GoTrue rejects EVERY auth request with
 * "captcha protection: request disallowed (no captcha_token found)" unless a
 * token is attached — so every auth entry point (sign in, sign up, password
 * reset) has to render this widget and pass `token` through in the request's
 * `options.captchaToken`.
 *
 * When NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset the widget renders nothing and
 * `enabled` is false, so callers skip the token requirement entirely.
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    window.clwTurnstileSuccess = (t: string) => setToken(t)
    window.clwTurnstileExpired = () => setToken(null)
    return () => {
      delete window.clwTurnstileSuccess
      delete window.clwTurnstileExpired
    }
  }, [])

  // Tokens are single-use — after a failed attempt the old one is spent, so the
  // widget must be reset before the user can try again.
  function reset() {
    setToken(null)
    window.turnstile?.reset()
  }

  const widget = TURNSTILE_SITE_KEY ? (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div
        className="cf-turnstile"
        data-sitekey={TURNSTILE_SITE_KEY}
        data-theme="dark"
        data-size="flexible"
        data-callback="clwTurnstileSuccess"
        data-expired-callback="clwTurnstileExpired"
        data-error-callback="clwTurnstileExpired"
      />
    </>
  ) : null

  return { enabled: Boolean(TURNSTILE_SITE_KEY), token, reset, widget }
}
