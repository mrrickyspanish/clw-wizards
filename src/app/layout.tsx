import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Barlow, Barlow_Condensed, Big_Shoulders } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { ORG } from '@/config/org.config'
import './globals.css'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`).replace(/\/$/, '')
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

const SITE_DESCRIPTION =
  'Crystal Lake Wizards Wrestling Club develops youth wrestlers in Crystal Lake and across McHenry County, IL through structured practice groups, dedicated coaching, and regular tournament competition.'

// Organization / local-business structured data so Google can surface the
// club's name, location, and contact info in search and the knowledge panel.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'SportsClub',
  name: ORG.name,
  alternateName: ORG.shortName,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  email: ORG.contactEmail,
  sport: 'Wrestling',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Crystal Lake',
    addressRegion: 'IL',
    addressCountry: 'US',
  },
  areaServed: 'McHenry County, IL',
  ...(ORG.social.facebook ? { sameAs: [ORG.social.facebook] } : {}),
}

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${ORG.name} | Youth Wrestling in Crystal Lake, IL`,
    template: `%s · ${ORG.shortName}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: ORG.name,
  keywords: [
    'Crystal Lake Wizards',
    'Crystal Lake wrestling',
    'youth wrestling',
    'kids wrestling Crystal Lake',
    'McHenry County wrestling',
    'wrestling club Illinois',
    'Wizards Wrestling Club',
    'youth wrestling near me',
  ],
  authors: [{ name: ORG.name }],
  creator: ORG.name,
  publisher: ORG.name,
  category: 'sports',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: `${ORG.name} | Youth Wrestling in Crystal Lake, IL`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: ORG.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${ORG.name} | Youth Wrestling in Crystal Lake, IL`,
    description: SITE_DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${barlow.variable} ${barlowCondensed.variable} ${bigShoulders.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        {children}
      </body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  )
}
