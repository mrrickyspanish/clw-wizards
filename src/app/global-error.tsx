'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('__clw_recover')) return

    url.searchParams.set('__clw_recover', Date.now().toString())
    window.location.replace(url.toString())
  }, [error])

  function reloadClean() {
    const url = new URL(window.location.href)
    url.searchParams.delete('__clw_recover')
    window.location.replace(url.toString())
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#080808', color: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <main
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: 620 }}>
            <div
              aria-hidden="true"
              style={{
                width: 84,
                height: 84,
                margin: '0 auto',
                border: '4px solid #F0C020',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F0C020',
                fontSize: 54,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              W
            </div>
            <p style={{ margin: '28px 0 0', color: '#F0C020', fontSize: 14, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Wizards Wrestling Club
            </p>
            <h1 style={{ margin: '14px 0 0', fontSize: 'clamp(2.5rem, 10vw, 4.75rem)', lineHeight: 0.95, textTransform: 'uppercase' }}>
              The page did not load correctly.
            </h1>
            <p style={{ margin: '22px auto 0', maxWidth: 500, color: '#c8c8c8', fontSize: 18, lineHeight: 1.6 }}>
              We tried one automatic refresh. Reload the site to try again.
            </p>
            <div style={{ marginTop: 30, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={reloadClean}
                style={{
                  minHeight: 52,
                  border: 0,
                  background: '#F0C020',
                  color: '#080808',
                  padding: '0 26px',
                  fontSize: 16,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Reload Site
              </button>
              <button
                type="button"
                onClick={reset}
                style={{
                  minHeight: 52,
                  border: '2px solid #F0C020',
                  background: 'transparent',
                  color: '#F0C020',
                  padding: '0 26px',
                  fontSize: 16,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
