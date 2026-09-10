'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          theme?: string
          size?: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
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
 * Renders the widget imperatively via `window.turnstile.render()` rather than
 * Turnstile's implicit data-sitekey DOM scan: that scan runs only once, when
 * api.js first loads. Next's <Script strategy="afterInteractive"> dedupes by
 * src, so on a client-side route change (e.g. /login -> /forgot-password
 * without a full reload) the script doesn't reload and the scan never runs
 * again — a widget mounted on the new page is left unrendered, its success
 * callback never fires, and the submit button stays disabled forever. `onReady`
 * fires on every remount (unlike `onLoad`, which only fires once), so the
 * explicit render below runs correctly regardless of navigation type.
 *
 * When NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset the widget renders nothing and
 * `enabled` is false, so callers skip the token requirement entirely.
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !scriptReady || !containerRef.current || !window.turnstile) return

    const container = containerRef.current
    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'dark',
      size: 'flexible',
      callback: (t) => setToken(t),
      'expired-callback': () => setToken(null),
      'error-callback': () => setToken(null),
    })

    return () => {
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [scriptReady])

  // Tokens are single-use — after a failed attempt the old one is spent, so the
  // widget must be reset before the user can try again.
  function reset() {
    setToken(null)
    if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current)
  }

  const widget = TURNSTILE_SITE_KEY ? (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} />
    </>
  ) : null

  return { enabled: Boolean(TURNSTILE_SITE_KEY), token, reset, widget }
}
