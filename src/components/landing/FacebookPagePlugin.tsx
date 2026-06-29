'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    FB?: {
      XFBML?: {
        parse: () => void
      }
    }
  }
}

export function FacebookPagePlugin({ href }: { href: string }) {
  useEffect(() => {
    if (!document.getElementById('fb-root')) {
      const root = document.createElement('div')
      root.id = 'fb-root'
      document.body.prepend(root)
    }

    const existingScript = document.getElementById('facebook-jssdk')

    if (existingScript) {
      window.FB?.XFBML?.parse()
      return
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v20.0'
    script.onload = () => window.FB?.XFBML?.parse()
    document.body.appendChild(script)
  }, [])

  return (
    <div className="bg-clw-white">
      <div
        className="fb-page min-h-[520px] w-full"
        data-href={href}
        data-tabs="timeline"
        data-width="500"
        data-height="560"
        data-small-header="false"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="false"
      >
        <blockquote cite={href} className="fb-xfbml-parse-ignore">
          <a href={href}>Crystal Lake Wizards Wrestling Club on Facebook</a>
        </blockquote>
      </div>
    </div>
  )
}
