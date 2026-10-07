'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { previewRecipients, type PreviewRecipient } from './actions'
import type { CommTarget, MissingDocument } from '@/lib/comms/recipients'
import type { CommType } from '@/types/database'
import { clubSms, smsSegments } from '@/lib/twilio/format'
import { eventMessage, formatEventDate, type EventOption } from '@/lib/comms/event-message'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type TournamentOption = { id: string; name: string }
type ParentOption = { id: string; full_name: string | null; email: string | null }

type AudienceKind =
  | 'all'
  | 'practice_groups'
  | 'tournament_registrants'
  | 'outstanding_dues'
  | 'missing_documents'
  | 'specific_parents'

const AUDIENCE_LABELS: Record<AudienceKind, string> = {
  all: 'All active parents',
  practice_groups: 'Practice groups',
  tournament_registrants: "A tournament's registrants",
  outstanding_dues: 'Parents with outstanding dues',
  missing_documents: 'Missing documents',
  specific_parents: 'Specific parent(s)',
}

const DOCUMENT_FILTERS: { value: MissingDocument; label: string }[] = [
  { value: 'birth_certificate', label: 'Missing a birth certificate' },
  { value: 'usa_wrestling_card', label: 'Missing a USA Wrestling card' },
]

// Plain text from the textarea is sent to Resend as the email HTML body, so
// escape it and turn newlines into <br> — admins type plain text, not markup.
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(/\n/g, '<br>')
}

/**
 * A route handler that throws returns an HTML error page, not JSON. Parsing
 * that blind is what used to make every server-side failure surface as
 * "Network error — please try again" — the one thing it definitively was not.
 */
async function readJsonBody(res: Response): Promise<{ error?: string } | null> {
  const raw = await res.text()
  if (!raw) return null
  try {
    return JSON.parse(raw) as { error?: string }
  } catch {
    return null
  }
}

function buildTarget(
  audience: AudienceKind,
  practiceGroups: string[],
  tournamentId: string,
  documents: MissingDocument[],
  parentIds: string[]
): CommTarget | null {
  if (audience === 'all') return { type: 'all' }
  if (audience === 'outstanding_dues') return { type: 'outstanding_dues' }
  if (audience === 'practice_groups') {
    return practiceGroups.length ? { type: 'practice_groups', practiceGroups } : null
  }
  if (audience === 'tournament_registrants') {
    return tournamentId ? { type: 'tournament_registrants', tournamentId } : null
  }
  if (audience === 'missing_documents') {
    return documents.length ? { type: 'missing_document', documents } : null
  }
  if (audience === 'specific_parents') {
    return parentIds.length ? { type: 'custom', profileIds: parentIds } : null
  }
  return null
}

type Channel = 'email' | 'sms' | 'both'

const CHANNEL_LABELS: Record<Channel, string> = { email: 'Email', sms: 'Text', both: 'Email + text' }

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function parentDisplayName(p: ParentOption): string {
  return p.full_name || p.email || 'Unnamed parent'
}

