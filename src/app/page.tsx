import type { Metadata } from 'next'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { Tournament } from '@/types/database'

export const metadata: Metadata = {
  description:
    'Join the Crystal Lake Wizards Wrestling Club — youth wrestling in Crystal Lake and McHenry County, IL. Structured practice groups, dedicated coaching, and season-long tournament competition for wrestlers of every level.',
  alternates: { canonical: '/' },
}
import { SiteHeader } from '@/components/landing/SiteHeader'
import { Hero } from '@/components/landing/Hero'
import { ProgramIntro } from '@/components/landing/ProgramIntro'
import { ProgramStructure } from '@/components/landing/ProgramStructure'
import { HomeEventsSection } from '@/components/landing/HomeEventsSection'
import { HomeSupportIntro } from '@/components/landing/HomeSupportIntro'
import { HomeFacilitySection } from '@/components/landing/HomeFacilitySection'
import { HomeTeamSection } from '@/components/landing/HomeTeamSection'
import { HomeFacebookSection } from '@/components/landing/HomeFacebookSection'
import { HomeMatTapeDivider } from '@/components/landing/HomeMatTapeDivider'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { MobileCtaBar } from '@/components/landing/MobileCtaBar'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ donation?: string }>
}) {
  const { donation } = await searchParams
  const supabase = await createServerSupabase()
  const today = chicagoDateString()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .eq('status', 'open')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(4)

  const tournamentRows = (tournaments ?? []) as Tournament[]

  return (
    <main className="min-h-screen overflow-x-hidden bg-clw-black">
      <SiteHeader />
      {donation === 'success' && (
        <div className="px-4 pt-24 sm:px-6 lg:px-8">
          <Alert className="border-clw-gold/40 bg-clw-gold/10">
            <AlertDescription className="text-clw-gold">
              Thank you for your donation. It means a lot to our wrestlers!
            </AlertDescription>
          </Alert>
        </div>
      )}
      {donation === 'cancelled' && (
        <div className="px-4 pt-24 sm:px-6 lg:px-8">
          <Alert>
            <AlertDescription className="text-clw-gray">Donation cancelled. No payment was made.</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative">
        <div className="relative z-0 lg:sticky lg:top-0">
          <Hero />
        </div>
        <div className="relative z-10">
          <HomeMatTapeDivider profile="white-left" />
          <ProgramIntro />
        </div>
      </div>

      <ProgramStructure />

      <div className="relative">
        <div className="relative z-0 lg:sticky lg:top-0">
          <HomeEventsSection tournaments={tournamentRows} />
        </div>
        <div className="relative z-10">
          <HomeMatTapeDivider profile="black-right" />
          <HomeSupportIntro />
        </div>
      </div>

      <HomeTeamSection />
      <HomeFacilitySection />
      <HomeFacebookSection />

      <SiteFooter />

      <div className="h-20 md:hidden" />
      <MobileCtaBar />
    </main>
  )
}
