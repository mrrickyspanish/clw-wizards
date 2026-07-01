import type { MetadataRoute } from 'next'
import { ORG } from '@/config/org.config'

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`).replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
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
