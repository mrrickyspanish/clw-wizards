import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Barlow, Barlow_Condensed, Big_Shoulders } from 'next/font/google'
import { ORG } from '@/config/org.config'
import './globals.css'

// viewport-fit=cover lets the mobile portal use env(safe-area-inset-*) so the
// top bar clears the notch and the bottom tab bar clears the home indicator.
// width/initialScale must be set explicitly — Next doesn't merge a custom
// viewport export with its defaults, so omitting them drops
// width=device-width and breaks responsive text wrapping on real phones.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow-condensed',
})

const bigShoulders = Big_Shoulders({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-big-shoulders',
})

export const metadata: Metadata = {
  metadataBase: new URL(`https://${ORG.domain}`),
  title: {
    default: ORG.name,
    template: `%s · ${ORG.shortName}`,
  },
  description: ORG.tagline,
  openGraph: {
    title: ORG.name,
    description: ORG.tagline,
    url: `https://${ORG.domain}`,
    siteName: ORG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: ORG.name,
    description: ORG.tagline,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${barlow.variable} ${barlowCondensed.variable} ${bigShoulders.variable}`}>
      <body>{children}</body>
    </html>
  )
}
