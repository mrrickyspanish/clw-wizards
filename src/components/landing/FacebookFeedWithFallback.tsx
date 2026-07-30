'use client'

import { useEffect, useMemo, useState } from 'react'

const WAIT_MS = 6500

export function FacebookFeedWithFallback({ href }: { href: string }) {
  const [loading, setLoading] = useState(true)
  const [fallback, setFallback] = useState(false)

  const src = useMemo(() => {
    const params = new URLSearchParams({
      href,
      tabs: 'timeline',
      width: '500',
      height: '420',
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
    return null
  }

  return (
    <div className="border border-clw-gold/25 bg-clw-black-2 p-2 shadow-2xl shadow-black/30 sm:p-3">
      {loading && (
        <div className="flex min-h-[150px] items-center justify-center px-6 py-8 text-center text-lg leading-relaxed text-clw-gray">
          Loading the latest Facebook updates...
        </div>
      )}

      <iframe
        title="Crystal Lake Wizards Facebook feed"
        src={src}
        width="500"
        height="420"
        className={loading ? 'hidden' : 'block min-h-[400px] w-full border-0 bg-clw-white'}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setFallback(true)
          setLoading(false)
        }}
      />
    </div>
  )
}
