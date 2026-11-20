import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { CHURCH_READ_ONLY } from '@/lib/demo-readonly'
import { CHURCH_MEMBER_VIEW, CHURCH_ROLES } from '@/lib/demo-roles'
import { createDemoSetupSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// The church demo's one-click sign-in (RJ, Nov 17: no password for visitors).
// The server makes a one-time sign-in link for the chosen demo account and
// uses it straight away, so nobody types or sees a password and no email is
// sent. Church deployments only; everywhere else this route doesn't exist.
const VIEWS: Record<string, { email: string; home: string }> = Object.fromEntries(
  [...CHURCH_ROLES, CHURCH_MEMBER_VIEW].map((v) => [v.key, { email: v.email, home: v.home }])
)

export async function GET(req: NextRequest) {
  if (!CHURCH_READ_ONLY) return new NextResponse('Not found', { status: 404 })
  const as = req.nextUrl.searchParams.get('as')
  const view = as ? VIEWS[as] : undefined
  const back = new URL('/demo?unavailable=1', req.url)
  if (!view) return NextResponse.redirect(back)

  const { data, error } = await createDemoSetupSupabase().auth.admin.generateLink({ type: 'magiclink', email: view.email })
  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) return NextResponse.redirect(back)

  const response = NextResponse.redirect(new URL(view.home, req.url))
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  })
  const { error: signInError } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
  if (signInError) return NextResponse.redirect(back)
  return response
}
