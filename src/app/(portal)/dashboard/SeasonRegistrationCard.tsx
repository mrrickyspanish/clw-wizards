import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, CreditCard, UserPlus } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { Athlete, ClubEvent, DuesPayment, SeasonEnrollment, SeasonRegistration } from '@/types/database'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function pickSeason(
  seasons: SeasonRegistration[],
  events: Map<string, ClubEvent>,
  today: string
): { season: SeasonRegistration; event: ClubEvent } | null {
  const rows = seasons
    .map((season) => ({ season, event: events.get(season.event_id) }))
    .filter((row): row is { season: SeasonRegistration; event: ClubEvent } => Boolean(row.event?.active))

  const open = rows.find(
    ({ season }) => season.registration_open_date <= today && season.registration_close_date >= today
  )
  if (open) return open

  const upcoming = rows
    .filter(({ season }) => season.registration_open_date > today)
    .sort((a, b) => a.season.registration_open_date.localeCompare(b.season.registration_open_date))[0]
  if (upcoming) return upcoming

  return rows.sort((a, b) => b.season.registration_close_date.localeCompare(a.season.registration_close_date))[0] ?? null
}

export async function SeasonRegistrationCard({
  familyOwnerIds,
}: {
  familyOwnerIds: string[]
}) {
  const supabase = await createServerSupabase()
  const today = chicagoDateString()

  const [{ data: seasonData, error: seasonError }, { data: eventData }, { data: athleteData }] = await Promise.all([
    supabase.from('season_registrations').select('*').order('registration_open_date', { ascending: false }),
    supabase.from('club_events').select('*').eq('event_type', 'season_registration').eq('active', true),
    supabase
      .from('athletes')
      .select('id, first_name, last_name, active')
      .in('parent_id', familyOwnerIds)
      .eq('active', true),
  ])

  if (seasonError) return null

  const events = new Map(((eventData ?? []) as ClubEvent[]).map((event) => [event.id, event]))
  const selected = pickSeason((seasonData ?? []) as SeasonRegistration[], events, today)
  if (!selected) return null

  const { season, event } = selected
  const athletes = (athleteData ?? []) as Pick<Athlete, 'id' | 'first_name' | 'last_name' | 'active'>[]
  const athleteIds = athletes.map((athlete) => athlete.id)

  const { data: enrollmentData } = athleteIds.length
    ? await supabase
        .from('season_enrollments')
        .select('*')
        .eq('season_registration_id', season.id)
        .in('athlete_id', athleteIds)
    : { data: [] as SeasonEnrollment[] }

  const enrollments = (enrollmentData ?? []) as SeasonEnrollment[]
  const duesIds = enrollments.map((enrollment) => enrollment.dues_payment_id).filter(Boolean) as string[]
  const { data: duesData } = duesIds.length
    ? await supabase.from('dues_payments').select('*').in('id', duesIds)
    : { data: [] as DuesPayment[] }

  const duesById = new Map(((duesData ?? []) as DuesPayment[]).map((dues) => [dues.id, dues]))
  const activeEnrollments = enrollments.filter((enrollment) => enrollment.status !== 'withdrawn')
  const approved = activeEnrollments.filter((enrollment) => enrollment.status === 'approved').length
  const changesRequested = activeEnrollments.filter((enrollment) => enrollment.status === 'changes_requested').length
  const submitted = activeEnrollments.filter((enrollment) => enrollment.status === 'submitted').length
  const outstanding = activeEnrollments.filter((enrollment) => {
    const dues = enrollment.dues_payment_id ? duesById.get(enrollment.dues_payment_id) : undefined
    return dues && !['paid', 'waived'].includes(dues.status)
  }).length
  const registeredAthleteIds = new Set(activeEnrollments.map((enrollment) => enrollment.athlete_id))
  const unregistered = athletes.filter((athlete) => !registeredAthleteIds.has(athlete.id)).length
  const isOpen = season.registration_open_date <= today && season.registration_close_date >= today
  const isUpcoming = today < season.registration_open_date

  let eyebrow = 'Season registration'
  let title = event.title
  let body = `${season.season_label} registration is available in your parent portal.`
  let action = 'View registration'
  let Icon = Clock3
  let accent = 'border-clw-gold/25'

  if (athletes.length === 0) {
    eyebrow = isOpen ? 'Registration open' : 'Get ready for registration'
    title = `Add your wrestler for ${season.season_label}`
    body = isOpen
      ? 'Create the wrestler profile once, then use it for this season and future renewals.'
      : `Registration opens ${formatDate(season.registration_open_date)}. Add your wrestler now so the family is ready.`
    action = 'Add wrestler'
    Icon = UserPlus
  } else if (changesRequested > 0) {
    eyebrow = 'Action required'
    title = `${changesRequested} registration update${changesRequested === 1 ? '' : 's'} needed`
    body = 'The club left a note in your registration. Update the requested item and resubmit.'
    action = 'Fix registration'
    Icon = AlertCircle
    accent = 'border-amber-500/40'
  } else if (unregistered > 0 && isOpen) {
    eyebrow = 'Registration open'
    title = `Register for ${season.season_label}`
    body = `${unregistered} active wrestler${unregistered === 1 ? ' is' : 's are'} not registered for the new season yet.`
    action = 'Register now'
  } else if (outstanding > 0) {
    eyebrow = 'Payment required'
    title = `${outstanding} season balance${outstanding === 1 ? '' : 's'} remaining`
    body = 'Registration is saved. Complete the season dues payment to keep approval moving.'
    action = 'Pay and view status'
    Icon = CreditCard
    accent = 'border-red-500/35'
  } else if (submitted > 0) {
    eyebrow = 'Under review'
    title = `${submitted} registration${submitted === 1 ? '' : 's'} submitted`
    body = 'The club is reviewing the wrestling card and payment. Status will update here.'
    action = 'View status'
  } else if (approved > 0 && approved === athletes.length) {
    eyebrow = 'Registration complete'
    title = `Approved for ${season.season_label}`
    body = `All ${approved === 1 ? 'wrestler is' : `${approved} wrestlers are`} cleared for the season.`
    action = 'View confirmation'
    Icon = CheckCircle2
    accent = 'border-emerald-500/35'
  } else if (isUpcoming) {
    eyebrow = 'Coming soon'
    title = `${season.season_label} registration`
    body = `Registration opens ${formatDate(season.registration_open_date)}.`
    action = 'View details'
  } else if (!isOpen && activeEnrollments.length === 0) {
    return null
  }

  const href = athletes.length === 0 ? '/athletes/new?redirectTo=/registration' : '/registration'

  return (
    <Link
      href={href}
      className={`card-depth lift mb-8 block rounded-2xl border bg-clw-black-3 p-6 active:scale-[0.99] ${accent}`}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clw-gold/10 text-clw-gold-ink">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-clw-gold-ink">{eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl leading-tight text-clw-white">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-clw-gray">{body}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-clw-gold-ink">
            {action} <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
