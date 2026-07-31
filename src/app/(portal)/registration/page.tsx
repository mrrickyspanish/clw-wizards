import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock3, CreditCard, FileCheck2, Plus, ShieldCheck } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { resolveFamilyOwnerIds } from '@/lib/family'
import { chicagoDateString } from '@/lib/chicago-time'
import { resolveDuesPricing } from '@/lib/season-pricing'
import type {
  Athlete,
  AthleteDocument,
  ClubEvent,
  DuesPayment,
  SeasonEnrollment,
  SeasonRegistration,
} from '@/types/database'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentControls } from '../documents/DocumentControls'
import { PayButton } from '../dues/PayButton'
import { EnrollmentControls } from './EnrollmentControls'

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
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

const ENROLLMENT_STYLES: Record<SeasonEnrollment['status'], string> = {
  submitted: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  changes_requested: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  approved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  withdrawn: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
}

const ENROLLMENT_LABELS: Record<SeasonEnrollment['status'], string> = {
  submitted: 'under review',
  changes_requested: 'action required',
  approved: 'approved',
  withdrawn: 'withdrawn',
}

export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''
  const today = chicagoDateString()
  const familyOwnerIds = await resolveFamilyOwnerIds(supabase, userId)

  const [
    { data: seasonData, error: seasonError },
    { data: eventData },
    { data: athleteData },
    { data: profileData },
  ] = await Promise.all([
    supabase.from('season_registrations').select('*').order('registration_open_date', { ascending: false }),
    supabase.from('club_events').select('*').eq('event_type', 'season_registration').eq('active', true),
    supabase
      .from('athletes')
      .select('*')
      .in('parent_id', familyOwnerIds)
      .eq('active', true)
      .order('first_name', { ascending: true }),
    supabase.from('profiles').select('full_name, email, phone').eq('id', userId).maybeSingle(),
  ])

  const profile = profileData as { full_name: string | null; email: string | null; phone: string | null } | null

  const events = new Map(((eventData ?? []) as ClubEvent[]).map((event) => [event.id, event]))
  const selected = pickSeason((seasonData ?? []) as SeasonRegistration[], events, today)

  if (seasonError || !selected) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-display text-clw-gold-ink">Season Registration</h1>
          <p className="text-sm text-clw-gray">Annual wrestler registration and approval.</p>
        </div>
        <Card className="card-depth border-clw-gold/10 bg-clw-black-3">
          <CardContent className="py-12 text-center">
            <Clock3 className="mx-auto h-9 w-9 text-clw-gold-ink" />
            <h2 className="mt-4 font-display text-2xl text-clw-white">Registration is not open yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-clw-gray">
              The next Wizards season will appear here as soon as the club publishes it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { season, event } = selected
  const pricing = resolveDuesPricing(season, today)
  const athletes = (athleteData ?? []) as Athlete[]
  const athleteIds = athletes.map((athlete) => athlete.id)
  const currentCardWindow = `${season.registration_open_date}T00:00:00.000Z`

  const [{ data: enrollmentData }, { data: documentData }] = athleteIds.length
    ? await Promise.all([
        supabase.from('season_enrollments').select('*').eq('season_registration_id', season.id).in('athlete_id', athleteIds),
        supabase
          .from('athlete_documents')
          .select('*')
          .in('athlete_id', athleteIds)
          .eq('doc_type', 'usa_wrestling_card')
          .gte('uploaded_at', currentCardWindow)
          .order('uploaded_at', { ascending: false }),
      ])
    : [{ data: [] as SeasonEnrollment[] }, { data: [] as AthleteDocument[] }]

  const enrollments = (enrollmentData ?? []) as SeasonEnrollment[]
  const enrollmentByAthlete = new Map(enrollments.map((enrollment) => [enrollment.athlete_id, enrollment]))
  const documentById = new Map(((documentData ?? []) as AthleteDocument[]).map((document) => [document.id, document]))

  const latestCardByAthlete = new Map<string, AthleteDocument>()
  for (const document of (documentData ?? []) as AthleteDocument[]) {
    if (!latestCardByAthlete.has(document.athlete_id)) latestCardByAthlete.set(document.athlete_id, document)
  }

  const duesIds = enrollments.map((enrollment) => enrollment.dues_payment_id).filter(Boolean) as string[]
  const { data: duesData } = duesIds.length
    ? await supabase.from('dues_payments').select('*').in('id', duesIds)
    : { data: [] as DuesPayment[] }
  const duesById = new Map(((duesData ?? []) as DuesPayment[]).map((dues) => [dues.id, dues]))

  const isOpen = season.registration_open_date <= today && season.registration_close_date >= today
  const isUpcoming = today < season.registration_open_date

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-clw-gold-ink">{season.season_label}</p>
        <h1 className="mt-2 text-3xl font-display text-clw-white">{event.title}</h1>
        <p className="mt-2 text-sm text-clw-gray">
          {isOpen
            ? `Registration closes ${formatDate(season.registration_close_date)}.`
            : isUpcoming
              ? `Registration opens ${formatDate(season.registration_open_date)}.`
              : `Registration closed ${formatDate(season.registration_close_date)}.`}
        </p>
      </div>

      {checkout === 'success' && (
        <Alert className="border-clw-gold/40 bg-clw-gold/10">
          <AlertDescription className="text-clw-gold-ink">
            Payment received. Your balance and registration status will update once Stripe confirms the payment.
          </AlertDescription>
        </Alert>
      )}
      {checkout === 'cancelled' && (
        <Alert>
          <AlertDescription className="text-clw-gray">Checkout was cancelled. Your registration is still saved.</AlertDescription>
        </Alert>
      )}

      <Card className="card-depth border-clw-gold/15 bg-clw-black-3">
        <CardContent className="grid gap-4 py-5 text-sm sm:grid-cols-3">
          <div>
            <p className="text-clw-gray/70">Season starts</p>
            <p className="mt-1 text-clw-white">{formatDate(event.date)}</p>
          </div>
          <div>
            <p className="text-clw-gray/70">Dues per wrestler</p>
            {pricing.isDiscounted ? (
              <>
                <p className="mt-1 text-clw-white">
                  {money(pricing.amountCents)}{' '}
                  <span className="text-clw-gray/70 line-through">{money(pricing.regularAmountCents)}</span>
                </p>
                <p className="mt-0.5 text-clw-gold-ink">
                  Save {money(pricing.regularAmountCents - pricing.amountCents)} — register by{' '}
                  {formatDate(pricing.discountDeadline!)}
                </p>
              </>
            ) : pricing.discountAmountCents != null ? (
              <>
                <p className="mt-1 text-clw-white">{money(pricing.regularAmountCents)}</p>
                <p className="mt-0.5 text-clw-gray/70">Early pricing ended {formatDate(pricing.discountDeadline!)}</p>
              </>
            ) : (
              <p className="mt-1 text-clw-white">{money(pricing.regularAmountCents)}</p>
            )}
          </div>
          <div>
            <p className="text-clw-gray/70">USA Wrestling card</p>
            <p className="mt-1 text-clw-white">{season.require_usa_card ? 'Verified card on file required' : 'Not required'}</p>
          </div>
        </CardContent>
      </Card>

      {(season.instructions || event.notes) && (
        <Card className="border-clw-gold/10 bg-clw-black-3">
          <CardHeader>
            <CardTitle className="text-base text-clw-white">Before you submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-clw-gray">
            {event.notes && <p>{event.notes}</p>}
            {season.instructions && <p>{season.instructions}</p>}
          </CardContent>
        </Card>
      )}

      {athletes.length > 0 && (
        <Card className="card-depth border-clw-gold/10 bg-clw-black-3">
          <CardHeader>
            <CardTitle className="text-base text-clw-white">Confirm your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-relaxed text-clw-gray">
              Your account and wrestler profiles carry over from last season. Check anything that may have changed,
              then submit each wrestler below.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-clw-black p-4">
                <p className="text-sm font-medium text-clw-white">Contact</p>
                <p className="mt-2 truncate text-sm text-clw-gray">{profile?.full_name ?? 'Name not set'}</p>
                <p className="truncate text-sm text-clw-gray">{profile?.email ?? ''}</p>
                <p className="text-sm text-clw-gray">{profile?.phone ?? 'No phone on file'}</p>
                <Link href="/profile" className="mt-3 inline-block text-sm font-medium text-clw-gold-ink hover:underline">
                  Update contact info
                </Link>
              </div>
              <div className="rounded-xl bg-clw-black p-4">
                <p className="text-sm font-medium text-clw-white">Documents</p>
                <p className="mt-2 text-sm text-clw-gray">
                  A card the club already verified carries over. Replace it here if it has changed or expired.
                </p>
                <Link href="/documents" className="mt-3 inline-block text-sm font-medium text-clw-gold-ink hover:underline">
                  Review documents
                </Link>
              </div>
              <div className="rounded-xl bg-clw-black p-4">
                <p className="text-sm font-medium text-clw-white">Dues</p>
                <p className="mt-2 text-sm text-clw-gray">
                  Pay when you register or leave it pending and pay later. Wrestlers are cleared once dues are settled
                  and documents are verified.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {athletes.length === 0 ? (
        <Card className="card-depth border-clw-gold/10 bg-clw-black-3">
          <CardContent className="py-12 text-center">
            <Plus className="mx-auto h-9 w-9 text-clw-gold-ink" />
            <h2 className="mt-4 font-display text-2xl text-clw-white">Add a wrestler to begin</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-clw-gray">
              Your parent account stays year to year. Add your wrestler once, then register that saved profile each season.
            </p>
            <Button asChild className="mt-5">
              <Link href="/athletes/new?redirectTo=/registration">Add wrestler</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {athletes.map((athlete) => {
            const enrollment = enrollmentByAthlete.get(athlete.id)
            const latestCard = latestCardByAthlete.get(athlete.id)
            const boundCard = enrollment?.usa_card_document_id
              ? documentById.get(enrollment.usa_card_document_id)
              : undefined
            const card =
              enrollment?.status === 'submitted' || enrollment?.status === 'approved'
                ? boundCard ?? latestCard
                : latestCard
            const canEditCard =
              isOpen &&
              (!enrollment || enrollment.status === 'changes_requested' || enrollment.status === 'withdrawn')
            const dues = enrollment?.dues_payment_id ? duesById.get(enrollment.dues_payment_id) : undefined
            const paid =
              pricing.amountCents === 0 || dues?.status === 'paid' || dues?.status === 'waived'
            const remaining = dues ? Math.max(0, dues.amount_cents - dues.amount_paid_cents) : pricing.amountCents
            const canSubmit = isOpen && (!season.require_usa_card || Boolean(latestCard))
            const resubmitting = enrollment?.status === 'changes_requested' || enrollment?.status === 'withdrawn'

            return (
              <Card key={athlete.id} className="card-depth border-clw-gold/10 bg-clw-black-3">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-xl text-clw-white">
                      {athlete.first_name} {athlete.last_name}
                    </CardTitle>
                    <p className="mt-1 text-sm text-clw-gray">{athlete.practice_group}</p>
                  </div>
                  {enrollment && (
                    <Badge variant="outline" className={ENROLLMENT_STYLES[enrollment.status]}>
                      {ENROLLMENT_LABELS[enrollment.status]}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {enrollment?.status === 'changes_requested' && (
                    <Alert className="border-amber-500/40 bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <AlertDescription className="text-amber-200">
                        {enrollment.admin_note || 'The club needs an updated item before this registration can be approved.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-clw-black p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-medium text-clw-white">
                            <FileCheck2 className="h-4 w-4 text-clw-gold-ink" /> USA Wrestling card
                          </p>
                          <p className="mt-1 text-xs text-clw-gray">
                            {!season.require_usa_card
                              ? 'Not required for this season'
                              : !isOpen && !card
                                ? `Upload available ${formatDate(season.registration_open_date)}`
                                : !card
                                  ? 'Upload the card to register'
                                  : card.verified
                                    ? 'Verified by the club, carries over to this season'
                                    : enrollment?.status === 'submitted'
                                      ? 'Submitted with this registration, awaiting review'
                                      : 'Uploaded, awaiting club review'}
                          </p>
                        </div>
                        {season.require_usa_card && canEditCard && (
                          <DocumentControls
                            userId={userId}
                            athleteId={athlete.id}
                            docType="usa_wrestling_card"
                            existingPath={latestCard?.file_url ?? null}
                          />
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-clw-black p-4">
                      <p className="flex items-center gap-2 text-sm font-medium text-clw-white">
                        <CreditCard className="h-4 w-4 text-clw-gold-ink" /> Season dues
                      </p>
                      <p className="mt-1 text-sm text-clw-gray">
                        {!enrollment ? (
                          pricing.isDiscounted ? (
                            <>
                              {money(pricing.amountCents)} due after submission —{' '}
                              <span className="text-clw-gold-ink">
                                save {money(pricing.regularAmountCents - pricing.amountCents)} through{' '}
                                {formatDate(pricing.discountDeadline!)}
                              </span>
                            </>
                          ) : (
                            `${money(pricing.amountCents)} due after submission`
                          )
                        ) : paid ? (
                          'Paid or waived'
                        ) : dues ? (
                          `${money(remaining)} remaining`
                        ) : (
                          'Payment record is being prepared'
                        )}
                      </p>
                      {enrollment && dues && !paid && remaining > 0 && (
                        <div className="mt-3">
                          <PayButton duesId={dues.id} label={`Pay ${money(remaining)}`} returnPath="/registration" />
                        </div>
                      )}
                    </div>
                  </div>

                  {enrollment?.status === 'approved' ? (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                      <div>
                        <p className="font-medium text-emerald-200">Cleared for {season.season_label}</p>
                        <p className="mt-1 text-sm text-emerald-100/70">The club approved this wrestler&apos;s registration.</p>
                      </div>
                    </div>
                  ) : enrollment?.status === 'submitted' ? (
                    <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                      <div>
                        <p className="font-medium text-blue-200">Submitted for club review</p>
                        <p className="mt-1 text-sm text-blue-100/70">
                          The submitted card is locked while the club reviews it. Payment can still be completed above.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-clw-gold/10 pt-4">
                      <p className="max-w-md text-sm text-clw-gray">
                        {!isOpen
                          ? isUpcoming
                            ? `Registration opens ${formatDate(season.registration_open_date)}.`
                            : 'Registration is closed.'
                          : season.require_usa_card && !latestCard
                            ? 'Upload the current-season wrestling card before submitting.'
                            : 'Submit this wrestler for the current season. You will pay dues after the registration is created.'}
                      </p>
                      <EnrollmentControls
                        seasonRegistrationId={season.id}
                        athleteId={athlete.id}
                        enrollmentId={enrollment?.id}
                        canSubmit={canSubmit}
                        resubmitting={resubmitting}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <p className="text-xs leading-relaxed text-clw-gray/70">
        Parent accounts and wrestler profiles remain in the system. Only the season enrollment, current card review, and dues are renewed each year.
      </p>
    </div>
  )
}
