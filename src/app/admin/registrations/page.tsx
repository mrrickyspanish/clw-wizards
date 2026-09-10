import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ChevronDown, Clock3, CreditCard, FileCheck2, Users } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { formatCents } from '@/lib/format/money'
import type {
  Athlete,
  AthleteDocument,
  ClubEvent,
  Disclosure,
  DisclosureAcceptance,
  DuesPayment,
  Profile,
  SeasonEnrollment,
  SeasonRegistration,
} from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AthleteDialog } from '../families/AthleteDialog'
import { ParentDialog } from '../families/ParentDialog'
import { DuesEditDialog } from '../dues/DuesEditDialog'
import { ReviewControls } from './ReviewControls'

function money(cents: number) {
  return formatCents(cents)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLES: Record<SeasonEnrollment['status'], string> = {
  submitted: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  changes_requested: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  approved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  withdrawn: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
}

const STATUS_LABELS: Record<SeasonEnrollment['status'], string> = {
  submitted: 'submitted',
  changes_requested: 'changes requested',
  approved: 'approved',
  withdrawn: 'withdrawn',
}

export default async function AdminRegistrationsPage() {
  const supabase = createAdminSupabase()
  const { data: enrollmentData, error } = await supabase.from('season_enrollments').select('*')

  const enrollments = (enrollmentData ?? []) as SeasonEnrollment[]
  const seasonIds = [...new Set(enrollments.map((row) => row.season_registration_id))]
  const athleteIds = [...new Set(enrollments.map((row) => row.athlete_id))]
  const parentIds = [...new Set(enrollments.map((row) => row.parent_id))]
  const duesIds = [...new Set(enrollments.map((row) => row.dues_payment_id).filter(Boolean))] as string[]
  const documentIds = [...new Set(enrollments.map((row) => row.usa_card_document_id).filter(Boolean))] as string[]

  const [{ data: seasonData }, { data: athleteData }, { data: parentData }, { data: duesData }, { data: documentData }] =
    await Promise.all([
      seasonIds.length
        ? supabase.from('season_registrations').select('*').in('id', seasonIds)
        : Promise.resolve({ data: [] as SeasonRegistration[] }),
      athleteIds.length
        ? supabase.from('athletes').select('*').in('id', athleteIds)
        : Promise.resolve({ data: [] as Athlete[] }),
      parentIds.length
        ? supabase.from('profiles').select('*').in('id', parentIds)
        : Promise.resolve({ data: [] as Profile[] }),
      duesIds.length
        ? supabase.from('dues_payments').select('*').in('id', duesIds)
        : Promise.resolve({ data: [] as DuesPayment[] }),
      documentIds.length
        ? supabase.from('athlete_documents').select('*').in('id', documentIds)
        : Promise.resolve({ data: [] as AthleteDocument[] }),
    ])

  const seasons = (seasonData ?? []) as SeasonRegistration[]
  const eventIds = [...new Set(seasons.map((row) => row.event_id))]
  const { data: eventData } = eventIds.length
    ? await supabase.from('club_events').select('*').in('id', eventIds)
    : { data: [] as ClubEvent[] }

  // Signatures for every enrollment on screen, plus the agreements currently
  // required, so each card can say which are outstanding.
  const [{ data: requiredDisclosureData }, { data: acceptanceData }] = await Promise.all([
    supabase.from('disclosures').select('*').eq('active', true).eq('required', true),
    seasonIds.length
      ? supabase.from('disclosure_acceptances').select('*').in('season_registration_id', seasonIds)
      : Promise.resolve({ data: [] as DisclosureAcceptance[] }),
  ])

  const requiredDisclosures = (requiredDisclosureData ?? []) as Disclosure[]
  const acceptancesByEnrollment = new Map<string, DisclosureAcceptance[]>()
  for (const acceptance of (acceptanceData ?? []) as DisclosureAcceptance[]) {
    const key = `${acceptance.season_registration_id}:${acceptance.athlete_id}`
    const list = acceptancesByEnrollment.get(key) ?? []
    list.push(acceptance)
    acceptancesByEnrollment.set(key, list)
  }

  const disclosureById = new Map(requiredDisclosures.map((disclosure) => [disclosure.id, disclosure]))

  const seasonById = new Map(seasons.map((season) => [season.id, season]))
  const eventById = new Map(((eventData ?? []) as ClubEvent[]).map((event) => [event.id, event]))
  const athleteById = new Map(((athleteData ?? []) as Athlete[]).map((athlete) => [athlete.id, athlete]))
  const parentById = new Map(((parentData ?? []) as Profile[]).map((parent) => [parent.id, parent]))
  const duesById = new Map(((duesData ?? []) as DuesPayment[]).map((dues) => [dues.id, dues]))
  const documentById = new Map(((documentData ?? []) as AthleteDocument[]).map((document) => [document.id, document]))

  const submittedCount = enrollments.filter((row) => row.status === 'submitted').length
  const attentionCount = enrollments.filter((row) => row.status === 'changes_requested').length
  const approvedCount = enrollments.filter((row) => row.status === 'approved').length

  // Alphabetical by wrestler last name so staff can find a specific family in a
  // long list, not just see what's newest. Ties break on first name so
  // siblings/same-surname wrestlers land in a stable, predictable order;
  // enrollments whose athlete record is missing sort to the end instead of
  // collating with real names.
  const sortedEnrollments = [...enrollments].sort((a, b) => {
    const athleteA = athleteById.get(a.athlete_id)
    const athleteB = athleteById.get(b.athlete_id)
    const lastA = athleteA?.last_name?.trim() ?? ''
    const lastB = athleteB?.last_name?.trim() ?? ''

    if (!lastA && !lastB) return 0
    if (!lastA) return 1
    if (!lastB) return -1

    const lastNameOrder = lastA.localeCompare(lastB, 'en', { sensitivity: 'base' })
    if (lastNameOrder !== 0) return lastNameOrder

    const firstA = athleteA?.first_name?.trim() ?? ''
    const firstB = athleteB?.first_name?.trim() ?? ''
    return firstA.localeCompare(firstB, 'en', { sensitivity: 'base' })
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">Season Registrations</h1>
          <p className="max-w-2xl text-sm text-clw-gray">
            Verify documentation and payment, then clear wrestlers to participate. Family and wrestler details are live
            from Families, so edits in either place use the same record.
          </p>
        </div>
        <Link href="/admin/communications" className="text-sm text-clw-gold hover:text-clw-gold-l">
          Send registration reminder
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardContent className="flex items-center gap-4 py-5">
            <Clock3 className="h-6 w-6 text-blue-400" />
            <div>
              <p className="text-2xl font-display text-clw-white">{submittedCount}</p>
              <p className="text-sm text-clw-gray">Awaiting review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardContent className="flex items-center gap-4 py-5">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <div>
              <p className="text-2xl font-display text-clw-white">{attentionCount}</p>
              <p className="text-sm text-clw-gray">Parent update needed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardContent className="flex items-center gap-4 py-5">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <div>
              <p className="text-2xl font-display text-clw-white">{approvedCount}</p>
              <p className="text-sm text-clw-gray">Approved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load registrations: {error.message}
        </p>
      )}

      {!error && enrollments.length === 0 && (
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-9 w-9 text-clw-gold" />
            <h2 className="mt-4 font-display text-2xl text-clw-white">No registrations submitted yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-clw-gray">
              Create a Season Registration event in Practices &amp; Events. Parent submissions will appear here.
            </p>
            <Link href="/admin/practices" className="mt-4 inline-block text-sm text-clw-gold">
              Open Practices &amp; Events
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sortedEnrollments.map((enrollment) => {
          const season = seasonById.get(enrollment.season_registration_id)
          const event = season ? eventById.get(season.event_id) : undefined
          const athlete = athleteById.get(enrollment.athlete_id)
          const parent = parentById.get(enrollment.parent_id)
          const dues = enrollment.dues_payment_id ? duesById.get(enrollment.dues_payment_id) : undefined
          const card = enrollment.usa_card_document_id
            ? documentById.get(enrollment.usa_card_document_id)
            : undefined
          const documentReady = !season?.require_usa_card || Boolean(card?.verified)
          const paymentReady =
            !season || season.dues_amount_cents === 0 || dues?.status === 'paid' || dues?.status === 'waived'

          const acceptances =
            acceptancesByEnrollment.get(`${enrollment.season_registration_id}:${enrollment.athlete_id}`) ?? []
          const signedIds = new Set(acceptances.map((acceptance) => acceptance.disclosure_id))
          const missingDisclosures = requiredDisclosures.filter((disclosure) => !signedIds.has(disclosure.id))
          const disclosuresReady = missingDisclosures.length === 0

          const approvalReady = documentReady && paymentReady && disclosuresReady

          return (
            <details
              key={enrollment.id}
              className="group rounded-lg border border-clw-gold/10 bg-clw-black text-card-foreground shadow-sm"
            >
              <summary className="flex cursor-pointer list-none flex-row flex-wrap items-start justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <div className="flex items-start gap-3">
                  <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-clw-gold transition-transform duration-200 group-open:rotate-180" />
                  <div>
                    <p className="text-lg font-semibold leading-none tracking-tight text-clw-white">
                      {athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Unknown wrestler'}
                    </p>
                    <p className="mt-1 text-sm text-clw-gray">
                      {parent?.full_name ?? 'Unknown parent'} · {parent?.email ?? 'No email'}
                    </p>
                    <p className="mt-1 text-sm text-clw-gray/70">
                      {event?.title ?? season?.season_label ?? 'Season registration'} · submitted {formatDate(enrollment.submitted_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {approvalReady ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Ready for approval" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" aria-label="Needs attention" />
                  )}
                  <Badge variant="outline" className={STATUS_STYLES[enrollment.status]}>
                    {STATUS_LABELS[enrollment.status]}
                  </Badge>
                </div>
              </summary>
              <CardContent className="space-y-4 border-t border-clw-gold/10 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-clw-gold/10 bg-clw-black-2 p-3">
                  <div>
                    <p className="text-sm font-medium text-clw-white">Family record</p>
                    <p className="text-xs text-clw-gray">These are the same parent and wrestler records used in Families.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {parent && <ParentDialog parent={parent} familyId={parent.id} />}
                    {athlete && <AthleteDialog athlete={athlete} />}
                    <Link
                      href={`/admin/families/${enrollment.parent_id}`}
                      className="px-2 text-sm text-clw-gold hover:text-clw-gold-l"
                    >
                      Open family
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-clw-gold/10 bg-clw-black-2 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-clw-white">
                      <FileCheck2 className="h-4 w-4 text-clw-gold" /> USA Wrestling card
                    </p>
                    <p className="mt-2 text-sm text-clw-gray">
                      {!season?.require_usa_card
                        ? 'Not required'
                        : !card
                          ? 'Current-season card missing'
                          : card.verified
                            ? `Verified · ${card.file_name}`
                            : `Awaiting verification · ${card.file_name}`}
                    </p>
                  </div>
                  <div className="rounded-md border border-clw-gold/10 bg-clw-black-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-medium text-clw-white">
                        <CreditCard className="h-4 w-4 text-clw-gold" /> Season dues
                      </p>
                      {dues && <DuesEditDialog dues={dues} triggerLabel="Edit" />}
                    </div>
                    <p className="mt-2 text-sm text-clw-gray">
                      {!season
                        ? 'Season record unavailable'
                        : season.dues_amount_cents === 0
                          ? 'No dues required'
                          : !dues
                            ? 'Dues record missing'
                            : `${money(dues.amount_paid_cents)} of ${money(dues.amount_cents)} · ${dues.status}`}
                    </p>
                  </div>
                </div>

                {requiredDisclosures.length > 0 && (
                  <div className="rounded-md border border-clw-gold/10 bg-clw-black-2 p-3">
                    <p className="text-sm font-medium text-clw-white">Agreements</p>
                    <ul className="mt-2 space-y-1">
                      {acceptances.map((acceptance) => {
                        const disclosure = disclosureById.get(acceptance.disclosure_id)
                        return (
                          <li key={acceptance.id} className="text-sm text-clw-gray">
                            <span className="text-emerald-400">Signed</span> · {disclosure?.title ?? 'Agreement'} v
                            {disclosure?.version ?? '—'} · {acceptance.typed_signature ?? 'no signature captured'} ·{' '}
                            {new Date(acceptance.accepted_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })}
                            {acceptance.ip_address ? ` · ${acceptance.ip_address}` : ''}
                          </li>
                        )
                      })}
                      {missingDisclosures.map((disclosure) => (
                        <li key={disclosure.id} className="text-sm text-amber-300">
                          Not signed · {disclosure.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {enrollment.admin_note && (
                  <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200">
                    Club note: {enrollment.admin_note}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-clw-gold/10 pt-4">
                  <p className="text-sm text-clw-gray">
                    {approvalReady
                      ? 'Current-season documentation, agreements, and payment are ready for approval.'
                      : [
                          documentReady ? null : 'Verify the submitted wrestling card.',
                          disclosuresReady ? null : 'Required agreements are unsigned.',
                          paymentReady ? null : 'Payment is still outstanding.',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                  </p>
                  <ReviewControls
                    enrollmentId={enrollment.id}
                    documentId={card?.id ?? null}
                    documentVerified={card?.verified ?? false}
                    status={enrollment.status}
                    approvalReady={approvalReady}
                  />
                </div>
              </CardContent>
            </details>
          )
        })}
      </div>
    </div>
  )
}
