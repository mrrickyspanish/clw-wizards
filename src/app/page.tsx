import type { Metadata } from 'next'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { ClubEvent, Tournament } from '@/types/database'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { Hero } from '@/components/landing/Hero'
import { ProgramIntro } from '@/components/landing/ProgramIntro'
import { ProgramStructure } from '@/components/landing/ProgramStructure'
import { HomeEventsSection, type HomeEventItem } from '@/components/landing/HomeEventsSection'
import { HomeSupportIntro } from '@/components/landing/HomeSupportIntro'
import { HomeFacilitySection } from '@/components/landing/HomeFacilitySection'
import { HomeTeamSection } from '@/components/landing/HomeTeamSection'
import { HomeFacebookSection } from '@/components/landing/HomeFacebookSection'
import { HomeMatTapeDivider } from '@/components/landing/HomeMatTapeDivider'
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

  const [{ data: tournaments }, { data: clubEvents }] = await Promise.all([
    supabase
      .from('tournaments')
      .select('*')
      .neq('status', 'cancelled')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(6),
    supabase
      .from('club_events')
      .select('*')
      .eq('active', true)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(6),
  ])

  const tournamentRows = (tournaments ?? []) as Tournament[]
  const clubEventRows = (clubEvents ?? []) as ClubEvent[]

  const homeEvents: HomeEventItem[] = [
    ...tournamentRows.map((event) => ({
      id: `t-${event.id}`,
      date: event.date,
      title: event.name,
      kind: 'tournament' as const,
      startTime: event.start_time,
      location: event.location || [event.city, event.state].filter(Boolean).join(', ') || null,
      imageUrl: event.image_url,
    })),
    ...clubEventRows.map((event) => ({
      id: `e-${event.id}`,
      date: event.date,
      title: event.title,
      kind: event.event_type,
      startTime: event.start_time,
      location: event.location,
      imageUrl: null,
    })),
  ]
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.startTime ?? '23:59:59').localeCompare(b.startTime ?? '23:59:59')
    })
    .slice(0, 3)

  return (
    <main className="marketing-site min-h-screen overflow-x-clip bg-clw-black">
      <SiteHeader />
      <div aria-hidden className="h-[116px] sm:h-[120px] min-[1180px]:h-[104px]" />

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
            <HomeMatTapeDivider profile="white-left" />
            <ProgramIntro />
          </>
        }
      />

      <ProgramStructure />

      <SectionSlideOver
        background={<HomeEventsSection events={homeEvents} />}
        foreground={
          <>
            <HomeMatTapeDivider profile="black-right" />
            {/* Nested: support pins and the Tony section slides over it with the
                gray diagonal, the same "card slides over the section above"
                parallax the other dividers use. */}
            <SectionSlideOver
              background={<HomeSupportIntro />}
              foreground={
                <>
                  <HomeMatTapeDivider profile="gray-left" />
                  <HomeTeamSection />
                </>
              }
            />
          </>
        }
      />

      <HomeFacilitySection />
      <HomeFacebookSection />
      <SiteFooter />
      <MobileCtaBar />
    </main>
  )
}
