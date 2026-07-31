import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { createPublicSupabase } from '@/lib/supabase/public'
import { chicagoDateString } from '@/lib/chicago-time'
import { resolveDuesPricing } from '@/lib/season-pricing'
import type { ClubEvent, SeasonRegistration } from '@/types/database'
import { CTA_LINK } from '@/lib/cta'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Public entry point into season registration, shown only while a season is
 * actually open. Returns null the rest of the year rather than advertising a
 * window nobody can act on.
 *
 * The single /registration link serves both audiences: middleware sends a
 * signed-out visitor to /login?redirectTo=/registration, and the login screen
 * carries that target through to signup and onboarding, so a brand new family
 * lands back here once the account exists.
 */
export async function SeasonRegistrationCallout() {
  const supabase = createPublicSupabase()
  if (!supabase) return null

  const today = chicagoDateString()

  const [{ data: seasonData }, { data: eventData }] = await Promise.all([
    supabase.from('season_registrations').select('*').order('registration_open_date', { ascending: false }),
    supabase.from('club_events').select('*').eq('event_type', 'season_registration').eq('active', true),
  ])

  const activeEventIds = new Set(((eventData ?? []) as ClubEvent[]).map((event) => event.id))
  const open = ((seasonData ?? []) as SeasonRegistration[]).find(
    (season) =>
      activeEventIds.has(season.event_id) &&
      season.registration_open_date <= today &&
      season.registration_close_date >= today
  )

  if (!open) return null

  const pricing = resolveDuesPricing(open, today)

  return (
    <div className="border border-clw-gold bg-clw-gold/10 p-6">
      <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">Registration Open</p>
      <h3 className="mt-4 font-display text-3xl uppercase leading-none text-clw-white">
        Register for {open.season_label}
      </h3>
      <p className="mt-4 text-base leading-relaxed text-clw-gray">
        Returning families sign in and confirm what changed. New families create an account along the way. Dues can be
        paid now or left pending. Registration closes {formatDate(open.registration_close_date)}.
        {pricing.isDiscounted && (
          <>
            {' '}
            Register by {formatDate(pricing.discountDeadline!)} for {money(pricing.amountCents)} per wrestler instead
            of {money(pricing.regularAmountCents)}.
          </>
        )}
      </p>
      <Link
        href="/registration"
        className={`${CTA_LINK} mt-6 text-clw-gold hover:text-clw-gold-l`}
      >
        Register for the Season <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
