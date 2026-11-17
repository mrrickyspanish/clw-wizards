import type { NextConfig } from 'next'

// The church staff dashboard demo (SBC proposal, Nov 17) is about the admin
// side only: its public pages still carry the club's copy, so they go straight
// to the staff sign-in. Every other deployment, the live club included, gets
// no redirects from this.
const CHURCH_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1' && process.env.NEXT_PUBLIC_DEMO_FLAVOR === 'church'
const CHURCH_PUBLIC_PAGES = ['/', '/about', '/coaches', '/events', '/faq', '/golf-outing', '/join', '/partners', '/program', '/sponsorship', '/sponsorship/:path*']

const nextConfig: NextConfig = {
  async redirects() {
    return CHURCH_DEMO ? CHURCH_PUBLIC_PAGES.map((source) => ({ source, destination: '/login', permanent: false })) : []
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
}

export default nextConfig
