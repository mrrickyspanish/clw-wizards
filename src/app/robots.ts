import type { MetadataRoute } from 'next'
import { ORG } from '@/config/org.config'
import { DEMO_MODE } from '@/lib/demo'

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`).replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  // The Homefield demo stays out of search engines entirely.
  if (DEMO_MODE) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private, authenticated, and transactional areas — keep them out of the index.
      disallow: [
        '/admin',
        '/staff',
        '/dashboard',
        '/athletes',
        '/documents',
        '/profile',
        '/schedule',
        '/dues',
        '/tournaments',
        '/tournament-rosters',
        '/onboarding',
        '/login',
        '/signup',
        '/forgot-password',
        '/update-password',
        '/api/',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
