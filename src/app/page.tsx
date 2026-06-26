import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { Tournament, Sponsor } from '@/types/database'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { Hero } from '@/components/landing/Hero'
import { PracticeGroups } from '@/components/landing/PracticeGroups'
import { UpcomingTournaments } from '@/components/landing/UpcomingTournaments'
import { ClubNumbers } from '@/components/landing/ClubNumbers'
import { WhyCLW } from '@/components/landing/WhyCLW'
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

  // Public reads: tournaments (public_read) and active sponsors
  // (public_read_active_sponsors) need no auth.
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

      <section className="bg-clw-black px-3 pb-14 pt-3 sm:px-4 md:pb-20 lg:px-5 xl:px-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
          <div id="groups" className="scroll-mt-24 lg:col-span-4">
            <PracticeGroups />
          </div>
          <div id="events" className="scroll-mt-24 lg:col-span-4">
            <UpcomingTournaments tournaments={(tournaments ?? []) as Tournament[]} />
          </div>
          <div id="why" className="scroll-mt-24 flex flex-col gap-3 lg:col-span-4 lg:gap-4">
            <ClubNumbers />
            <WhyCLW />
          </div>

          <div id="sponsors" className="scroll-mt-24 lg:col-span-8">
            <SponsorsShowcase sponsors={sponsorRows} />
          </div>
          <div id="donate" className="scroll-mt-24 lg:col-span-4">
            <DonateSection />
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Spacer so the footer clears the sticky mobile CTA bar. */}
      <div className="h-24 md:hidden" />
      <MobileCtaBar />
    </main>
  )
}
