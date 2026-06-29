'use client'

import { useEffect, useMemo, useState } from 'react'

const WAIT_MS = 6500

function FacebookFallback({ href }: { href: string }) {
  return (
    <div className="border border-clw-gold/25 bg-clw-black-2 p-6 shadow-2xl shadow-black/30 sm:p-8">
      <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Latest updates</p>
      <h3 className="mt-4 font-display text-4xl uppercase leading-none tracking-wide text-clw-white sm:text-5xl">
        Check the official page
      </h3>
      <p className="mt-5 text-lg leading-relaxed text-clw-gray">
        Practice updates, tournament reminders, photos, and club announcements open directly on Facebook.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 block bg-clw-gold px-6 py-4 text-center font-display text-xl uppercase tracking-wide text-clw-black transition hover:bg-clw-gold-l"
      >
        Visit Facebook
      </a>
    </div>
  )
}

export function FacebookFeedWithFallback({ href }: { href: string }) {
  const [loading, setLoading] = useState(true)
  const [fallback, setFallback] = useState(false)

  const src = useMemo(() => {
    const params = new URLSearchParams({
      href,
      tabs: 'timeline',
      width: '500',
      height: '560',
      small_header: 'false',
      adapt_container_width: 'true',
      hide_cover: 'false',
      show_facepile: 'false',
    })

    return `https://www.facebook.com/plugins/page.php?${params.toString()}`
  }, [href])

  useEffect(() => {
    if (!loading) return

    const timer = setTimeout(() => {
      setFallback(true)
      setLoading(false)
    }, WAIT_MS)

    return () => clearTimeout(timer)
  }, [loading])

  if (fallback) {
    return <FacebookFallback href={href} />
  }

  return (
    <div className="border border-clw-gold/25 bg-clw-black-2 p-3 shadow-2xl shadow-black/30">
      {loading && (
        <div className="flex min-h-[160px] items-center justify-center px-6 py-10 text-center text-lg leading-relaxed text-clw-gray">
          Loading the latest Facebook updates...
        </div>
      )}

      <iframe
        title="Crystal Lake Wizards Facebook feed"
        src={src}
        width="500"
        height="560"
        className={loading ? 'hidden' : 'block min-h-[520px] w-full border-0 bg-clw-white'}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setFallback(true)
          setLoading(false)
        }}
      />

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-clw-gold px-6 py-4 text-center font-display text-xl uppercase tracking-wide text-clw-black transition hover:bg-clw-gold-l"
      >
        Follow us on Facebook
      </a>
    </div>
  )
}
