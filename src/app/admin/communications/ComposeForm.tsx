'use client'

import { useState, type FormEvent } from 'react'

import { previewRecipients } from './actions'
import type { CommTarget } from '@/lib/comms/recipients'
import type { CommType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TournamentOption = { id: string; name: string }
type AudienceKind = 'all' | 'practice_group' | 'tournament_registrants' | 'outstanding_dues'

const AUDIENCE_LABELS: Record<AudienceKind, string> = {
  all: 'All active parents',
  practice_group: 'A practice group',
  tournament_registrants: "A tournament's registrants",
  outstanding_dues: 'Parents with outstanding dues',
}

// Plain text from the textarea is sent to Resend as the email HTML body, so
// escape it and turn newlines into <br> — admins type plain text, not markup.
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(/\n/g, '<br>')
}

function buildTarget(
  audience: AudienceKind,
  practiceGroup: string,
  tournamentId: string
): CommTarget | null {
  if (audience === 'all') return { type: 'all' }
  if (audience === 'outstanding_dues') return { type: 'outstanding_dues' }
  if (audience === 'practice_group') {
    return practiceGroup ? { type: 'practice_group', practiceGroup } : null
  }
  if (audience === 'tournament_registrants') {
    return tournamentId ? { type: 'tournament_registrants', tournamentId } : null
  }
  return null
}

export function ComposeForm({
  practiceGroups,
  tournaments,
}: {
  practiceGroups: readonly string[]
  tournaments: TournamentOption[]
}) {
  const [audience, setAudience] = useState<AudienceKind>('all')
  const [practiceGroup, setPracticeGroup] = useState(practiceGroups[0] ?? '')
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const [preview, setPreview] = useState<{ count: number; sample: string[] } | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  // Outstanding-dues blasts are logged as dues reminders; everything else an
  // admin composes by hand is a general blast. comm_type is for the log, not
  // something worth putting in front of the user.
  const commType: CommType = audience === 'outstanding_dues' ? 'dues_reminder' : 'general_blast'

  function resetFeedback() {
    setError(null)
    setSent(null)
  }

  async function handlePreview() {
    resetFeedback()
    const target = buildTarget(audience, practiceGroup, tournamentId)
    if (!target) {
      setError('Pick a practice group or tournament first.')
      return
    }
    setPreviewing(true)
    const result = await previewRecipients(target)
    setPreviewing(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPreview({ count: result.count, sample: result.sample })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    resetFeedback()

    const target = buildTarget(audience, practiceGroup, tournamentId)
    if (!target) {
      setError('Pick a practice group or tournament first.')
      return
    }
    if (!subject.trim()) {
      setError('Subject is required.')
      return
    }
    if (!message.trim()) {
      setError('Message body is required.')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/comms/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          channel: 'email',
          commType,
          subject: subject.trim(),
          message: textToHtml(message),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to queue the send.')
        return
      }
      setSent('Your email is queued and sending now.')
      setSubject('')
      setMessage('')
      setPreview(null)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {sent && (
        <Alert className="border-clw-gold/40 bg-clw-gold/10">
          <AlertDescription className="text-clw-gold">{sent}</AlertDescription>
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

      {audience === 'practice_group' && (
        <div className="space-y-2">
          <Label>Practice group</Label>
          <Select
            value={practiceGroup}
            onValueChange={(value) => {
              setPracticeGroup(value)
              setPreview(null)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {practiceGroups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <p className="text-sm text-clw-gray">No tournaments yet — create one first.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={handlePreview} disabled={previewing}>
            {previewing ? 'Checking…' : 'Preview recipients'}
          </Button>
          {preview && (
            <p className="text-sm text-clw-gray">
              {preview.count} recipient{preview.count === 1 ? '' : 's'}
              {preview.sample.length > 0 && <> — {preview.sample.join(', ')}{preview.count > preview.sample.length && '…'}</>}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message to parents…"
        />
        <p className="text-sm text-clw-gray">
          Sends by email. SMS is a planned fast-follow. Only parents with a valid email receive it.
        </p>
      </div>

      <Button type="submit" disabled={sending}>
        {sending ? 'Sending…' : 'Send email'}
      </Button>
    </form>
  )
}
