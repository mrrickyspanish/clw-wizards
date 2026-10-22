import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ChevronDown } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { createServerSupabase } from '@/lib/supabase/server'
import { isFullAdmin } from '@/lib/auth/admin'
import type {
  Athlete,
  AthleteDocument,
  CommunicationLogRow,
  Disclosure,
  DisclosureAcceptance,
  DuesPayment,
  Profile,
  SeasonEnrollment,
  SeasonRegistration,
} from '@/types/database'
import { formatCents } from '@/lib/format/money'
import { registrationCard } from '@/lib/registration-card'
import { coveredWrestlers, type CoParentLink } from '@/lib/family'
import { latestRejections, rejectionLine, type LatestRejection } from '@/lib/documents/review-queue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AthleteDialog } from '../AthleteDialog'
import { BirthCertificateToggle } from '../../registrations/BirthCertificateToggle'
import { BirthCertificateDocument } from '../../registrations/BirthCertificateDocument'
import { DocumentLinks } from '../../registrations/DocumentLinks'
import { DeleteFamilyButton } from '../DeleteFamilyButton'
import { DeleteWrestlerButton } from '../DeleteWrestlerButton'
import { FamilyActiveToggle } from '../FamilyActiveToggle'
import { ParentDialog } from '../ParentDialog'
import { removeFamilyContactAsAdmin, saveFamilyContactAsAdmin } from '../actions'
import { FamilyContactsManager } from '@/components/family/FamilyContactsManager'
import { contactScopeLabel, listFamilyContacts, MAX_FAMILY_CONTACTS } from '@/lib/family-contacts'
import { COMM_TYPE_LABELS } from '@/lib/comms/labels'

// How many past messages to show on a family's profile. Older history is
// still in communication_log if it's ever needed — this is a recent-activity
// glance, not a full export.
const MESSAGE_HISTORY_LIMIT = 25

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Same labels and colors as Registrations, so a status reads the same on both pages.
const ENROLLMENT_STYLES: Record<SeasonEnrollment['status'], string> = {
  submitted: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  changes_requested: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  approved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  withdrawn: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
}

const ENROLLMENT_LABELS: Record<SeasonEnrollment['status'], string> = {
  submitted: 'submitted',
  changes_requested: 'changes requested',
  approved: 'approved',
  withdrawn: 'withdrawn',
}

type GuardianRow = Pick<Profile, 'id' | 'full_name' | 'email' | 'phone' | 'sms_opt_in' | 'is_active'>