export function ComposeForm({
  practiceGroups,
  tournaments,
  events,
  boardNames,
  parents,
  queueReady,
  queueMissing,
  smsReady,
}: {
  practiceGroups: readonly string[]
  tournaments: TournamentOption[]
  events: EventOption[]
  boardNames: string[]
  parents: ParentOption[]
  queueReady: boolean
  queueMissing: string[]
  // Twilio credentials and a sender are set. Until then only email is offered.
  smsReady: boolean
}) {
  const [channel, setChannel] = useState<Channel>('email')
  const [smsText, setSmsText] = useState('')
  const wantsEmail = channel !== 'sms'
  const wantsSms = channel !== 'email'
  const smsFinal = smsText.trim() ? clubSms(smsText) : ''
  const [audience, setAudience] = useState<AudienceKind>('all')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [documents, setDocuments] = useState<MissingDocument[]>([])
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? '')
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([])
  const [parentPickerOpen, setParentPickerOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const [eventId, setEventId] = useState('')
  const [preview, setPreview] = useState<{ count: number; wrestlerCount: number; smsCount: number; recipients: PreviewRecipient[] } | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // What was just sent, for the confirmation: its subject and how many families it is going to.
  const [sent, setSent] = useState<{ subject: string; families: number | null } | null>(null)

  // Outstanding-dues blasts are logged as dues reminders; everything else an
  // admin composes by hand is a general blast. comm_type is for the log, not
  // something worth putting in front of the user.
  const commType: CommType = audience === 'outstanding_dues' ? 'dues_reminder' : 'general_blast'

  const selectedParents = parents.filter((p) => selectedParentIds.includes(p.id))

  function resetFeedback() {
    setError(null)
    setSent(null)
  }

  // Picking an event fills in its details. What the admin already typed is
  // kept: the subject only fills when empty, and the details go above any
  // message already written.
  function chooseEvent(id: string) {
    setEventId(id)
    const event = events.find((e) => e.id === id)
    if (!event) return
    const draft = eventMessage(event)
    if (!subject.trim()) setSubject(draft.subject)
    setMessage((current) => (current.trim() ? `${draft.body}\n\n${current}` : `${draft.body}\n\n`))
  }

  function currentTarget(): CommTarget | null {
    return buildTarget(audience, selectedGroups, tournamentId, documents, selectedParentIds)
  }

  async function handlePreview() {
    resetFeedback()
    const target = currentTarget()
    if (!target) {
      setError('Choose at least one option for this audience first.')
      return
    }
    setPreviewing(true)
    const result = await previewRecipients(target)
    setPreviewing(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPreview({ count: result.count, wrestlerCount: result.wrestlerCount, smsCount: result.smsCount, recipients: result.recipients })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    resetFeedback()

    if (!queueReady) {
      setError('Email sending is not configured on this environment yet — see the notice above.')
      return
    }

    const target = currentTarget()
    if (!target) {
      setError('Choose at least one option for this audience first.')
      return
    }
    if (wantsEmail && !subject.trim()) {
      setError('Subject is required.')
      return
    }
    if (wantsEmail && !message.trim()) {
      setError('Message body is required.')
      return
    }
    if (wantsSms && !smsText.trim()) {
      setError('Write the text message.')
      return
    }

    setSending(true)
    try {
      // How many families this reaches, for the confirmation. Best effort: the
      // send itself does not depend on it.
      const counted = await previewRecipients(target).catch(() => null)
      const res = await fetch('/api/comms/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          channel,
          commType,
          subject: wantsEmail ? subject.trim() : undefined,
          // A text-only send carries the text as its message, for the board copy.
          message: wantsEmail ? textToHtml(message) : smsText.trim(),
          smsMessage: wantsSms ? smsText.trim() : undefined,
        }),
      })

      const data = await readJsonBody(res)

      if (!res.ok) {
        setError(
          data?.error ??
            `The server rejected this send (HTTP ${res.status}) and nothing went out. Try again, and if it keeps happening send this code to your developer.`
        )
        return
      }

      const smsLabel = smsText.trim().length > 50 ? `${smsText.trim().slice(0, 50)}…` : smsText.trim()
      setSent({ subject: wantsEmail ? subject.trim() : `Text: ${smsLabel}`, families: counted?.ok ? counted.count : null })
      // Clear the whole form so it is plain the message has gone. The audience
      // type stays, but its picks are cleared, so a second send cannot reach
      // the same people again (or everyone) by accident: it asks for a pick.
      setSubject('')
      setMessage('')
      setSmsText('')
      setEventId('')
      setPreview(null)
      setSelectedGroups([])
      setDocuments([])
      setSelectedParentIds([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // Genuinely never reached the server — fetch itself rejected.
      setError('Could not reach the server. Check your connection and try again — nothing was sent.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {!queueReady && (
        <Alert variant="destructive">
          <AlertTitle className="text-base">Email sending is not configured</AlertTitle>
          <AlertDescription className="text-base">
            Sending is turned off because this environment is missing{' '}
            <span className="font-mono">{queueMissing.join(', ')}</span>. Add{' '}
            {queueMissing.length === 1 ? 'it' : 'them'} to the project&rsquo;s environment variables
            and redeploy. Choosing an audience and previewing recipients still works in the meantime.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-base">{error}</AlertDescription>
        </Alert>
      )}
      {sent && (
        <Alert className="border-clw-gold/40 bg-clw-gold/10">
          <AlertTitle className="text-base text-clw-gold">Sent: &ldquo;{sent.subject}&rdquo;</AlertTitle>
          <AlertDescription className="text-base text-clw-gold">
            {sent.families != null && `Going to ${sent.families} famil${sent.families === 1 ? 'y' : 'ies'}. `}
            Emails go out within a minute, and the form is cleared for your next message.{' '}
            <Link href="/admin/communications?tab=history" className="font-medium underline">
              Check delivery in History
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Audience</Label>
        <Select
          value={audience}
          onValueChange={(value) => {
            setAudience(value as AudienceKind)
            setPreview(null)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(AUDIENCE_LABELS) as AudienceKind[]).map((kind) => (
              <SelectItem key={kind} value={kind}>
                {AUDIENCE_LABELS[kind]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {audience === 'practice_groups' && (
        <div className="space-y-2">
          <Label>Practice groups</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {practiceGroups.map((g) => (
              <label
                key={g}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-clw-gold/20 bg-clw-black/40 px-3 py-2.5"
              >
                <Checkbox
                  checked={selectedGroups.includes(g)}
                  onCheckedChange={() => {
                    setSelectedGroups((prev) => toggle(prev, g))
                    setPreview(null)
                  }}
                />
                <span className="text-base">{g}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-clw-gray">Reaches parents of any active wrestler in the checked groups.</p>
        </div>
      )}

      {audience === 'missing_documents' && (
        <div className="space-y-2">
          <Label>Missing documents</Label>
          <div className="grid gap-2">
            {DOCUMENT_FILTERS.map((doc) => (
              <label
                key={doc.value}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-clw-gold/20 bg-clw-black/40 px-3 py-2.5"
              >
                <Checkbox
                  checked={documents.includes(doc.value)}
                  onCheckedChange={() => {
                    setDocuments((prev) => toggle(prev, doc.value))
                    setPreview(null)
                  }}
                />
                <span className="text-base">{doc.label}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-clw-gray">
            Reaches parents of active wrestlers still missing any checked document.
          </p>
        </div>
      )}

      {audience === 'tournament_registrants' && (
        <div className="space-y-2">
          <Label>Tournament</Label>
          {tournaments.length ? (
            <Select
              value={tournamentId}
              onValueChange={(value) => {
                setTournamentId(value)
                setPreview(null)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-base text-clw-gray">No tournaments yet — create one first.</p>
          )}
        </div>
      )}

      {audience === 'specific_parents' && (
        <div className="space-y-2">
          <Label>Parents</Label>
          <Popover open={parentPickerOpen} onOpenChange={setParentPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={parentPickerOpen}
                className="w-full justify-between text-base font-normal"
              >
                {selectedParentIds.length
                  ? `${selectedParentIds.length} parent${selectedParentIds.length === 1 ? '' : 's'} selected`
                  : 'Search by name or email…'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search by name or email…" />
                <CommandList>
                  <CommandEmpty>No parent matches.</CommandEmpty>
                  <CommandGroup>
                    {parents.map((p) => {
                      const isSelected = selectedParentIds.includes(p.id)
                      return (
                        <CommandItem
                          key={p.id}
                          value={`${p.full_name ?? ''} ${p.email ?? ''}`}
                          onSelect={() => {
                            setSelectedParentIds((prev) => toggle(prev, p.id))
                            setPreview(null)
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                          <div className="flex flex-col">
                            <span className="text-base">{parentDisplayName(p)}</span>
                            {p.full_name && p.email && (
                              <span className="text-sm text-clw-gray">{p.email}</span>
                            )}
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedParents.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedParents.map((p) => (
                <Badge key={p.id} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1">
                  {parentDisplayName(p)}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedParentIds((prev) => prev.filter((id) => id !== p.id))
                      setPreview(null)
                    }}
                    className="rounded-full p-0.5 hover:bg-clw-black/20"
                    aria-label={`Remove ${parentDisplayName(p)}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <p className="text-sm text-clw-gray">
            Reaches only the parents you pick — useful for a one-off message to a single family.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={handlePreview} disabled={previewing}>
            {previewing ? 'Checking…' : 'Preview recipients'}
          </Button>
          {preview && (
            <p className="text-base text-clw-white">
              {preview.wrestlerCount} wrestler{preview.wrestlerCount === 1 ? '' : 's'} · {preview.count} famil
              {preview.count === 1 ? 'y' : 'ies'}
              {wantsSms && ` · ${preview.smsCount} get the text`}
            </p>
          )}
        </div>
        {preview && preview.recipients.length > 0 && (
          <ul
            aria-label="Recipients"
            className="max-h-80 divide-y divide-clw-gold/10 overflow-y-auto rounded-md border border-clw-gold/20 bg-clw-black/40"
          >
            {preview.recipients.map((r, index) => (
              <li key={`${r.email ?? r.parent}-${index}`} className="px-3 py-2">
                <p className="text-base text-clw-white">
                  {r.wrestlers.length ? r.wrestlers.join(', ') : <span className="text-clw-gray">No wrestler listed</span>}
                </p>
                <p className={cn('text-sm', r.email ? 'text-clw-gray' : 'text-red-400')}>
                  {r.parent} · {r.email ?? 'No email: will not receive this'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {events.length > 0 && (
        <div className="space-y-2">
          <Label>About an event (optional)</Label>
          <Select value={eventId} onValueChange={chooseEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an event to fill in its details" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}: {formatEventDate(e.date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-clw-gray">Adds the event&apos;s date, time and place to the message. Edit it before sending.</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Send as</Label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Send as">
          {(Object.keys(CHANNEL_LABELS) as Channel[]).map((option) => {
            const disabled = option !== 'email' && !smsReady
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={channel === option}
                disabled={disabled}
                onClick={() => {
                  setChannel(option)
                  resetFeedback()
                }}
                className={cn(
                  'rounded-md border px-4 py-2 text-base transition-colors',
                  channel === option
                    ? 'border-clw-gold bg-clw-gold/15 text-clw-gold'
                    : 'border-clw-gold/20 text-clw-gray hover:border-clw-gold/50',
                  disabled && 'cursor-not-allowed opacity-50 hover:border-clw-gold/20'
                )}
              >
                {CHANNEL_LABELS[option]}
              </button>
            )
          })}
        </div>
        <p className="text-sm text-clw-gray">
          {smsReady
            ? 'Texts go only to parents who opted in to texts and have a mobile number on file.'
            : 'Texting turns on once the club’s text number is approved.'}
        </p>
      </div>

      {wantsSms && (
        <div className="space-y-2">
          <Label htmlFor="smsText">Text message</Label>
          <Textarea
            id="smsText"
            rows={4}
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            placeholder="Short and to the point, e.g. Practice is canceled tonight. Regular schedule resumes Wednesday."
          />
          {smsFinal && (
            <div className="rounded-md border border-clw-gold/20 bg-clw-black/40 p-3">
              <p className="text-sm text-clw-gray">Parents receive:</p>
              <p className="mt-1 whitespace-pre-wrap text-base text-clw-white">{smsFinal}</p>
              <p className={cn('mt-2 text-sm', smsSegments(smsFinal) > 2 ? 'text-amber-300' : 'text-clw-gray')}>
                {[...smsFinal].length} characters · counts as {smsSegments(smsFinal)} text
                {smsSegments(smsFinal) === 1 ? '' : 's'} per family
                {smsSegments(smsFinal) > 2 ? '. Shorter is cheaper and easier to read.' : ''}
              </p>
            </div>
          )}
          <p className="text-sm text-clw-gray">
            &ldquo;CLW Wizards:&rdquo; and &ldquo;Reply STOP to opt out.&rdquo; are added automatically.
          </p>
        </div>
      )}

      {wantsEmail && (
        <>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Email message</Label>
            <Textarea
              id="message"
              rows={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message to parents…"
            />
            <p className="text-sm text-clw-gray">Only parents with a valid email receive it.</p>
          </div>
        </>
      )}

      <div className="space-y-2">
        <p className="text-sm text-clw-gray">
          {boardNames.length > 0
            ? `Board copy: ${boardNames.join(', ')} ${boardNames.length === 1 ? 'gets' : 'each get'} one copy of this message. Change the list on the Board copy tab.`
            : 'Nobody is on the board copy list yet. Add people on the Board copy tab.'}
        </p>
      </div>

      <Button type="submit" disabled={sending || !queueReady}>
        {sending ? 'Sending…' : channel === 'email' ? 'Send email' : channel === 'sms' ? 'Send text' : 'Send email + text'}
      </Button>
    </form>
  )
}
