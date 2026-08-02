import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { resolveFamilyOwnerIds } from '@/lib/family'
import { chicagoDateString } from '@/lib/chicago-time'
import type {
  Athlete,
  AthleteGuardian,
  ClubEvent,
  Disclosure,
  Profile,
  SeasonEnrollment,
  SeasonRegistration,
} from '@/types/database'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { RegistrationForm } from './RegistrationForm'

/**
 * The annual registration itself, one wrestler at a time.
 *
 * Split out from /registration (which stays a roster overview) because the
 * form is long, per-wrestler, and mostly client state — keeping it here means
 * the list page stays a server component with no form bundle attached.
 */
export default async function RegisterAthletePage({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = await params
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''
  const today = chicagoDateString()
  const familyOwnerIds = await resolveFamilyOwnerIds(supabase, userId)

  const [{ data: athleteRow }, { data: profileRow }, { data: seasonRows }, { data: eventRows }] = await Promise.all([
    supabase.from('athletes').select('*').eq('id', athleteId).in('parent_id', familyOwnerIds).maybeSingle(),
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('season_registrations').select('*').order('registration_open_date', { ascending: false }),
    supabase.from('club_events').select('*').eq('event_type', 'season_registration').eq('active', true),
  ])

  const athlete = athleteRow as Athlete | null
  if (!athlete) notFound()

  const activeEventIds = new Set(((eventRows ?? []) as ClubEvent[]).map((event) => event.id))
  const season = ((seasonRows ?? []) as SeasonRegistration[]).find(
    (row) =>
      activeEventIds.has(row.event_id) &&
      row.registration_open_date <= today &&
      row.registration_close_date >= today
  )

  // Nothing to fill in when no season is open; the roster page explains why.
  if (!season) redirect('/registration')

  const [{ data: enrollmentRow }, { data: guardianRows }, { data: disclosureRows }] = await Promise.all([
    supabase
      .from('season_enrollments')
      .select('*')
      .eq('season_registration_id', season.id)
      .eq('athlete_id', athlete.id)
      .maybeSingle(),
    supabase.from('athlete_guardians').select('*').eq('athlete_id', athlete.id).order('ordinal'),
    supabase.from('disclosures').select('*').eq('active', true).order('title'),
  ])

  const enrollment = enrollmentRow as SeasonEnrollment | null

  // An approved registration is locked; the club reopens it, not the family.
  if (enrollment?.status === 'approved') redirect('/registration')

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/registration" className="inline-flex items-center gap-2 text-sm text-clw-gold-ink hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to registration
        </Link>
        <p className="mt-4 text-sm font-medium uppercase tracking-[0.18em] text-clw-gold-ink">{season.season_label}</p>
        <h1 className="mt-2 text-3xl font-display text-clw-white">
          Register {athlete.first_name} {athlete.last_name}
        </h1>
      </div>

      {enrollment?.status === 'changes_requested' && enrollment.admin_note && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertDescription className="text-base text-amber-200">{enrollment.admin_note}</AlertDescription>
        </Alert>
      )}

      <Card className="card-depth border-clw-gold/10 bg-clw-black-3">
        <CardContent className="py-6">
          <RegistrationForm
            seasonRegistrationId={season.id}
            seasonLabel={season.season_label}
            seasonYear={Number(season.registration_close_date.slice(0, 4))}
            athlete={athlete}
            profile={profileRow as Profile | null}
            enrollment={enrollment}
            guardians={(guardianRows ?? []) as AthleteGuardian[]}
            disclosures={(disclosureRows ?? []) as Disclosure[]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
