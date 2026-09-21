import { createAdminSupabase } from '@/lib/supabase/admin'
import type { CommType, CommunicationLogRow } from '@/types/database'
import { COMM_TYPE_LABELS } from '@/lib/comms/labels'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// How many rows of raw log history to pull. A club this size sends at most a
// few hundred rows a month, so this comfortably covers recent activity
// without needing pagination yet.
const HISTORY_ROW_LIMIT = 500

type Group = {
  key: string
  inferred: boolean
  subject: string | null
  commType: CommType
  channels: Set<'email' | 'sms'>
  sentAt: string
  sent: number
  failed: number
  bounced: number
  rows: CommunicationLogRow[]
}

function statusCounts(rows: CommunicationLogRow[]) {
  return rows.reduce(
    (acc, r) => {
      acc[r.status] += 1
      return acc
    },
    { sent: 0, failed: 0, bounced: 0 }
  )
}

/**
 * Groups log rows into sends. Rows with a blast_id (everything sent after
 * this feature shipped) group exactly, by that id. Older rows have no
 * blast_id — those are grouped by (comm_type, subject, sent within the same
 * minute) as a best-effort reconstruction, marked "inferred" in the UI so
 * nobody mistakes the guess for ground truth.
 */
function groupRows(rows: CommunicationLogRow[]): Group[] {
  const groups = new Map<string, Group>()

  for (const row of rows) {
    const key = row.blast_id ?? `legacy:${row.comm_type}:${row.subject ?? ''}:${row.sent_at.slice(0, 16)}`
    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        inferred: !row.blast_id,
        subject: row.subject,
        commType: row.comm_type,
        channels: new Set(),
        sentAt: row.sent_at,
        sent: 0,
        failed: 0,
        bounced: 0,
        rows: [],
      }
      groups.set(key, group)
    }
    group.channels.add(row.channel)
    group.rows.push(row)
    // Group's sentAt is the earliest row in it -- when the send started.
    if (row.sent_at < group.sentAt) group.sentAt = row.sent_at
  }

  for (const group of groups.values()) {
    const counts = statusCounts(group.rows)
    group.sent = counts.sent
    group.failed = counts.failed
    group.bounced = counts.bounced
  }

  return [...groups.values()].sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export async function CommsHistory() {
  const supabase = createAdminSupabase()
  const { data } = await supabase
    .from('communication_log')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(HISTORY_ROW_LIMIT)

  const rows = (data ?? []) as CommunicationLogRow[]
  const groups = groupRows(rows)

  const recipientIds = [...new Set(rows.map((r) => r.recipient_id).filter((id): id is string => Boolean(id)))]
  const nameById = new Map<string, string>()
  if (recipientIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', recipientIds)
    for (const p of profiles ?? []) {
      nameById.set(p.id, p.full_name || p.email || 'Unnamed parent')
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-md border border-clw-gold/10 bg-clw-black p-8 text-center">
        <p className="text-base text-clw-gray">Nothing sent yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const total = group.rows.length
        const failedTotal = group.failed + group.bounced
        return (
          <details
            key={group.key}
            className="group rounded-md border border-clw-gold/10 bg-clw-black open:border-clw-gold/30"
          >
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-medium text-clw-white">
                    {group.subject || COMM_TYPE_LABELS[group.commType]}
                  </span>
                  {group.inferred && (
                    <Badge variant="outline" className="border-clw-gray/40 text-clw-gray">
                      inferred grouping
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-clw-gray">
                  {COMM_TYPE_LABELS[group.commType]} · {[...group.channels].join(' + ')} ·{' '}
                  {formatDateTime(group.sentAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge className="border-transparent bg-clw-gold/10 text-clw-gold">
                  {group.sent} sent
                </Badge>
                {failedTotal > 0 && (
                  <Badge variant="destructive">{failedTotal} failed</Badge>
                )}
                <span className="text-sm text-clw-gray">{total} total</span>
              </div>
            </summary>

            <div className="max-h-72 overflow-y-auto border-t border-clw-gold/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-clw-gold/10 hover:bg-transparent">
                    <TableHead className="text-clw-gray">Recipient</TableHead>
                    <TableHead className="text-clw-gray">Channel</TableHead>
                    <TableHead className="text-clw-gray">Status</TableHead>
                    <TableHead className="text-clw-gray">Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.rows.map((row) => (
                    <TableRow key={row.id} className="border-clw-gold/5">
                      <TableCell className="text-clw-white">
                        {(row.recipient_id && nameById.get(row.recipient_id)) ||
                          row.recipient_email ||
                          row.recipient_phone ||
                          'Unknown'}
                      </TableCell>
                      <TableCell className="text-clw-gray">{row.channel}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.status === 'sent'
                              ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                              : 'border-destructive/40 bg-destructive/10 text-destructive'
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-clw-gray">{formatDateTime(row.sent_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </details>
        )
      })}
    </div>
  )
}
