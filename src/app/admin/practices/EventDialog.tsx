'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Pencil, Plus, Trash2 } from 'lucide-react'

import type { ClubEvent, SeasonPriceTier, SeasonRegistration } from '@/types/database'
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

// One editable row of the season's price ladder. Amounts stay strings while
// being typed so a half-entered "3." doesn't get rounded out from under the
// admin; they become cents only on submit.
type TierDraft = {
  key: string
  label: string
  starts_on: string
  ends_on: string
  amount: string
}

function toDraft(tier: SeasonPriceTier): TierDraft {
  return {
    key: tier.id,
    label: tier.label,
    starts_on: tier.starts_on,
    ends_on: tier.ends_on,
    amount: (tier.amount_cents / 100).toFixed(2),
  }
}

export function EventDialog({
  event,
  season,
  priceTiers = [],
}: {
  event?: ClubEvent
  season?: SeasonRegistration
  priceTiers?: SeasonPriceTier[]
}) {
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
  const [tiers, setTiers] = useState<TierDraft[]>(() =>
    [...priceTiers].sort((a, b) => a.starts_on.localeCompare(b.starts_on)).map(toDraft)
  )

  const isSeason = type === 'season_registration'

  function updateTier(key: string, patch: Partial<TierDraft>) {
    setTiers((current) => current.map((tier) => (tier.key === key ? { ...tier, ...patch } : tier)))
  }

  function addTier() {
    setTiers((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        label: '',
        // Pick up where the last step left off so a ladder can be built by
        // filling in end dates rather than re-entering every boundary.
        starts_on: current.at(-1)?.ends_on ?? registrationOpen,
        ends_on: '',
        amount: '',
      },
    ])
  }

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

    if (isSeason && tiers.some((tier) => !tier.label.trim() || !tier.starts_on || !tier.ends_on)) {
      setLoading(false)
      setError('Give every price step a name, a start date, and an end date.')
      return
    }
    if (isSeason && tiers.some((tier) => !Number.isFinite(Number(tier.amount)) || Number(tier.amount) < 0)) {
      setLoading(false)
      setError('Enter a valid price for every step.')
      return
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
      price_tiers: isSeason
        ? tiers.map((tier) => ({
            label: tier.label.trim(),
            starts_on: tier.starts_on,
            ends_on: tier.ends_on,
            amount_cents: Math.round(Number(tier.amount || 0) * 100),
          }))
        : [],
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
                  <p className="text-base font-medium text-clw-white">Price steps (optional)</p>
                  <p className="mt-1 text-sm text-clw-gray">
                    Add a step for each price window, like the registration flier&apos;s ladder. A wrestler pays the
                    step their submission date falls in, and that price is locked in even if they pay later. Leave this
                    empty to charge the season dues amount for the whole window. Steps cannot overlap.
                  </p>
                </div>

                {tiers.map((tier) => (
                  <div key={tier.key} className="space-y-3 rounded-md border border-clw-gold/10 bg-clw-black p-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`tier_label_${tier.key}`}>Step name</Label>
                        <Input
                          id={`tier_label_${tier.key}`}
                          maxLength={60}
                          value={tier.label}
                          onChange={(e) => updateTier(tier.key, { label: e.target.value })}
                          placeholder="Early registration"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-clw-gray hover:text-red-400"
                        onClick={() => setTiers((current) => current.filter((row) => row.key !== tier.key))}
                        aria-label={`Remove ${tier.label || 'price step'}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor={`tier_starts_${tier.key}`}>Starts</Label>
                        <Input
                          id={`tier_starts_${tier.key}`}
                          type="date"
                          min={registrationOpen || undefined}
                          max={registrationClose || undefined}
                          value={tier.starts_on}
                          onChange={(e) => updateTier(tier.key, { starts_on: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`tier_ends_${tier.key}`}>Ends</Label>
                        <Input
                          id={`tier_ends_${tier.key}`}
                          type="date"
                          min={tier.starts_on || registrationOpen || undefined}
                          max={registrationClose || undefined}
                          value={tier.ends_on}
                          onChange={(e) => updateTier(tier.key, { ends_on: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`tier_amount_${tier.key}`}>Price</Label>
                        <Input
                          id={`tier_amount_${tier.key}`}
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={tier.amount}
                          onChange={(e) => updateTier(tier.key, { amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={addTier}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add price step
                </Button>
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
