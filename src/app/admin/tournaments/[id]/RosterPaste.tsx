'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardPaste } from 'lucide-react'

import type { MatchedRow } from '@/lib/tw-roster'
import { readTrackWrestlingPaste, saveTrackWrestlingRoster } from '../roster-actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Wrestler = { id: string; name: string; birthYear: number | null }

const NOT_ON_SITE = ''

const HOW_LABEL: Record<MatchedRow['how'], string> = {
  exact: 'Matched',
  remembered: 'Matched (picked before)',
  pick: 'Pick one',
  none: 'Not found on our site',
}

// Paste from TrackWrestling: read, check the matches, save. Nothing is saved
// until Save roster.
export function RosterPaste({
  tournamentId,
  wrestlers,
  hasRoster,
}: {
  tournamentId: string
  wrestlers: Wrestler[]
  hasRoster: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(!hasRoster)
  const [text, setText] = useState('')
  const [rows, setRows] = useState<MatchedRow[] | null>(null)
  const [picks, setPicks] = useState<string[]>([])
  const [summary, setSummary] = useState<{ otherTeams: number; dropped: string[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const answerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (error || rows) answerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error, rows])

  const label = (w: Wrestler) => (w.birthYear ? `${w.name} (born ${w.birthYear})` : w.name)

  async function read() {
    setError(null)
    setDone(null)
    setBusy(true)
    const result = await readTrackWrestlingPaste(tournamentId, text)
    setBusy(false)
    if (!result.ok) {
      setRows(null)
      setError(result.error)
      return
    }
    setRows(result.rows)
    setPicks(result.rows.map((r) => r.athleteId ?? NOT_ON_SITE))
    setSummary({ otherTeams: result.otherTeams, dropped: result.dropped })
  }

  async function save() {
    if (!rows) return
    setError(null)
    setBusy(true)
    const result = await saveTrackWrestlingRoster({
      tournamentId,
      rows: rows.map((r, i) => ({
        externalName: r.externalName,
        athleteId: picks[i] || null,
        division: r.division,
        weight: r.weight,
        grade: r.grade,
        paid: r.paid,
        submitted: r.submitted,
      })),
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const unmatched = result.saved - result.matched
    setDone(
      `Saved ${result.saved} wrestlers${unmatched ? `, ${unmatched} not matched to anyone on our site` : ''}.`
    )
    setRows(null)
    setText('')
    setOpen(false)
    router.refresh()
  }

  const toCheck = rows ? rows.filter((r, i) => !picks[i] && r.how !== 'none').length : 0

  if (!open) {
    return (
      <div className="space-y-3 print:hidden">
        {done && <p className="text-base text-clw-white">{done}</p>}
        <Button type="button" variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-2 sm:w-auto" onClick={() => setOpen(true)}>
          <ClipboardPaste className="mr-2 h-4 w-4 shrink-0" /> Paste a new list
        </Button>
      </div>
    )
  }

  return (
    <section className="space-y-4 rounded-xl border border-clw-gold/15 bg-clw-black p-4 md:p-5 print:hidden">
      <div className="space-y-1">
        <h2 className="text-xl font-display text-clw-gold">Paste from TrackWrestling</h2>
        <p className="text-base text-clw-gray">
          On TrackWrestling, open this tournament&apos;s Wrestler List, select the whole table, copy it and paste it
          below. Only Crystal Lake Wizards rows are kept. Pasting again replaces the list.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tw-paste">Wrestler List</Label>
        <textarea
          id="tw-paste"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-clw-gold/20 bg-clw-black-2 p-3 font-mono text-sm text-clw-white"
          placeholder="Paste the table here"
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={read} disabled={busy || !text.trim()}>
          {busy && !rows ? 'Reading…' : 'Read list'}
        </Button>
        {hasRoster && (
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        )}
      </div>

      <div ref={answerRef} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        {rows && summary && (
          <>
            <p className="text-base text-clw-white">
              {rows.length} Wizards wrestlers found
              {summary.otherTeams > 0 && ` (${summary.otherTeams} on other teams left out)`}.{' '}
              {toCheck > 0 ? `${toCheck} to check below.` : 'Every name with a match on our site is matched.'}
            </p>
            {summary.dropped.length > 0 && (
              <p className="text-base text-clw-gray">
                No longer on TrackWrestling&apos;s list, so they&apos;ll come off: {summary.dropped.join(', ')}.
              </p>
            )}
            <ul className="space-y-2">
              {rows.map((r, i) => {
                const suggested = new Set(r.candidates.map((c) => c.id))
                const others = wrestlers.filter((w) => !suggested.has(w.id))
                const needsLook = !picks[i] && r.how !== 'none'
                return (
                  <li
                    key={`${r.externalName}-${i}`}
                    className={`space-y-2 rounded-lg border p-3 ${needsLook ? 'border-clw-gold/50 bg-clw-gold/5' : 'border-clw-gold/10'}`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-base font-medium text-clw-white">{r.externalName}</p>
                      <p className="text-sm text-clw-gray">
                        {[r.division, r.weight && `${r.weight} lbs`, r.paid ? 'Paid' : 'Not paid'].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <label className="block space-y-1">
                      <span className="text-sm text-clw-gray">{HOW_LABEL[r.how]}: our wrestler</span>
                      <select
                        value={picks[i]}
                        onChange={(e) => setPicks((now) => now.map((p, j) => (j === i ? e.target.value : p)))}
                        className="min-h-11 w-full rounded-md border border-clw-gold/20 bg-clw-black-2 px-3 text-base text-clw-white"
                      >
                        <option value={NOT_ON_SITE}>— Not on our site —</option>
                        {r.candidates.length > 0 && (
                          <optgroup label="Same last name">
                            {r.candidates.map((c) => (
                              <option key={c.id} value={c.id}>
                                {label(c)}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="All wrestlers">
                          {others.map((w) => (
                            <option key={w.id} value={w.id}>
                              {label(w)}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </label>
                  </li>
                )
              })}
            </ul>
            <Button type="button" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save roster'}
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
