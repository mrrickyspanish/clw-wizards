import { NextResponse, after, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { signupDestination } from '@/lib/auth/signup-routing'
import { linkAttemptId, requestSourceKey, reportParentAuthFailure } from '@/lib/auth/incidents'
import { validAttempt } from '@/lib/auth/incident-policy'

export async function GET(request: NextRequest) {
  const next = signupDestination(request.nextUrl.searchParams.get('next'))
  const login = new URL('/login', request.nextUrl.origin)
  login.searchParams.set('redirectTo', next)
  login.searchParams.set('confirmation', 'retry')
  let destination = login
  const code = request.nextUrl.searchParams.get('code')
  let reportAttemptId: string | undefined
  if (code) {
    try {
      const supabase = await createServerSupabase()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
      destination = new URL(next, request.nextUrl.origin)
    } catch (error) {
      const attemptId = await linkAttemptId(code)
      reportAttemptId = attemptId
      const sourceKey = await requestSourceKey(request)
      after(() => reportParentAuthFailure({ attemptId, step: 'confirmation_link', error, sourceKey }).then(() => undefined))
      // A different browser lacks the PKCE verifier. Email confirmation may
      // already have succeeded; password sign-in safely establishes a session.
    }
  } else if (request.nextUrl.searchParams.has('error')) {
    const error = { code: request.nextUrl.searchParams.get('error_code') ?? request.nextUrl.searchParams.get('error'),
      message: request.nextUrl.searchParams.get('error_description') ?? 'Confirmation link rejected' }
    const sourceKey = await requestSourceKey(request)
    const existing = request.cookies?.get('clw_auth_attempt')?.value
    const attemptId = validAttempt(existing) ? existing : crypto.randomUUID()
    reportAttemptId = attemptId
    after(() => reportParentAuthFailure({ attemptId, step: 'confirmation_link', error, sourceKey }).then(() => undefined))
  }
  const response = NextResponse.redirect(destination)
  if (reportAttemptId) response.cookies.set('clw_auth_attempt', reportAttemptId, { path: '/', maxAge: 1800, sameSite: 'lax', secure: true })
  if (destination !== login && code) {
    response.cookies.set('clw_auth_pending', '1', { path: '/', maxAge: 60, sameSite: 'lax', secure: true })
    response.cookies.set('clw_auth_attempt', await linkAttemptId(code), { path: '/', maxAge: 1800, sameSite: 'lax', secure: true })
  }
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
