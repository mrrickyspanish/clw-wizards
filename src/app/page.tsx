import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { Tournament, Sponsor } from '@/types/database'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { Hero } from '@/components/landing/Hero'
import { About } from '@/components/landing/About'
import { PracticeGroups } from '@/components/landing/PracticeGroups'
import { UpcomingTournaments } from '@/components/landing/UpcomingTournaments'
import { SponsorsShowcase } from '@/components/landing/SponsorsShowcase'
import { DonateSection } from '@/components/landing/DonateSection'
import { SiteFooter } from '@/components/landing/SiteFooter'
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

  return (
    <main className="min-h-screen bg-clw-black">
      <SiteHeader />
      {donation === 'success' && (
        <div className="mx-auto max-w-5xl px-6 pt-24">
          <Alert className="border-clw-gold/40 bg-clw-gold/10">
            <AlertDescription className="text-clw-gold">
              Thank you for your donation. It means a lot to our wrestlers!
            </AlertDescription>
          </Alert>
        </div>
      )}
      {donation === 'cancelled' && (
        <div className="mx-auto max-w-5xl px-6 pt-24">
          <Alert>
            <AlertDescription className="text-clw-gray">Donation cancelled. No payment was made.</AlertDescription>
          </Alert>
        </div>
      )}

      <Hero />
      <About />
      <PracticeGroups />
      <UpcomingTournaments tournaments={(tournaments ?? []) as Tournament[]} />
      <SponsorsShowcase sponsors={(sponsors ?? []) as Sponsor[]} />
      <DonateSection />
      <SiteFooter />
    </main>
  )
}
