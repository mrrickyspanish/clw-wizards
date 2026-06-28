import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { Tournament, Sponsor } from '@/types/database'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { Hero } from '@/components/landing/Hero'
import { ProgramIntro } from '@/components/landing/ProgramIntro'
import { MobileActionSlideshow } from '@/components/landing/MobileActionSlideshow'
import { PracticeGroups } from '@/components/landing/PracticeGroups'
import { UpcomingTournaments } from '@/components/landing/UpcomingTournaments'
import { ClubNumbers } from '@/components/landing/ClubNumbers'
import { WhyCLW } from '@/components/landing/WhyCLW'
import { LocationCard } from '@/components/landing/LocationCard'
import { SponsorsShowcase } from '@/components/landing/SponsorsShowcase'
import { DonateSection } from '@/components/landing/DonateSection'
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

  const [{ data: tournaments }, { data: sponsors }] = await Promise.all([
    supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'open')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(4),
    supabase.from('sponsors').select('*').eq('active', true),
  ])

  const sponsorRows = (sponsors ?? []) as Sponsor[]

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

      <Hero />
      <ProgramIntro />
      <MobileActionSlideshow />

      <section className="bg-clw-black px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <div id="groups" className="scroll-mt-24">
            <PracticeGroups />
          </div>
          <div id="events" className="scroll-mt-24">
            <UpcomingTournaments tournaments={(tournaments ?? []) as Tournament[]} />
          </div>
        </div>
      </section>

      <div className="h-px bg-clw-gold/40" />

      <section className="section-light bg-[#EEECE7] px-5 py-14 sm:px-8 sm:py-20 lg:px-12 xl:px-16 2xl:px-20">
        <div id="why" className="scroll-mt-24 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <ClubNumbers />
          <WhyCLW />
        </div>
      </section>

      <section className="bg-clw-black px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20">
        <div id="location" className="scroll-mt-24">
          <LocationCard />
        </div>
      </section>

      <div className="h-px bg-clw-gold/40" />

      <section className="section-light bg-[#F6F5F2] px-5 py-14 sm:px-8 sm:py-20 lg:px-12 xl:px-16 2xl:px-20">
        <div id="sponsors" className="scroll-mt-24">
          <SponsorsShowcase sponsors={sponsorRows} />
        </div>
      </section>

      <section className="bg-clw-black px-5 py-14 sm:px-8 sm:py-20 lg:px-12 xl:px-16 2xl:px-20">
        <div id="donate" className="scroll-mt-24 mx-auto max-w-2xl">
          <DonateSection />
        </div>
      </section>

      <SiteFooter />

      <div className="h-24 md:hidden" />
      <MobileCtaBar />
    </main>
  )
}
