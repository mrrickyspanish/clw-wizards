import type { MetadataRoute } from 'next'
import { ORG } from '@/config/org.config'

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`).replace(/\/$/, '')

// Public, indexable marketing routes. Private portal/admin/auth routes are
// intentionally excluded (and disallowed in robots.ts).
const PUBLIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/program', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/coaches', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/sponsorship', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/golf-outing', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
