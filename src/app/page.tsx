import type { Metadata } from 'next'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { Tournament } from '@/types/database'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { Hero } from '@/components/landing/Hero'
import { ProgramIntro } from '@/components/landing/ProgramIntro'
import { ProgramStructure } from '@/components/landing/ProgramStructure'
import { HomeEventsSection } from '@/components/landing/HomeEventsSection'
import { HomeSupportIntro } from '@/components/landing/HomeSupportIntro'
import { HomeFacilitySection } from '@/components/landing/HomeFacilitySection'
import { HomeTeamSection } from '@/components/landing/HomeTeamSection'
import { HomeFacebookSection } from '@/components/landing/HomeFacebookSection'
import { HomeSectionDivider } from '@/components/landing/HomeSectionDivider'
import { SectionSlideOver } from '@/components/landing/SectionSlideOver'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { MobileCtaBar } from '@/components/landing/MobileCtaBar'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const metadata: Metadata = {
  description:
    'Join the Crystal Lake Wizards Wrestling Club — youth wrestling in Crystal Lake and McHenry County, IL. Structured practice groups, dedicated coaching, and season-long tournament competition for wrestlers of every level.',
  alternates: { canonical: '/' },
}

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
    <main className="marketing-site min-h-screen overflow-x-clip bg-clw-black">
      <SiteHeader />
      <div aria-hidden className="h-[98px] sm:h-[100px] lg:h-[104px]" />

      {donation === 'success' && (
        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          <Alert className="border-clw-gold/40 bg-clw-gold/10">
            <AlertDescription className="text-clw-gold">
              Thank you for your donation. It means a lot to our wrestlers!
            </AlertDescription>
          </Alert>
        </div>
      )}
      {donation === 'cancelled' && (
        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          <Alert>
            <AlertDescription className="text-clw-gray">Donation cancelled. No payment was made.</AlertDescription>
          </Alert>
        </div>
      )}

      <SectionSlideOver
        background={<Hero />}
        foreground={
          <>
            <HomeSectionDivider variant="into-light" />
            <ProgramIntro />
          </>
        }
      />

      <ProgramStructure />

      <SectionSlideOver
        background={<HomeEventsSection tournaments={tournamentRows} />}
        foreground={
          <>
            <HomeSectionDivider variant="into-dark" />
            <HomeSupportIntro />
          </>
        }
      />

      <HomeTeamSection />
      <HomeFacilitySection />
      <HomeFacebookSection />
      <SiteFooter />
      <div className="h-20 md:hidden" />
      <MobileCtaBar />
    </main>
  )
}
