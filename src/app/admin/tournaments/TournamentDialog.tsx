'use client'

import { flierKind } from '@/lib/flier'
import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Upload, X } from 'lucide-react'

import type { Tournament, TournamentAdminDetails, TournamentSession } from '@/types/database'
import { ORG } from '@/config/org.config'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { MAX_TOURNAMENT_SESSIONS, isSessionTime, normalizeSessions } from '@/lib/tournament-sessions'
import { createTournament, updateTournament, type TournamentInput } from './actions'
import { centsToDollarInput, toSessionTime } from './tournament-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PLATFORM_NONE = 'none'

// Strip anything that would confuse a storage path; keep it recognizable.
function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
}

type SessionRow = { key: number; start_time: string; divisions: string }

export function TournamentDialog({
  tournament,
  sessions,
  adminDetails,
}: {
  tournament?: Tournament
  // This tournament's sessions (B2). None yet: Session 1 starts from start_time.
  sessions?: Pick<TournamentSession, 'start_time' | 'divisions' | 'sort_order'>[]
  // Admin-only club link and spots (B5, B6), from tournament_admin_details.
  adminDetails?: Pick<TournamentAdminDetails, 'club_registrations_url' | 'spots_allotted'> | null
}) {
  const router = useRouter()
  // A new tournament whose sessions or admin details failed to save is saved
  // again as an edit, so a retry never creates a second tournament.
  const [savedId, setSavedId] = useState<string | null>(null)
  const editId = tournament?.id ?? savedId
  const isEdit = Boolean(tournament)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const keyRef = useRef(0)
  const sessionRows = (): SessionRow[] => {
    const saved = [...(sessions ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    if (saved.length) return saved.map((s) => ({ key: ++keyRef.current, start_time: s.start_time, divisions: s.divisions ?? '' }))
    return [{ key: ++keyRef.current, start_time: toSessionTime(tournament?.start_time), divisions: '' }]
  }

  const [name, setName] = useState(tournament?.name ?? '')
  const [date, setDate] = useState(tournament?.date ?? '')
  const [location, setLocation] = useState(tournament?.location ?? '')
  const [city, setCity] = useState(tournament?.city ?? '')
  const [state, setState] = useState(tournament?.state ?? 'IL')
  const [status, setStatus] = useState<Tournament['status']>(tournament?.status ?? 'open')
  const [sessionList, setSessionList] = useState<SessionRow[]>(sessionRows)
  const [streetAddress, setStreetAddress] = useState(tournament?.street_address ?? '')
  const [entryFee, setEntryFee] = useState(centsToDollarInput(tournament?.entry_fee_cents))
  const [clubLink, setClubLink] = useState(adminDetails?.club_registrations_url ?? '')
  const [spots, setSpots] = useState(adminDetails?.spots_allotted ? String(adminDetails.spots_allotted) : '')
  const [weighInDate, setWeighInDate] = useState(tournament?.weigh_in_date ?? '')
  const [weighInTime, setWeighInTime] = useState(tournament?.weigh_in_time ?? '')
  const [weighInLocation, setWeighInLocation] = useState(tournament?.weigh_in_location ?? '')
  const [platform, setPlatform] = useState<string>(tournament?.external_platform ?? PLATFORM_NONE)
  const [regUrl, setRegUrl] = useState(tournament?.external_registration_url ?? '')
  const [groups, setGroups] = useState<string[]>(tournament?.practice_groups ?? [])
  const [competitionLevel, setCompetitionLevel] = useState(tournament?.competition_level ?? '')
  const [imageUrl, setImageUrl] = useState(tournament?.image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [notes, setNotes] = useState(tournament?.notes ?? '')

  async function handleFlyerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (file.size > 10 * 1024 * 1024) {
      setError('Flyer must be under 10MB.')
      return
    }
    setUploading(true)
    const supabase = createBrowserSupabase()
    const path = `flyers/${Date.now()}-${safeName(file.name)}`
    const { error: upErr } = await supabase.storage.from('tournament-flyers').upload(path, file, { upsert: false })
    if (upErr) {
      setUploading(false)
      setError(upErr.message)
      return
    }
    const { data } = supabase.storage.from('tournament-flyers').getPublicUrl(path)
    setImageUrl(data.publicUrl)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function toggleGroup(group: string, checked: boolean) {
    setGroups((prev) => (checked ? [...prev, group] : prev.filter((g) => g !== group)))
  }

  function updateSession(key: number, field: 'start_time' | 'divisions', value: string) {
    setSessionList((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)))
  }

  function addSession() {
    setSessionList((prev) =>
      prev.length >= MAX_TOURNAMENT_SESSIONS ? prev : [...prev, { key: ++keyRef.current, start_time: '', divisions: '' }]
    )
  }

  function removeSession(key: number) {
    setSessionList((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev))
  }

  // Reset fields to the source values each time the dialog opens, so a create
  // form doesn't retain the previous entry and an edit form reflects the latest
  // saved values.
  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setSessionError(null)
      setSavedId(null)
      setName(tournament?.name ?? '')
      setDate(tournament?.date ?? '')
      setLocation(tournament?.location ?? '')
      setCity(tournament?.city ?? '')
      setState(tournament?.state ?? 'IL')
      setStatus(tournament?.status ?? 'open')
      setSessionList(sessionRows())
      setStreetAddress(tournament?.street_address ?? '')
      setEntryFee(centsToDollarInput(tournament?.entry_fee_cents))
      setClubLink(adminDetails?.club_registrations_url ?? '')
      setSpots(adminDetails?.spots_allotted ? String(adminDetails.spots_allotted) : '')
      setWeighInDate(tournament?.weigh_in_date ?? '')
      setWeighInTime(tournament?.weigh_in_time ?? '')
      setWeighInLocation(tournament?.weigh_in_location ?? '')
      setPlatform(tournament?.external_platform ?? PLATFORM_NONE)
      setRegUrl(tournament?.external_registration_url ?? '')
      setGroups(tournament?.practice_groups ?? [])
      setCompetitionLevel(tournament?.competition_level ?? '')
      setImageUrl(tournament?.image_url ?? '')
      setNotes(tournament?.notes ?? '')
    }
    setOpen(next)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSessionError(null)

    const drafts = sessionList.map((s) => ({ start_time: s.start_time, divisions: s.divisions }))
    // Name the session by the number shown on screen (normalizeSessions counts
    // after dropping blank rows, so its number can differ).
    const missing = drafts.findIndex((d) => (d.start_time.trim() || d.divisions.trim()) && !isSessionTime(d.start_time.trim()))
    const checked = normalizeSessions(drafts)
    if (missing >= 0 || !checked.ok) {
      setSessionError(missing >= 0 ? `Session ${missing + 1} needs a start time.` : checked.ok ? null : checked.error)
      return
    }
    setLoading(true)

    const values: TournamentInput = {
      name,
      date,
      location,
      city,
      state,
      status,
      sessions: drafts,
      street_address: streetAddress,
      weigh_in_date: weighInDate,
      weigh_in_time: weighInTime,
      weigh_in_location: weighInLocation,
      external_platform: platform === PLATFORM_NONE ? null : (platform as TournamentInput['external_platform']),
      external_registration_url: regUrl,
      practice_groups: groups,
      competition_level: competitionLevel,
      image_url: imageUrl,
      notes,
      entry_fee: entryFee,
      club_registrations_url: clubLink,
      spots_allotted: spots,
    }

    const result = editId ? await updateTournament(editId, values) : await createTournament(values)

    setLoading(false)

    if (!result.ok) {
      if (result.id) setSavedId(result.id)
      setError(result.error)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="text-clw-gray hover:text-clw-gold">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit {tournament!.name}</span>
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New tournament
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">{isEdit ? 'Edit tournament' : 'New tournament'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the tournament details below.' : 'Add a tournament to the club schedule.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium leading-none">Sessions</legend>
            <p className="text-base text-clw-gray">
              One session is the usual. Add more when divisions start at different times.
            </p>
            {sessionList.map((s, i) => (
              <div key={s.key} className="space-y-3 rounded-xl border border-clw-gold/15 p-3">
                <div className="flex min-h-11 items-center justify-between gap-2">
                  <span className="text-base font-medium text-clw-white">Session {i + 1}</span>
                  {i > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-clw-gray hover:text-red-400"
                      onClick={() => removeSession(s.key)}
                    >
                      <X className="h-4 w-4" /> Remove<span className="sr-only"> session {i + 1}</span>
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor={`session-${s.key}-time`}>Time</Label>
                    <Input
                      id={`session-${s.key}-time`}
                      type="time"
                      value={s.start_time}
                      onChange={(e) => updateSession(s.key, 'start_time', e.target.value)}
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor={`session-${s.key}-divisions`}>Divisions</Label>
                    <Input
                      id={`session-${s.key}-divisions`}
                      placeholder="e.g. Tots, Bantam, Intermediate"
                      maxLength={120}
                      value={s.divisions}
                      onChange={(e) => updateSession(s.key, 'divisions', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {sessionList.length < MAX_TOURNAMENT_SESSIONS && (
              <Button type="button" variant="outline" size="sm" onClick={addSession}>
                <Plus className="h-4 w-4" /> Add a session
              </Button>
            )}
            {sessionError && (
              <p role="alert" className="text-base text-red-400">
                {sessionError}
              </p>
            )}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="location">Location / venue</Label>
            <Input id="location" required value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="street_address">Street address</Label>
            <Input
              id="street_address"
              placeholder="Optional, e.g. 100 Main St"
              maxLength={200}
              autoComplete="off"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
            />
            <p className="text-base text-clw-gray">Optional. Families tap the venue to get directions to this address.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" required maxLength={2} value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="weigh_in_date">Weigh-in date</Label>
              <Input
                id="weigh_in_date"
                type="date"
                value={weighInDate}
                onChange={(e) => setWeighInDate(e.target.value)}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="weigh_in_time">Weigh-in time</Label>
              <Input
                id="weigh_in_time"
                type="time"
                value={weighInTime}
                onChange={(e) => setWeighInTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weigh_in_location">Weigh-in location</Label>
            <Input
              id="weigh_in_location"
              placeholder="Leave blank to use the tournament venue"
              value={weighInLocation}
              onChange={(e) => setWeighInLocation(e.target.value)}
            />
            <p className="text-sm text-clw-gray">
              Sometimes the club facility, sometimes the event site. Shows as a linked weigh-in on parents&apos; calendars.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Tournament['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="not_open">Not open yet</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Registration platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PLATFORM_NONE}>None / in-house</SelectItem>
                <SelectItem value="trackwrestling">TrackWrestling</SelectItem>
                <SelectItem value="flowrestling">FloWrestling</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg_url">External registration URL</Label>
            <Input
              id="reg_url"
              type="url"
              placeholder="https://…"
              value={regUrl}
              onChange={(e) => setRegUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry_fee">Cost per wrestler</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-clw-gray">$</span>
              <Input
                id="entry_fee"
                inputMode="decimal"
                placeholder="Blank if families do not pay on our site"
                className="pl-7"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
              />
            </div>
            <p className="text-base text-clw-gray">
              Families pay this online on our site only when the tournament has no external registration URL. Leave it
              blank for free tournaments or ones families pay for elsewhere.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Eligible practice groups</Label>
            <p className="text-sm text-clw-gray">Leave all unchecked to make it open to every group.</p>
            <div className="grid grid-cols-2 gap-2">
              {ORG.practiceGroups.map((group) => (
                <label key={group} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={groups.includes(group)}
                    onCheckedChange={(checked) => toggleGroup(group, checked === true)}
                  />
                  {group}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competition_level">Competition level</Label>
            <Input
              id="competition_level"
              list="competition-level-options"
              placeholder="e.g. Beginner-friendly, Competitive, Elite / Invite-only"
              value={competitionLevel}
              onChange={(e) => setCompetitionLevel(e.target.value)}
            />
            <datalist id="competition-level-options">
              <option value="Beginner-friendly" />
              <option value="Competitive" />
              <option value="Elite / Invite-only" />
            </datalist>
            <p className="text-sm text-clw-gray">
              A difficulty grade so parents can judge readiness. Every eligible group can still sign up.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Flyer image</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {uploading ? 'Uploading…' : 'Upload file'}
              </Button>
              {imageUrl && (
                <>
                  {flierKind(imageUrl) === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin flyer preview thumbnail
                    <img src={imageUrl} alt="Flyer preview" className="h-10 w-10 rounded object-cover" />
                  )}
                  <button
                    type="button"
                    className="min-h-11 min-w-11 px-2 text-sm text-clw-gray underline hover:text-clw-gold"
                    onClick={() => setImageUrl('')}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFlyerFile} />
            <Input
              id="image_url"
              type="url"
              placeholder="…or paste a link to the flier (https://…)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <p className="text-sm text-clw-gray">
              Upload a picture, or paste a link to a picture, a PDF or the tournament&apos;s page. Families see it on
              Tournaments and Events.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <fieldset className="space-y-4 rounded-xl border border-clw-gold/20 bg-clw-gold/5 p-4">
            <legend className="px-1 font-cond text-sm uppercase tracking-[0.16em] text-clw-gold">Admins only</legend>
            <p className="text-base text-clw-gray">Families and visitors never see these.</p>
            <div className="space-y-2">
              <Label htmlFor="club_registrations_url">TrackWrestling club registrations link</Label>
              <Input
                id="club_registrations_url"
                type="url"
                placeholder="https://www.trackwrestling.com/..."
                value={clubLink}
                onChange={(e) => setClubLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spots_allotted">Number of spots</Label>
              <Input
                id="spots_allotted"
                type="number"
                inputMode="numeric"
                min={1}
                max={500}
                step={1}
                placeholder="Blank if there is no limit"
                value={spots}
                onChange={(e) => setSpots(e.target.value)}
              />
              <p className="text-base text-clw-gray">
                Shows as &quot;5 of 12 spots filled&quot; on the tournament list and roster. It does not stop sign-ups.
              </p>
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create tournament'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
