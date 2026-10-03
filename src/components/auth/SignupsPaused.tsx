import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthBrand } from '@/components/layout/AuthBrand'
import { ORG } from '@/config/org.config'

/**
 * Shown in place of a sign-up form while new accounts are switched off
 * (Admin -> Content -> Sign-ups). Gives families somewhere to go instead of a
 * dead end: whoever the club names as its contact.
 */
export function SignupsPaused({ audience = 'families' }: { audience?: 'families' | 'admins' }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-clw-black px-4 py-12">
      <AuthBrand />
      <Card className="w-full max-w-md border-clw-gold/20 bg-clw-black-2">
        <CardHeader>
          <CardTitle className="text-clw-gold">Sign-ups are paused</CardTitle>
          <CardDescription className="text-base">
            {audience === 'admins'
              ? 'New admin accounts cannot be created right now.'
              : 'We are not creating new accounts right now.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base text-clw-white">
            {audience === 'admins'
              ? 'If you need access, contact Tony and he will set it up.'
              : 'To join the club or get help with an account, please contact Tony. He will take care of you.'}
          </p>
          <p className="text-base text-clw-white">
            Email Tony at{' '}
            <a href={`mailto:${ORG.contactEmail}`} className="font-medium text-clw-gold-ink underline">
              {ORG.contactEmail}
            </a>
          </p>
          <p className="text-base text-clw-gray">Already have an account? You can still sign in.</p>
          <Button asChild className="w-full text-base">
            <Link href="/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
