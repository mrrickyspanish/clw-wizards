import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { createServerSupabase } from '@/lib/supabase/server'
import { isFullAdmin } from '@/lib/auth/admin'
import type { Athlete, CommunicationLogRow, Profile } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AthleteDialog } from '../AthleteDialog'
import { DeleteFamilyButton } from '../DeleteFamilyButton'
import { FamilyActiveToggle } from '../FamilyActiveToggle'
import { ParentDialog } from '../ParentDialog'
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

type GuardianRow = Pick<
  Profile,
  'id' | 'full_name' | 'email' | 'phone' | 'practice_group' | 'sms_opt_in' | 'is_active'
>

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

  // Co-guardians who have joined this family via an invite code.
  const { data: guardianLinks } = await supabase.from('family_guardians').select('guardian_id').eq('owner_id', id)
  const guardianIds = (guardianLinks ?? []).map((g) => g.guardian_id)
  let guardians: GuardianRow[] = []
  if (guardianIds.length) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, practice_group, sms_opt_in, is_active')
      .in('id', guardianIds)
      .order('full_name', { ascending: true })
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
        className="mb-4 inline-flex items-center gap-1 text-sm text-clw-gray hover:text-clw-gold"
      >
        <ArrowLeft className="h-4 w-4" /> Back to families
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">{parent.full_name ?? 'Unnamed parent'}</h1>
          <p className="text-sm text-clw-gray">{parent.email ?? '—'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FamilyActiveToggle parentId={parent.id} isActive={parent.is_active} familyId={parent.id} />
          {viewerIsFullAdmin && <DeleteFamilyButton parentId={parent.id} />}
        </div>
      </div>

      <Card className="mb-6 border-clw-gold/10 bg-clw-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-clw-gray">Primary parent contact &amp; preferences</CardTitle>
          <ParentDialog parent={parent} familyId={parent.id} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-clw-gray/70">Phone</p>
            <p className="text-clw-white">{parent.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-clw-gray/70">Practice group</p>
            <p className="text-clw-white">{parent.practice_group ?? '—'}</p>
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

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-clw-gold/10 pt-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-clw-gray/70">Phone</p>
                    <p className="text-clw-white">{guardian.phone ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-clw-gray/70">Practice group</p>
                    <p className="text-clw-white">{guardian.practice_group ?? '—'}</p>
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

      <h2 className="mb-3 text-lg font-display text-clw-white">
        Athletes <span className="text-sm text-clw-gray">({athletes.length})</span>
      </h2>

      {athletes.length === 0 ? (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-8 text-center">
          <p className="text-clw-gray">This family hasn’t added any athletes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {athletes.map((athlete) => (
            <Card key={athlete.id} className="border-clw-gold/10 bg-clw-black">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-clw-white">
                    {athlete.first_name} {athlete.last_name}
                  </CardTitle>
                  <p className="mt-1 text-xs text-clw-gray">Born {formatDate(athlete.date_of_birth)}</p>
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
                <div className="pt-2">
                  <AthleteDialog athlete={athlete} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-display text-clw-white">
        Message history <span className="text-sm text-clw-gray">({messages.length})</span>
      </h2>

      {messages.length === 0 ? (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-8 text-center">
          <p className="text-base text-clw-gray">
            No emails or texts have been sent to this family yet.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black">
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
                    {(m.recipient_id && nameById.get(m.recipient_id)) || m.recipient_email || m.recipient_phone || '—'}
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
  )
}
