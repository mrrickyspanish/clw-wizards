import { NextResponse, type NextRequest } from 'next/server'

import { createServerSupabase } from '@/lib/supabase/server'

function safeInternalPath(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/update-password'
}

function invalidLinkRedirect(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/update-password'
  url.search = ''
  url.searchParams.set('error', 'invalid-link')
  return NextResponse.redirect(url)
}

/**
 * Completes Supabase email authentication on the server so recovery links work
 * with cookie-based SSR auth before the browser reaches the password form.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const next = safeInternalPath(request.nextUrl.searchParams.get('next'))

  // Email scanners and previews GET links before the parent does. Never
  // consume a recovery token here; only the password form may verify it.
  if (tokenHash && type === 'recovery') {
    const url = new URL('/update-password', request.nextUrl.origin)
    url.hash = `recovery_token=${encodeURIComponent(tokenHash)}`
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  }

  if (code) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return invalidLinkRedirect(request)
  } else {
    return invalidLinkRedirect(request)
  }

  return NextResponse.redirect(new URL(next, request.nextUrl.origin))
}
