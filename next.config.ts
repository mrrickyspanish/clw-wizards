import type { NextConfig } from 'next'

const securityHeaders = [
  // Prevent the site from being framed by another origin (clickjacking).
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stop browsers from MIME-sniffing a response away from its declared type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak the full referring URL (which can include auth-adjacent
  // paths/params) to third-party destinations.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Opt out of the legacy browser features this site doesn't use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