export default async function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminSupabase()

  // The service-role client above answers for the whole dashboard, so the
  // viewer's own tier has to be read through their session client instead.
  const viewerIsFullAdmin = await isFullAdmin(await createServerSupabase())

  const { data: family } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'parent')
    .single()

  if (!family) notFound()
  const parent = family as Profile

  const { data: athleteRows } = await supabase
    .from('athletes')
    .select('*')
    .eq('parent_id', id)
    .order('first_name', { ascending: true })
  const athletes = (athleteRows ?? []) as Athlete[]

  // Each wrestler's newest uploaded birth certificate, to view and verify here.
  const { data: birthCertificateRows } = athletes.length
    ? await supabase
        .from('athlete_documents')
        .select('id, athlete_id, verified, uploaded_at')
        .eq('doc_type', 'birth_certificate')
        .in('athlete_id', athletes.map((a) => a.id))
    : { data: [] as { id: string; athlete_id: string; verified: boolean; uploaded_at: string }[] }
  const birthCertificateByAthlete = new Map<string, { id: string; verified: boolean; uploaded_at: string }>()
  for (const row of birthCertificateRows ?? []) {
    const known = birthCertificateByAthlete.get(row.athlete_id)
    if (!known || row.uploaded_at > known.uploaded_at) birthCertificateByAthlete.set(row.athlete_id, row)
  }

  // This season's registration for each wrestler: status, dues, agreements and
  // USA card, worked out the same way Registrations does (current season = the
  // one closing last; card = registrationCard).
  const athleteIds = athletes.map((a) => a.id)
  const { data: currentSeasonData } = await supabase
    .from('season_registrations')
    .select('*')
    .order('registration_close_date', { ascending: false })
    .limit(1)
  const season = ((currentSeasonData ?? []) as SeasonRegistration[])[0]
  const [{ data: enrollmentRows }, { data: cardRows }, { data: disclosureRows }, { data: acceptanceRows }] =
    await Promise.all([
      season && athleteIds.length
        ? supabase.from('season_enrollments').select('*').eq('season_registration_id', season.id).in('athlete_id', athleteIds)
        : Promise.resolve({ data: [] as SeasonEnrollment[] }),
      athleteIds.length
        ? supabase.from('athlete_documents').select('*').eq('doc_type', 'usa_wrestling_card').in('athlete_id', athleteIds)
        : Promise.resolve({ data: [] as AthleteDocument[] }),
      supabase.from('disclosures').select('*').eq('active', true).eq('required', true),
      season && athleteIds.length
        ? supabase
            .from('disclosure_acceptances')
            .select('*')
            .eq('season_registration_id', season.id)
            .in('athlete_id', athleteIds)
        : Promise.resolve({ data: [] as DisclosureAcceptance[] }),
    ])
  const enrollmentByAthlete = new Map(((enrollmentRows ?? []) as SeasonEnrollment[]).map((e) => [e.athlete_id, e]))
  const duesIds = [...enrollmentByAthlete.values()].map((e) => e.dues_payment_id).filter(Boolean) as string[]
  const { data: duesRows } = duesIds.length
    ? await supabase.from('dues_payments').select('*').in('id', duesIds)
    : { data: [] as DuesPayment[] }
  const duesById = new Map(((duesRows ?? []) as DuesPayment[]).map((d) => [d.id, d]))
  const cardsByAthlete = new Map<string, AthleteDocument[]>()
  for (const card of (cardRows ?? []) as AthleteDocument[]) {
    cardsByAthlete.set(card.athlete_id, [...(cardsByAthlete.get(card.athlete_id) ?? []), card])
  }
  const requiredDisclosures = (disclosureRows ?? []) as Disclosure[]
  // Why a document now reads as missing, when the club rejected the upload.
  const rejectionByKey = await latestRejections(supabase, athleteIds)
  const signedByAthlete = new Map<string, Set<string>>()
  for (const a of (acceptanceRows ?? []) as DisclosureAcceptance[]) {
    signedByAthlete.set(a.athlete_id, (signedByAthlete.get(a.athlete_id) ?? new Set()).add(a.disclosure_id))
  }

  // Co-guardians who have joined this family via an invite code.
  const { data: guardianLinks } = await supabase
    .from('family_guardians')
    .select('guardian_id, owner_id, athlete_ids, locked')
    .eq('owner_id', id)
  const guardianIds = (guardianLinks ?? []).map((g) => g.guardian_id)
  const coveredByGuardian = new Map(
    ((guardianLinks ?? []) as CoParentLink[]).map((link) => [
      link.guardian_id,
      { locked: Boolean(link.locked), all: link.athlete_ids === null, wrestlers: coveredWrestlers(link, athletes) },
    ])
  )

  // The other side: families this account is a co-parent on. Their wrestlers
  // belong to the other parent's account, so without this a co-parent's own page
  // read "0 athletes".
  const { data: coParentLinkRows } = await supabase
    .from('family_guardians')
    .select('guardian_id, owner_id, athlete_ids, locked')
    .eq('guardian_id', id)
  const coParentLinks = (coParentLinkRows ?? []) as CoParentLink[]
  const coParentOwnerIds = [...new Set(coParentLinks.map((l) => l.owner_id))]
  const [{ data: coOwnerRows }, { data: coAthleteRows }] = coParentOwnerIds.length
    ? await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', coParentOwnerIds),
        supabase.from('athletes').select('*').in('parent_id', coParentOwnerIds).order('first_name', { ascending: true }),
      ])
    : [{ data: [] as Pick<Profile, 'id' | 'full_name' | 'email'>[] }, { data: [] as Athlete[] }]
  const coParentWrestlerIds = coParentLinks.flatMap((l) => coveredWrestlers(l, (coAthleteRows ?? []) as Athlete[]).map((a) => a.id))
  const { data: coEnrollmentRows } =
    season && coParentWrestlerIds.length
      ? await supabase
          .from('season_enrollments')
          .select('athlete_id, status')
          .eq('season_registration_id', season.id)
          .in('athlete_id', coParentWrestlerIds)
      : { data: [] as Pick<SeasonEnrollment, 'athlete_id' | 'status'>[] }
  const coStatusByAthlete = new Map((coEnrollmentRows ?? []).map((e) => [e.athlete_id, e.status as SeasonEnrollment['status']]))
  const coParentFamilies = coParentLinks.map((link) => {
    const owner = (coOwnerRows ?? []).find((o) => o.id === link.owner_id)
    return {
      ownerId: link.owner_id,
      ownerName: owner?.full_name || owner?.email || 'another family',
      locked: Boolean(link.locked),
      wrestlers: coveredWrestlers(link, (coAthleteRows ?? []) as Athlete[]),
    }
  })
  let guardians: GuardianRow[] = []
  if (guardianIds.length) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, sms_opt_in, is_active')
      .in('id', guardianIds)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
    guardians = (data ?? []) as GuardianRow[]
  }

  // Every profile in this family (the owner plus any co-guardians), so a
  // message sent to a co-guardian specifically still shows up here instead
  // of only on their own separate admin record.
  const familyProfileIds = [id, ...guardianIds]
  const nameById = new Map<string, string>([
    [id, parent.full_name || parent.email || 'Primary parent'],
    ...guardians.map((g): [string, string] => [g.id, g.full_name || g.email || 'Co-guardian']),
  ])

  const familyContacts = await listFamilyContacts(supabase, id)
  const activeWrestlers = athletes.filter((a) => a.active)
  // A copy sent to a family contact is logged under the family's account; name the contact.
  const contactNameByEmail = new Map(
    familyContacts.flatMap((c) => (c.email ? [[c.email.toLowerCase(), c.name || c.email] as [string, string]] : []))
  )

  const { data: messageRows } = await supabase
    .from('communication_log')
    .select('*')
    .in('recipient_id', familyProfileIds)
    .order('sent_at', { ascending: false })
    .limit(MESSAGE_HISTORY_LIMIT)
  const messages = (messageRows ?? []) as CommunicationLogRow[]

  return (
    <div>
      <Link
        href="/admin/families"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-base text-clw-gray hover:text-clw-gold"
      >
        <ArrowLeft className="h-4 w-4" /> Back to families
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-display text-clw-gold">{parent.full_name ?? 'Unnamed parent'}</h1>
        <p className="text-sm text-clw-gray">{parent.email ?? '—'}</p>
      </div>

      <Card className="mb-6 border-clw-gold/10 bg-clw-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-clw-gray">Primary parent contact &amp; preferences</CardTitle>
          <ParentDialog parent={parent} familyId={parent.id} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-clw-gray/70">Phone</p>
            <p className="text-clw-white">{parent.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-clw-gray/70">SMS opt-in</p>
            <p className="text-clw-white">{parent.sms_opt_in ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-clw-gray/70">Account</p>
            <p className="text-clw-white">{parent.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 border-clw-gold/10 bg-clw-black">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-clw-gray">
            Also gets this family&apos;s emails <span className="text-clw-gray/60">({familyContacts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FamilyContactsManager
            audience="admin"
            max={MAX_FAMILY_CONTACTS}
            save={saveFamilyContactAsAdmin.bind(null, id)}
            remove={removeFamilyContactAsAdmin.bind(null, id)}
            contacts={familyContacts.map((c) => ({
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              forWrestlers: contactScopeLabel(c.athlete_ids, activeWrestlers),
            }))}
          />
        </CardContent>
      </Card>

      {guardians.length > 0 && (
        <Card className="mb-6 border-clw-gold/10 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">
              Co-guardians <span className="text-clw-gray/60">({guardians.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {guardians.map((guardian) => (
              <div key={guardian.id} className="rounded-md border border-clw-gold/10 bg-clw-black-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-clw-white">{guardian.full_name ?? 'Unnamed guardian'}</p>
                    <p className="text-sm text-clw-gray">{guardian.email ?? '—'}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      guardian.is_active
                        ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                        : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                    }
                  >
                    {guardian.is_active ? 'active' : 'inactive'}
                  </Badge>
                </div>

                {coveredByGuardian.get(guardian.id) && (
                  <p className="mt-3 text-base text-clw-gray">
                    {coveredByGuardian.get(guardian.id)!.all
                      ? 'Co-parent for every wrestler on this family'
                      : coveredByGuardian.get(guardian.id)!.wrestlers.length === 0
                        ? 'Co-parent, but none of the wrestlers they were linked to are on this family now'
                        : `Co-parent for ${coveredByGuardian
                            .get(guardian.id)!
                            .wrestlers.map((a) => `${a.first_name} ${a.last_name}`)
                            .join(', ')}`}
                    {coveredByGuardian.get(guardian.id)!.locked ? '. Set up by the club, so neither parent can remove the other.' : '.'}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-clw-gold/10 pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-clw-gray/70">Phone</p>
                    <p className="text-clw-white">{guardian.phone ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-clw-gray/70">SMS opt-in</p>
                    <p className="text-clw-white">{guardian.sms_opt_in ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-clw-gold/10 pt-4">
                  <ParentDialog parent={guardian} relationship="co-guardian" familyId={parent.id} />
                  <FamilyActiveToggle
                    parentId={guardian.id}
                    isActive={guardian.is_active}
                    familyId={parent.id}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {coParentFamilies.length > 0 && (
        <Card className="mb-6 border-clw-gold/20 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">Co-parent on another family</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {coParentFamilies.map((family) => (
              <div key={family.ownerId} className="space-y-3 rounded-md border border-clw-gold/10 bg-clw-black-2 p-4">
                <p className="text-base text-clw-gray">
                  {parent.first_name || parent.full_name || 'This parent'} can see these wrestlers on{' '}
                  <span className="text-clw-white">{family.ownerName}</span>&apos;s family
                  {family.locked
                    ? ', pay their dues and upload their documents. Set up by the club, so neither parent can remove the other.'
                    : ', and help manage them.'}
                </p>
                {family.wrestlers.length === 0 ? (
                  <p className="text-base text-clw-gray">No wrestlers on that family right now.</p>
                ) : (
                  <ul className="space-y-2">
                    {family.wrestlers.map((wrestler) => {
                      const status = coStatusByAthlete.get(wrestler.id)
                      return (
                        <li key={wrestler.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-base text-clw-white">
                            {wrestler.first_name} {wrestler.last_name}
                          </span>
                          {season && (
                            <Badge
                              variant="outline"
                              className={`whitespace-nowrap ${
                                status
                                  ? ENROLLMENT_STYLES[status]
                                  : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {status ? ENROLLMENT_LABELS[status] : 'not registered'}
                            </Badge>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                <Link
                  href={`/admin/families/${family.ownerId}`}
                  className="inline-flex min-h-11 items-center text-base text-clw-gold hover:text-clw-gold-l"
                >
                  Open {family.ownerName}&apos;s family
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 text-lg font-display text-clw-white">
        Athletes <span className="text-sm text-clw-gray">({athletes.length})</span>
      </h2>

      {athletes.length === 0 ? (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-8 text-center">
          <p className="text-base text-clw-gray">
            {coParentFamilies.length > 0
              ? 'No wrestlers on this account itself. The wrestlers above are on the other parent’s family.'
              : 'This family hasn’t added any athletes yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {athletes.map((athlete) => (
            <Card key={athlete.id} className="border-clw-gold/10 bg-clw-black">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-clw-white">
                    {athlete.first_name} {athlete.last_name}
                  </CardTitle>
                  <p className="mt-1 text-sm text-clw-gray">Born {formatDate(athlete.date_of_birth)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    athlete.active
                      ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                      : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                  }
                >
                  {athlete.active ? 'active' : 'inactive'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-clw-gray/70">Practice group</p>
                    <p className="text-clw-white">{athlete.practice_group ?? 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-clw-gray/70">Division</p>
                    <p className="text-clw-white">
                      {athlete.division === 'girls' ? 'Girls' : athlete.division === 'boys' ? 'Boys' : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-clw-gray/70">Weight class</p>
                    <p className="text-clw-white">{athlete.weight_class ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-clw-gray/70">Shirt size</p>
                    <p className="text-clw-white">{athlete.shirt_size ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-clw-gray/70">USAW card</p>
                    <p className="text-clw-white">{athlete.usa_wrestling_card_number ?? '—'}</p>
                  </div>
                </div>
                {season && (
                  <SeasonSummary
                    season={season}
                    athlete={athlete}
                    enrollment={enrollmentByAthlete.get(athlete.id)}
                    dues={(() => {
                      const id = enrollmentByAthlete.get(athlete.id)?.dues_payment_id
                      return id ? duesById.get(id) : undefined
                    })()}
                    cards={cardsByAthlete.get(athlete.id) ?? []}
                    cardRejection={rejectionByKey.get(`${athlete.id}:usa_wrestling_card`)}
                    missingAgreements={requiredDisclosures.filter((d) => !signedByAthlete.get(athlete.id)?.has(d.id))}
                  />
                )}
                <div className="pt-2">
                  <p className="text-clw-gray/70">Birth certificate</p>
                  <div className="mt-1">
                    <p className="mb-2 text-clw-white">
                      {birthCertificateByAthlete.get(athlete.id)
                        ? birthCertificateByAthlete.get(athlete.id)!.verified
                          ? 'Uploaded and verified'
                          : 'Uploaded, not yet verified'
                        : 'Not uploaded'}
                    </p>
                    {!birthCertificateByAthlete.get(athlete.id) && rejectionByKey.get(`${athlete.id}:birth_certificate`) && (
                      <p className="mb-2 text-base text-amber-300">
                        {rejectionLine(rejectionByKey.get(`${athlete.id}:birth_certificate`)!)}
                      </p>
                    )}
                    <BirthCertificateDocument
                      athleteId={athlete.id}
                      document={birthCertificateByAthlete.get(athlete.id) ?? null}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <BirthCertificateToggle
                    athleteId={athlete.id}
                    onFile={athlete.birth_certificate_on_file}
                    recordedBy={null}
                    recordedAt={athlete.birth_certificate_on_file_at}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <AthleteDialog athlete={athlete} />
                  {viewerIsFullAdmin && <DeleteWrestlerButton athleteId={athlete.id} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Collapsed by default: it's reference, not the reason an admin opens a family. */}
      <details className="group mt-8 rounded-md border border-clw-gold/10 bg-clw-black open:border-clw-gold/30">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3">
            <ChevronDown className="h-4 w-4 shrink-0 text-clw-gold transition-transform duration-200 group-open:rotate-180" />
            <span className="text-lg font-display text-clw-white">
              Message history <span className="text-sm text-clw-gray">({messages.length})</span>
            </span>
          </span>
          {messages[0] && (
            <span className="text-sm text-clw-gray">Last sent {formatDateTime(messages[0].sent_at)}</span>
          )}
        </summary>
        <div className="border-t border-clw-gold/10">
          {messages.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base text-clw-gray">
                No emails or texts have been sent to this family yet.
              </p>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow className="border-clw-gold/10 hover:bg-transparent">
                    <TableHead className="text-clw-gray">Sent</TableHead>
                    <TableHead className="text-clw-gray">To</TableHead>
                    <TableHead className="text-clw-gray">Type</TableHead>
                    <TableHead className="text-clw-gray">Channel</TableHead>
                    <TableHead className="text-clw-gray">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((m) => (
                    <TableRow key={m.id} className="border-clw-gold/10">
                      <TableCell className="text-clw-gray">{formatDateTime(m.sent_at)}</TableCell>
                      <TableCell className="text-clw-white">
                        {(m.recipient_email && contactNameByEmail.get(m.recipient_email.toLowerCase())) ||
                          (m.recipient_id && nameById.get(m.recipient_id)) ||
                          m.recipient_email ||
                          m.recipient_phone ||
                          '—'}
                      </TableCell>
                      <TableCell className="text-clw-white">
                        {m.subject || COMM_TYPE_LABELS[m.comm_type]}
                      </TableCell>
                      <TableCell className="text-clw-gray">{m.channel}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            m.status === 'sent'
                              ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                              : 'border-destructive/40 bg-destructive/10 text-destructive'
                          }
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </details>

      {/* Account actions live at the bottom, away from everyday edits. */}
      <section className="mt-10 border-t border-clw-gold/10 pt-6">
        <h2 className="text-lg font-display text-clw-white">Account</h2>
        <p className="mb-4 mt-1 text-base text-clw-gray">
          Deactivating can be undone. Deleting permanently cannot.
        </p>
        <div className="flex flex-col gap-3 sm:max-w-md">
          <FamilyActiveToggle parentId={parent.id} isActive={parent.is_active} familyId={parent.id} fullWidth />
          {viewerIsFullAdmin && <DeleteFamilyButton parentId={parent.id} fullWidth />}
        </div>
      </section>
    </div>
  )
}

/**
 * One wrestler's current-season registration, at a glance: status, dues,
 * agreements and USA card. Read-only here; approving, requesting an update and
 * verifying the card happen in Registrations (linked).
 */
function SeasonSummary({
  season,
  athlete,
  enrollment,
  dues,
  cards,
  cardRejection,
  missingAgreements,
}: {
  season: SeasonRegistration
  athlete: Athlete
  enrollment: SeasonEnrollment | undefined
  dues: DuesPayment | undefined
  cards: AthleteDocument[]
  cardRejection?: LatestRejection
  missingAgreements: Disclosure[]
}) {
  const name = `${athlete.first_name} ${athlete.last_name}`
  const registrationsHref = `/admin/registrations?q=${encodeURIComponent(name)}`

  if (!enrollment) {
    return (
      <div className="mt-2 space-y-2 rounded-md border border-amber-500/20 bg-clw-black-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-base font-medium text-clw-white">{season.season_label}</p>
          <Badge variant="outline" className="whitespace-nowrap border-amber-500/40 bg-amber-500/10 text-amber-400">
            not registered
          </Badge>
        </div>
        <p className="text-base text-clw-gray">
          The family hasn&apos;t completed this season&apos;s registration, so there&apos;s no waiver, dues or review yet.
        </p>
      </div>
    )
  }

  const card = registrationCard(enrollment.usa_card_document_id, cards, season.registration_open_date)
  const cardClearedByClub = enrollment.status === 'approved' && Boolean(enrollment.card_override_at)
  const cardLine = !season.require_usa_card
    ? 'Not required'
    : card
      ? card.verified
        ? 'Uploaded and verified'
        : 'Uploaded, not yet verified'
      : cardClearedByClub
        ? 'Confirmed by the club without an upload'
        : cardRejection
          ? rejectionLine(cardRejection)
        : athlete.usa_wrestling_card_number?.trim()
          ? `Not uploaded · card #${athlete.usa_wrestling_card_number.trim()} on file`
          : 'Not uploaded'
  const duesLine =
    season.dues_amount_cents === 0
      ? 'No dues required'
      : !dues
        ? 'No dues record'
        : `${formatCents(dues.amount_paid_cents)} of ${formatCents(dues.amount_cents)} · ${dues.status}`

  return (
    <div className="mt-2 space-y-3 rounded-md border border-clw-gold/10 bg-clw-black-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-medium text-clw-white">{season.season_label}</p>
        <Badge variant="outline" className={`whitespace-nowrap ${ENROLLMENT_STYLES[enrollment.status]}`}>
          {ENROLLMENT_LABELS[enrollment.status]}
        </Badge>
      </div>

      <div>
        <p className="text-clw-gray/70">Dues</p>
        <p className="text-base text-clw-white">{duesLine}</p>
      </div>

      <div>
        <p className="text-clw-gray/70">Agreements</p>
        {missingAgreements.length === 0 ? (
          <p className="text-base text-clw-white">Signed</p>
        ) : (
          <p className="text-base text-amber-300">Not signed: {missingAgreements.map((d) => d.title).join(', ')}</p>
        )}
      </div>

      <div>
        <p className="text-clw-gray/70">USA Wrestling card</p>
        <p className="text-base text-clw-white">{cardLine}</p>
        {card && (
          <div className="mt-2">
            <DocumentLinks documentId={card.id} />
          </div>
        )}
      </div>

      {enrollment.admin_note && (
        <p className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-base text-amber-200">
          Club note: {enrollment.admin_note}
        </p>
      )}

      <Link
        href={registrationsHref}
        className="inline-flex min-h-11 items-center text-base text-clw-gold hover:text-clw-gold-l"
      >
        Review in Registrations
      </Link>
    </div>
  )
}
