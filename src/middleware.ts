import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAndResponse } from '@/lib/supabase/middleware'
import { getSessionRole, homeForRole } from '@/lib/auth/session'

const PUBLIC_AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/update-password']

const PORTAL_PATHS = [
  '/dashboard',
  '/athletes',
  '/documents',
  '/dues',
  '/tournaments',
  '/registration',
  '/profile',
  '/schedule',
]
const ONBOARDING_PATH = '/onboarding'
const POST_ONBOARDING_COOKIE = 'clw_post_onboarding'

// Admin areas reserved for FULL admins only (editing public website content and
// managing the admin team). Limited admins get the rest of /admin.
const FULL_ADMIN_PATHS = ['/admin/content', '/admin/team']

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function safeInternalPath(value: string | undefined | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
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
  const { user, role, adminScope, onboardingCompleted } = await getSessionRole(supabase)

  if (!user) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', `${pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  // A parent who has not finished onboarding can only be on /onboarding. Save
  // the original portal destination briefly so the existing onboarding form can
  // finish normally and the first dashboard request resumes that destination.
  if (role === 'parent' && !onboardingCompleted && isPortalPath) {
    const destination = safeInternalPath(`${pathname}${req.nextUrl.search}`) ?? '/dashboard'
    const onboardingUrl = req.nextUrl.clone()
    onboardingUrl.pathname = ONBOARDING_PATH
    onboardingUrl.search = ''
    const redirect = NextResponse.redirect(onboardingUrl)
    redirect.cookies.set(POST_ONBOARDING_COOKIE, destination, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 60,
      path: '/',
    })
    return redirect
  }

  // The onboarding form currently returns to /dashboard. On that first request,
  // send the parent back to the action that originally brought them into setup.
  if (role === 'parent' && onboardingCompleted && pathname === '/dashboard') {
    const destination = safeInternalPath(req.cookies.get(POST_ONBOARDING_COOKIE)?.value)
    if (destination && destination !== '/dashboard') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = destination.split('?')[0]
      redirectUrl.search = destination.includes('?') ? destination.slice(destination.indexOf('?')) : ''
      const redirect = NextResponse.redirect(redirectUrl)
      redirect.cookies.delete(POST_ONBOARDING_COOKIE)
      return redirect
    }
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

  // Full-admin-only corners of /admin: a limited admin is bounced to the admin
  // home rather than shown the website-content editor or the team manager.
  if (isAdminPath && matchesPrefix(pathname, FULL_ADMIN_PATHS) && adminScope !== 'full') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/admin'
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
    '/registration/:path*',
    '/profile/:path*',
    '/schedule',
    '/onboarding',
  ],
}
