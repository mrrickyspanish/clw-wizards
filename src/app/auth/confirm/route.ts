import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { signupDestination } from '@/lib/auth/signup-routing'

export async function GET(request: NextRequest) {
  const next = signupDestination(request.nextUrl.searchParams.get('next'))
  const login = new URL('/login', request.nextUrl.origin)
  login.searchParams.set('redirectTo', next)
  login.searchParams.set('confirmation', 'retry')
  let destination = login
  const code = request.nextUrl.searchParams.get('code')
  if (code) {
    try {
      const supabase = await createServerSupabase()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) destination = new URL(next, request.nextUrl.origin)
    } catch {
      // A different browser lacks the PKCE verifier. Email confirmation may
      // already have succeeded; password sign-in safely establishes a session.
    }
  }
  const response = NextResponse.redirect(destination)
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
