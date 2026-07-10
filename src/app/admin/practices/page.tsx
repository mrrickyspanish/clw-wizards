import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Practice, ClubEvent, PracticeCancellation } from '@/types/database'
import { WEEKDAYS, formatTime } from '@/lib/practice'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PracticeDialog } from './PracticeDialog'
import { DeletePracticeButton } from './DeletePracticeButton'
import { CancelDateDialog } from './CancelDateDialog'
import { EventDialog } from './EventDialog'
import { DeleteEventButton } from './DeleteEventButton'

const EVENT_TYPE_LABELS: Record<ClubEvent['event_type'], string> = {
  event: 'Event',
  banquet: 'Banquet',
  parent_night: 'Parent Night',
  fundraiser: 'Fundraiser',
  meeting: 'Meeting',
  other: 'Other',
}

function formatEventDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminPracticesPage() {
  const supabase = createAdminSupabase()
  const [{ data: practices, error }, { data: cancellations }, { data: events, error: eventsError }] = await Promise.all([
    supabase.from('practices').select('*').order('weekday', { ascending: true }).order('start_time', { ascending: true }),
    supabase.from('practice_cancellations').select('*').order('date', { ascending: true }),
    supabase.from('club_events').select('*').order('date', { ascending: true }),
  ])

  const rows = (practices ?? []) as Practice[]
  const eventRows = (events ?? []) as ClubEvent[]

  const cancelsByPractice = new Map<string, PracticeCancellation[]>()
  for (const c of (cancellations ?? []) as PracticeCancellation[]) {
    const list = cancelsByPractice.get(c.practice_id) ?? []
    list.push(c)
    cancelsByPractice.set(c.practice_id, list)
  }

  return (
    <div className="space-y-10">
      {/* Recurring practices */}
      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display text-clw-gold">Practices &amp; Events</h1>
            <p className="text-sm text-clw-gray">The recurring weekly schedule and one-off club events parents see.</p>
          </div>
          <PracticeDialog />
        </div>

        {error && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
            Failed to load practices: {error.message}
          </p>
        )}

        {!error && rows.length === 0 && (
          <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
            <p className="text-clw-gray">No practices yet. Add the weekly schedule to get started.</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="rounded-md border border-clw-gold/10 bg-clw-black">
            <Table>
              <TableHeader>
                <TableRow className="border-clw-gold/10 hover:bg-transparent">
                  <TableHead className="text-clw-gray">Day</TableHead>
                  <TableHead className="text-clw-gray">Time</TableHead>
                  <TableHead className="text-clw-gray">Group</TableHead>
                  <TableHead className="text-clw-gray">Location</TableHead>
                  <TableHead className="text-clw-gray">Status</TableHead>
                  <TableHead className="w-[240px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const label = `${WEEKDAYS[p.weekday]} ${formatTime(p.start_time)}`
                  return (
                    <TableRow key={p.id} className="border-clw-gold/10">
                      <TableCell className="font-medium text-clw-white">{WEEKDAYS[p.weekday]}</TableCell>
                      <TableCell className="text-clw-gray">
                        {formatTime(p.start_time)}
                        {p.end_time ? ` - ${formatTime(p.end_time)}` : ''}
                      </TableCell>
                      <TableCell className="text-clw-gray">{p.practice_group}</TableCell>
                      <TableCell className="text-clw-gray">{p.location}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.active
                              ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                              : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                          }
                        >
                          {p.active ? 'active' : 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <CancelDateDialog
                            practiceId={p.id}
                            label={label}
                            cancellations={cancelsByPractice.get(p.id) ?? []}
                          />
                          <PracticeDialog practice={p} />
                          <DeletePracticeButton id={p.id} label={label} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* One-off events */}
      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display text-clw-gold">Events</h2>
            <p className="text-sm text-clw-gray">Banquets, parent nights, fundraisers, and other one-off dates.</p>
          </div>
          <EventDialog />
        </div>

        {eventsError && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
            Failed to load events: {eventsError.message}
          </p>
        )}

        {!eventsError && eventRows.length === 0 && (
          <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
            <p className="text-clw-gray">No events yet. Add a banquet, parent night, or fundraiser.</p>
          </div>
        )}

        {eventRows.length > 0 && (
          <div className="rounded-md border border-clw-gold/10 bg-clw-black">
            <Table>
              <TableHeader>
                <TableRow className="border-clw-gold/10 hover:bg-transparent">
                  <TableHead className="text-clw-gray">Event</TableHead>
                  <TableHead className="text-clw-gray">Type</TableHead>
                  <TableHead className="text-clw-gray">Date</TableHead>
                  <TableHead className="text-clw-gray">Group</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventRows.map((ev) => (
                  <TableRow key={ev.id} className="border-clw-gold/10">
                    <TableCell className="font-medium text-clw-white">
                      {ev.title}
                      {!ev.active && <span className="ml-2 text-xs text-clw-gray">(inactive)</span>}
                    </TableCell>
                    <TableCell className="text-clw-gray">{EVENT_TYPE_LABELS[ev.event_type]}</TableCell>
                    <TableCell className="text-clw-gray">
                      {formatEventDate(ev.date)}
                      {ev.start_time ? ` · ${formatTime(ev.start_time)}` : ''}
                    </TableCell>
                    <TableCell className="text-clw-gray">{ev.practice_group ?? 'All'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EventDialog event={ev} />
                        <DeleteEventButton id={ev.id} label={ev.title} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
