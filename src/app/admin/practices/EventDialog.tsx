'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Pencil } from 'lucide-react'

import type { ClubEvent } from '@/types/database'
import { ORG } from '@/config/org.config'
import { createEvent, updateEvent, type EventInput } from './eventActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EVENT_TYPES: { value: ClubEvent['event_type']; label: string }[] = [
  { value: 'event', label: 'Event' },
  { value: 'banquet', label: 'Banquet' },
  { value: 'parent_night', label: 'Parent Night' },
  { value: 'fundraiser', label: 'Fundraiser' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
]

const GROUP_ALL = 'all'

export function EventDialog({ event }: { event?: ClubEvent }) {
  const router = useRouter()
  const editing = Boolean(event)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(event?.title ?? '')
  const [type, setType] = useState<ClubEvent['event_type']>(event?.event_type ?? 'event')
  const [date, setDate] = useState(event?.date ?? '')
  const [startTime, setStartTime] = useState(event?.start_time ?? '')
  const [endTime, setEndTime] = useState(event?.end_time ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [group, setGroup] = useState(event?.practice_group ?? GROUP_ALL)
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [active, setActive] = useState(event?.active ?? true)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const values: EventInput = {
      title,
      event_type: type,
      date,
      start_time: startTime,
      end_time: endTime,
      location,
      practice_group: group === GROUP_ALL ? null : group,
      notes,
      active,
    }
    const result = editing ? await updateEvent(event!.id, values) : await createEvent(values)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="sm" className="text-clw-gray hover:text-clw-gold">
            <Pencil className="mr-1.5 h-4 w-4" /> Edit
          </Button>
        ) : (
          <Button variant="outline">
            <CalendarPlus className="mr-1.5 h-4 w-4" /> Add event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">{editing ? 'Edit event' : 'Add event'}</DialogTitle>
          <DialogDescription>A one-off dated event — banquet, parent night, fundraiser, and the like.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="event_title">Title</Label>
            <Input id="event_title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ClubEvent['event_type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">Date</Label>
            <Input id="event_date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_start">Start time</Label>
              <Input id="event_start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_end">End time</Label>
              <Input id="event_end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_location">Location</Label>
            <Input id="event_location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Group</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GROUP_ALL}>All groups (club-wide)</SelectItem>
                {ORG.practiceGroups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_notes">Notes</Label>
            <Input id="event_notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-clw-white">
            <Checkbox checked={active} onCheckedChange={(checked) => setActive(checked === true)} />
            Active
          </label>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : editing ? 'Save changes' : 'Add event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
