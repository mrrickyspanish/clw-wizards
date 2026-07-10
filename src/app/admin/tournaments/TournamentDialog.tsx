'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Upload } from 'lucide-react'

import type { Tournament } from '@/types/database'
import { ORG } from '@/config/org.config'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { createTournament, updateTournament, type TournamentInput } from './actions'
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

export function TournamentDialog({ tournament }: { tournament?: Tournament }) {
  const router = useRouter()
  const isEdit = Boolean(tournament)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(tournament?.name ?? '')
  const [date, setDate] = useState(tournament?.date ?? '')
  const [location, setLocation] = useState(tournament?.location ?? '')
  const [city, setCity] = useState(tournament?.city ?? '')
  const [state, setState] = useState(tournament?.state ?? 'IL')
  const [status, setStatus] = useState<Tournament['status']>(tournament?.status ?? 'open')
  const [startTime, setStartTime] = useState(tournament?.start_time ?? '')
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

  // Reset fields to the source values each time the dialog opens, so a create
  // form doesn't retain the previous entry and an edit form reflects the latest
  // saved values.
  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setName(tournament?.name ?? '')
      setDate(tournament?.date ?? '')
      setLocation(tournament?.location ?? '')
      setCity(tournament?.city ?? '')
      setState(tournament?.state ?? 'IL')
      setStatus(tournament?.status ?? 'open')
      setStartTime(tournament?.start_time ?? '')
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
    setLoading(true)

    const values: TournamentInput = {
      name,
      date,
      location,
      city,
      state,
      status,
      start_time: startTime,
      weigh_in_date: weighInDate,
      weigh_in_time: weighInTime,
      weigh_in_location: weighInLocation,
      external_platform: platform === PLATFORM_NONE ? null : (platform as TournamentInput['external_platform']),
      external_registration_url: regUrl,
      practice_groups: groups,
      competition_level: competitionLevel,
      image_url: imageUrl,
      notes,
    }

    const result = isEdit
      ? await updateTournament(tournament!.id, values)
      : await createTournament(values)

    setLoading(false)

    if (!result.ok) {
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
            <div className="min-w-0 space-y-2">
              <Label htmlFor="start_time">Start time</Label>
              <Input id="start_time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location / venue</Label>
            <Input id="location" required value={location} onChange={(e) => setLocation(e.target.value)} />
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
            <p className="text-xs text-clw-gray">
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
            <Label>Eligible practice groups</Label>
            <p className="text-xs text-clw-gray">Leave all unchecked to make it open to every group.</p>
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
            <p className="text-xs text-clw-gray">
              A difficulty grade so parents can judge readiness — every eligible group can still sign up.
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
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin flyer preview thumbnail */}
                  <img src={imageUrl} alt="Flyer preview" className="h-10 w-10 rounded object-cover" />
                  <button
                    type="button"
                    className="text-xs text-clw-gray underline hover:text-clw-gold"
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
              placeholder="…or paste an image URL (https://…)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <p className="text-xs text-clw-gray">Upload a flyer or paste a URL — shown as the event&apos;s homepage preview.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

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
