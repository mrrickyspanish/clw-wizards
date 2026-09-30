'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

import { ORG } from '@/config/org.config'

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

// How long to wait for the Cloudflare script before telling the visitor it did
// not load. Generous: a slow phone connection should not be told it failed.
const SCRIPT_LOAD_TIMEOUT_MS = 10_000

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
 *
 * When the check cannot run, the visitor is told. Every form here disables its
 * submit button until a token arrives, so a check that never loads -- blocked
 * by a content blocker or privacy setting, stripped by an in-app browser, or
 * simply lost on a weak connection -- used to leave a greyed-out button and
 * nothing else. No error appeared anywhere, which reads as "the site is broken"
 * and arrives at the club as "I can't log in / can't reset my password". The
 * requirement is unchanged (the server still demands the token); what changes is
 * that the parent gets an explanation and a way out instead of silence.
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !scriptReady || !containerRef.current || !window.turnstile) return

    const container = containerRef.current
    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'dark',
      size: 'flexible',
      callback: (t) => { setToken(t); setFailed(false) },
      'expired-callback': () => setToken(null),
      'error-callback': () => { setToken(null); setFailed(true) },
    })

    return () => {
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [scriptReady])

  // The script never reporting ready is the silent case: nothing renders, so
  // there is no widget of Cloudflare's own to explain anything. A script that
  // arrives late clears the notice again via onReady below.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || scriptReady) return
    const timer = setTimeout(() => setFailed(true), SCRIPT_LOAD_TIMEOUT_MS)
    return () => clearTimeout(timer)
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
        onReady={() => { setScriptReady(true); setFailed(false) }}
        onError={() => setFailed(true)}
      />
      <div ref={containerRef} />
      {failed && !token && (
        <div role="alert" className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-base text-amber-200">
          <p>
            The security check did not load, so the button below cannot be used yet. Try reloading
            the page, or open this page in Safari or Chrome. If you use an ad or content blocker,
            turn it off for this site.
          </p>
          <p>
            Still stuck? Email the club at{' '}
            <a href={`mailto:${ORG.contactEmail}`} className="underline">{ORG.contactEmail}</a>{' '}
            and we will set you up.
          </p>
          <button type="button" onClick={() => window.location.reload()} className="underline">
            Reload this page
          </button>
        </div>
      )}
    </>
  ) : null

  return { enabled: Boolean(TURNSTILE_SITE_KEY), token, reset, widget }
}
