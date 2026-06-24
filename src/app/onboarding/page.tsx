import { createServerSupabase } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ORG } from '@/config/org.config'
import { OnboardingForm } from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = auth.user
    ? await supabase.from('profiles').select('phone, sms_opt_in').eq('id', auth.user.id).single()
    : { data: null }

  return (
    <div className="flex min-h-screen items-center justify-center bg-clw-black px-4 py-12">
      <Card className="w-full max-w-2xl border-clw-gold/20 bg-clw-black-2">
        <CardHeader>
          <CardTitle className="text-clw-gold">Complete your profile</CardTitle>
          <CardDescription>
            Add your contact info and at least one athlete to finish setting up your {ORG.shortName} account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm initialPhone={profile?.phone ?? null} initialSmsOptIn={profile?.sms_opt_in ?? false} />
        </CardContent>
      </Card>
    </div>
  )
}
