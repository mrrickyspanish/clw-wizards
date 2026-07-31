'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Pencil } from 'lucide-react'

import type { ClubEvent, SeasonRegistration } from '@/types/database'
import { ORG } from '@/config/org.config'
import { createEvent, updateEvent, type EventInput } from './eventActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
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
  { value: 'season_registration', label: 'Season Registration' },
  { value: 'other', label: 'Other' },
]

const GROUP_ALL = 'all'

export function EventDialog({ event, season }: { event?: ClubEvent; season?: SeasonRegistration }) {
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

  const [seasonLabel, setSeasonLabel] = useState(season?.season_label ?? '')
  const [registrationOpen, setRegistrationOpen] = useState(season?.registration_open_date ?? '')
  const [registrationClose, setRegistrationClose] = useState(season?.registration_close_date ?? '')
  const [duesAmount, setDuesAmount] = useState(
    season ? (season.dues_amount_cents / 100).toFixed(2) : ''
  )
  const [duesDueDate, setDuesDueDate] = useState(season?.dues_due_date ?? '')
  const [instructions, setInstructions] = useState(season?.instructions ?? '')
  const [requireUsaCard, setRequireUsaCard] = useState(season?.require_usa_card ?? true)
  const [earlyBirdPrice, setEarlyBirdPrice] = useState(
    season?.early_bird_price_cents != null ? (season.early_bird_price_cents / 100).toFixed(2) : ''
  )
  const [earlyBirdDeadline, setEarlyBirdDeadline] = useState(season?.early_bird_deadline ?? '')

  const isSeason = type === 'season_registration'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const amount = Number(duesAmount || 0)
    if (isSeason && (!Number.isFinite(amount) || amount < 0)) {
      setLoading(false)
      setError('Enter a valid dues amount.')
      return
    }

    const hasEarlyBirdPrice = earlyBirdPrice.trim() !== ''
    const earlyBirdAmount = hasEarlyBirdPrice ? Number(earlyBirdPrice) : null
    if (isSeason && hasEarlyBirdPrice !== Boolean(earlyBirdDeadline)) {
      setLoading(false)
      setError('Set both an early registration price and a deadline, or leave both blank.')
      return
    }
    if (isSeason && hasEarlyBirdPrice) {
      if (!Number.isFinite(earlyBirdAmount) || (earlyBirdAmount as number) < 0) {
        setLoading(false)
        setError('Enter a valid early registration price.')
        return
      }
      if ((earlyBirdAmount as number) >= amount) {
        setLoading(false)
        setError('The early registration price must be less than the regular dues amount.')
        return
      }
      if (earlyBirdDeadline < registrationOpen || earlyBirdDeadline > registrationClose) {
        setLoading(false)
        setError('The early registration deadline must fall within the registration window.')
        return
      }
    }

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
      season_label: isSeason ? seasonLabel : null,
      registration_open_date: isSeason ? registrationOpen : null,
      registration_close_date: isSeason ? registrationClose : null,
      dues_amount_cents: isSeason ? Math.round(amount * 100) : null,
      dues_due_date: isSeason ? duesDueDate : null,
      instructions: isSeason ? instructions : null,
      require_usa_card: isSeason ? requireUsaCard : false,
      early_bird_price_cents: isSeason && hasEarlyBirdPrice ? Math.round((earlyBirdAmount as number) * 100) : null,
      early_bird_deadline: isSeason && hasEarlyBirdPrice ? earlyBirdDeadline : null,
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">{editing ? 'Edit event' : 'Add event'}</DialogTitle>
          <DialogDescription>
            Create a one-off club date or open annual season registration from the same place.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="event_title">Title</Label>
            <Input id="event_title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as ClubEvent['event_type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((eventType) => (
                  <SelectItem key={eventType.value} value={eventType.value}>
                    {eventType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSeason && (
            <div className="rounded-md border border-clw-gold/20 bg-clw-gold/5 p-4 text-sm text-clw-gray">
              Parents will see this on their dashboard. They can register returning wrestlers, upload a current USA Wrestling card, pay dues, and follow approval status.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="event_date">{isSeason ? 'Season start date' : 'Date'}</Label>
            <Input id="event_date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {!isSeason && (
            <>
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
                <Label>Group</Label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GROUP_ALL}>All groups (club-wide)</SelectItem>
                    {ORG.practiceGroups.map((practiceGroup) => (
                      <SelectItem key={practiceGroup} value={practiceGroup}>
                        {practiceGroup}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="event_location">Location</Label>
            <Input id="event_location" maxLength={240} value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_notes">Public event summary</Label>
            <Textarea
              id="event_notes"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isSeason ? 'A short summary shown with the season event.' : undefined}
            />
          </div>

          {isSeason && (
            <section className="space-y-4 border-t border-clw-gold/15 pt-5">
              <div>
                <h3 className="font-medium text-clw-white">Registration setup</h3>
                <p className="text-sm text-clw-gray">These details control the parent registration experience.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season_label">Season name</Label>
                <Input
                  id="season_label"
                  required
                  maxLength={40}
                  value={seasonLabel}
                  onChange={(e) => setSeasonLabel(e.target.value)}
                  placeholder="2026-2027"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="registration_open">Registration opens</Label>
                  <Input
                    id="registration_open"
                    type="date"
                    required
                    value={registrationOpen}
                    onChange={(e) => setRegistrationOpen(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_close">Registration closes</Label>
                  <Input
                    id="registration_close"
                    type="date"
                    required
                    value={registrationClose}
                    onChange={(e) => setRegistrationClose(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dues_amount">Season dues per wrestler</Label>
                  <Input
                    id="dues_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={duesAmount}
                    onChange={(e) => setDuesAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dues_due_date">Dues due date</Label>
                  <Input
                    id="dues_due_date"
                    type="date"
                    value={duesDueDate}
                    onChange={(e) => setDuesDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-clw-gold/15 bg-clw-black-2 p-4">
                <div>
                  <p className="text-sm font-medium text-clw-white">Early registration discount (optional)</p>
                  <p className="mt-1 text-sm text-clw-gray">
                    Leave both blank to charge the full amount the whole window. If set, a wrestler registered on or
                    before the deadline pays the discount price; after it, the regular dues amount applies.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="early_bird_price">Discount price</Label>
                    <Input
                      id="early_bird_price"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={earlyBirdPrice}
                      onChange={(e) => setEarlyBirdPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="early_bird_deadline">Discount ends</Label>
                    <Input
                      id="early_bird_deadline"
                      type="date"
                      min={registrationOpen || undefined}
                      max={registrationClose || undefined}
                      value={earlyBirdDeadline}
                      onChange={(e) => setEarlyBirdDeadline(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_instructions">Parent instructions</Label>
                <Textarea
                  id="registration_instructions"
                  rows={4}
                  maxLength={3000}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Review wrestler information, upload a current USA Wrestling card, pay dues, and submit for club approval."
                />
              </div>

              <label className="flex items-start gap-3 rounded-md border border-clw-gold/15 bg-clw-black-2 p-4 text-sm text-clw-white">
                <Checkbox
                  className="mt-0.5"
                  checked={requireUsaCard}
                  onCheckedChange={(checked) => setRequireUsaCard(checked === true)}
                />
                <span>
                  <span className="block font-medium">Require a current USA Wrestling card</span>
                  <span className="mt-1 block text-clw-gray">The parent may submit while the upload is pending review, but an admin must verify it before approval.</span>
                </span>
              </label>
            </section>
          )}

          <label className="flex items-center gap-2 text-sm text-clw-white">
            <Checkbox checked={active} onCheckedChange={(checked) => setActive(checked === true)} />
            {isSeason ? 'Published in the parent portal' : 'Active'}
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
