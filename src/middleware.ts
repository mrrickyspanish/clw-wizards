import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAndResponse } from '@/lib/supabase/middleware'
import { getSessionRole, homeForRole } from '@/lib/auth/session'

const PUBLIC_AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/update-password']

const PORTAL_PATHS = ['/dashboard', '/athletes', '/documents', '/dues', '/tournaments', '/profile', '/schedule']
const ONBOARDING_PATH = '/onboarding'

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdminPath = matchesPrefix(pathname, ['/admin'])
  const isStaffPath = matchesPrefix(pathname, ['/staff'])
  const isPortalPath = matchesPrefix(pathname, PORTAL_PATHS)
  const isOnboardingPath = pathname === ONBOARDING_PATH

  if (!isAdminPath && !isStaffPath && !isPortalPath && !isOnboardingPath) {
    return NextResponse.next()
  }

  if (PUBLIC_AUTH_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  const { supabase, response } = await getSupabaseAndResponse(req)
  const { user, role, onboardingCompleted } = await getSessionRole(supabase)

  if (!user) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // A parent who hasn't finished onboarding can only be on /onboarding —
  // everywhere else in the portal bounces them there first.
  if (role === 'parent' && !onboardingCompleted && isPortalPath) {
    const onboardingUrl = req.nextUrl.clone()
    onboardingUrl.pathname = ONBOARDING_PATH
    return NextResponse.redirect(onboardingUrl)
  }

  const allowed =
    (isAdminPath && role === 'admin') ||
    (isStaffPath && (role === 'admin' || role === 'staff')) ||
    (isPortalPath && role === 'parent') ||
    (isOnboardingPath && role === 'parent')

  if (!allowed) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = homeForRole(role)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
    '/dashboard/:path*',
    '/athletes/:path*',
    '/documents/:path*',
    '/dues/:path*',
    '/tournaments/:path*',
    '/profile/:path*',
    '/schedule',
    '/onboarding',
  ],
}
