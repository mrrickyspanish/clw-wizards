'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Info } from 'lucide-react'

import { withdrawRegistration } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { startCheckout } from '@/lib/checkout-client'
import { formatCents } from '@/lib/format/money'
import { AGE_DIVISION_LABELS, wrestlerAgeDivision } from '@/lib/age-division'
import {
  MAX_WRESTLERS_PER_CHECKOUT,
  checkoutTotal,
  parseWeight,
  registrationPaymentState,
  type RegistrationPaymentMethod,
  type RegistrationPaymentState,
  type RegistrationStatus,
} from '@/lib/tournament-registration'

/**
 * Register and pay for an in-house tournament that has a cost (Tyler, Nov 14:
 * B4). The family picks wrestlers, enters each one's weight (division and
 * grade are filled in where the site knows them), sees the total and goes to
 * Stripe. The browser never sends an amount: POST /api/checkout charges the
 * tournament's entry_fee_cents per wrestler, read from the database.
 */

export type EntryAthlete = {
  id: string
  name: string
  dateOfBirth: string | null
  ageDivision: string | null
  // From the wrestler's latest season enrollment, when it has one.
  grade: string | null
}

// One registration as the page reads it. The payment columns are written only
// by the server (Stripe webhook) or an admin.
export type RegistrationState = {
  id: string
  status: RegistrationStatus
  feeCents?: number | null
  paidCents?: number | null
  paymentMethod?: RegistrationPaymentMethod | null
  weight?: string | null
  division?: string | null
  grade?: string | null
}

// Same words as the server action's refusal (default A5).
export const PAID_ENTRY_NOTE = 'Paid entries are withdrawn by the club. Contact the club to change this.'

const CHECKOUT_TOURNAMENT_KEY = 'clw-tournament-checkout'
const MAX_DIVISION = 60
const MAX_GRADE = 20

/**
 * True once money or an admin's cash, check or waived mark is on the entry.
 * Mirrors entryIsLocked in src/lib/payments/tournament-checkout.ts, which the
 * server actions use; that module is server-only, so this copy only decides
 * what the page offers.
 */
export function isEntryLocked(reg: Pick<RegistrationState, 'paidCents' | 'paymentMethod'> | null | undefined): boolean {
  return Boolean(reg && ((reg.paidCents ?? 0) > 0 || reg.paymentMethod != null))
}

/** The entry's payment state, judged against the effective fee (locked fee, else the tournament's). */
export function entryState(reg: RegistrationState, tournamentFeeCents: number | null): RegistrationPaymentState {
  return registrationPaymentState({
    feeCents: reg.feeCents ?? tournamentFeeCents,
    paidCents: reg.paidCents,
    paymentMethod: reg.paymentMethod,
    status: reg.status,
  })
}

export const STATE_LABELS: Record<RegistrationPaymentState, string> = {
  paid: 'Paid',
  waived: 'Waived',
  due: 'Payment due',
  free: 'Registered (free)',
  withdrawn: 'Withdrawn',
}

/** Total for the picked wrestlers, from the same helper the checkout uses. Null when it cannot be paid. */
export function selectionTotal(feeCents: number, count: number): number | null {
  return count > 0 ? checkoutTotal(feeCents, count) : null
}

export function payButtonLabel(feeCents: number, count: number): string {
  const total = selectionTotal(feeCents, count)
  return total == null ? 'Register and pay' : `Register and pay ${formatCents(total)}`
}

export type EntryDraft = { weight: string; division: string; grade: string }

/** The division to start from: what the family entered before, else the wrestler's age division. */
export function defaultDraft(athlete: EntryAthlete, reg: RegistrationState | undefined): EntryDraft {
  const age = wrestlerAgeDivision({
    date_of_birth: athlete.dateOfBirth,
    age_division: athlete.ageDivision,
  })
  return {
    weight: reg?.weight ?? '',
    division: reg?.division ?? (age ? AGE_DIVISION_LABELS[age] : ''),
    grade: reg?.grade ?? athlete.grade ?? '',
  }
}

/** A problem with one wrestler's fields, or null. */
export function draftProblem(name: string, draft: EntryDraft): string | null {
  if (!parseWeight(draft.weight)) return `Enter ${name}'s weight in pounds, from 30 to 300.`
  const division = draft.division.trim()
  if (!division || division.length > MAX_DIVISION) return `Enter ${name}'s division.`
  if (draft.grade.trim().length > MAX_GRADE) return `Keep ${name}'s grade to ${MAX_GRADE} characters or less.`
  return null
}

/**
 * The exact body sent to POST /api/checkout (CLW-ENG-004 interface). It has
 * no amount, price or total: the server reads the fee from the database.
 */
export function buildCheckoutBody(
  tournamentId: string,
  picks: { athleteId: string; draft: EntryDraft }[]
) {
  return {
    flow: 'tournament' as const,
    tournamentId,
    entries: picks.map(({ athleteId, draft }) => {
      const grade = draft.grade.trim()
      return {
        athleteId,
        weight: parseWeight(draft.weight) ?? draft.weight.trim(),
        division: draft.division.trim(),
        ...(grade ? { grade } : {}),
      }
    }),
    returnPath: '/tournaments',
  }
}

const STATE_STYLES: Record<RegistrationPaymentState, string> = {
  paid: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  waived: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  free: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold-ink',
  due: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  withdrawn: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
}

export function RegisterAndPayForm({
  tournamentId,
  feeCents,
  athletes,
  registrations,
  showReturnFallback = false,
}: {
  tournamentId: string
  feeCents: number
  athletes: EntryAthlete[]
  // keyed by athlete id
  registrations: Record<string, RegistrationState>
  // Show the "back from Stripe" message on this card when the browser does not
  // remember which tournament was paid (the first priced card on the page).
  showReturnFallback?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Record<string, EntryDraft>>(() =>
    Object.fromEntries(athletes.map((a) => [a.id, defaultDraft(a, registrations[a.id])]))
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [paidTournament, setPaidTournament] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = window.sessionStorage.getItem(CHECKOUT_TOURNAMENT_KEY)
    } catch {
      stored = null
    }
    setPaidTournament(stored)
  }, [])

  const returned = searchParams?.get('checkout')
  const showReturn =
    (returned === 'success' || returned === 'cancelled') &&
    (paidTournament ? paidTournament === tournamentId : showReturnFallback)

  if (athletes.length === 0) {
    return <p className="text-base text-clw-gray">Add a wrestler to your roster before registering.</p>
  }

  const total = selectionTotal(feeCents, selected.length)
  const tooMany = selected.length > MAX_WRESTLERS_PER_CHECKOUT
  const hasLocked = athletes.some((a) => isEntryLocked(registrations[a.id]))

  function setDraft(athleteId: string, patch: Partial<EntryDraft>) {
    setDrafts((d) => ({ ...d, [athleteId]: { ...d[athleteId], ...patch } }))
    setError(null)
  }

  function toggle(athleteId: string, on: boolean) {
    setSelected((s) => (on ? [...s.filter((id) => id !== athleteId), athleteId] : s.filter((id) => id !== athleteId)))
    setError(null)
  }

  async function pay(athleteIds: string[]) {
    setError(null)
    if (athleteIds.length === 0) {
      setError('Pick at least one wrestler.')
      return
    }
    if (athleteIds.length > MAX_WRESTLERS_PER_CHECKOUT) {
      setError(`Register at most ${MAX_WRESTLERS_PER_CHECKOUT} wrestlers at a time.`)
      return
    }
    for (const id of athleteIds) {
      const athlete = athletes.find((a) => a.id === id)
      const problem = athlete ? draftProblem(athlete.name.split(' ')[0] || athlete.name, drafts[id]) : 'Pick a wrestler.'
      if (problem) {
        setError(problem)
        return
      }
    }
    setBusy(athleteIds.length === 1 ? athleteIds[0] : 'all')
    const result = await startCheckout(
      buildCheckoutBody(
        tournamentId,
        athleteIds.map((athleteId) => ({ athleteId, draft: drafts[athleteId] }))
      )
    )
    if (!result.ok) {
      setError(result.message)
      setBusy(null)
      return
    }
    try {
      window.sessionStorage.setItem(CHECKOUT_TOURNAMENT_KEY, tournamentId)
    } catch {
      // The return message then shows on the first priced card instead.
    }
    window.location.href = result.url
  }

  function payNow(athleteId: string) {
    // Pay for this one wrestler, with the details saved on their entry.
    setSelected((s) => (s.includes(athleteId) ? s : [...s, athleteId]))
    void pay([athleteId])
  }

  function withdraw(athleteId: string, registrationId: string) {
    setError(null)
    setBusy(athleteId)
    startTransition(async () => {
      const result = await withdrawRegistration({ registrationId })
      setBusy(null)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSelected((s) => s.filter((id) => id !== athleteId))
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 rounded-xl border border-clw-gold/15 bg-clw-black p-4">
      {showReturn && returned === 'success' && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-base text-emerald-200">
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
          <span>Payment received. It can take a minute to show here.</span>
        </p>
      )}
      {showReturn && returned === 'cancelled' && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-clw-gold/30 bg-clw-gold/10 p-3 text-base text-clw-white">
          <Info className="mt-1 h-4 w-4 shrink-0 text-clw-gold-ink" />
          <span>Checkout was cancelled and nothing was charged. Your wrestler is not registered until the entry is paid.</span>
        </p>
      )}

      <p className="text-base text-clw-white">
        Cost per wrestler: <span className="font-semibold text-clw-gold-ink">{formatCents(feeCents)}</span>
      </p>

      <ul className="space-y-3">
        {athletes.map((a) => {
          const reg = registrations[a.id]
          const state = reg ? entryState(reg, feeCents) : null
          const locked = isEntryLocked(reg)
          // Paid, waived and (zero-fee) free entries are done; the rest can be paid.
          const payable = !locked && (state === null || state === 'withdrawn' || state === 'due')
          const checked = selected.includes(a.id)
          const draft = drafts[a.id] ?? defaultDraft(a, reg)
          const rowBusy = busy === a.id
          const field = `entry-${tournamentId}-${a.id}`
          return (
            <li key={a.id} className="space-y-3 rounded-lg border border-clw-gold/10 bg-clw-black-3 p-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                {payable ? (
                  <label htmlFor={`${field}-pick`} className="flex min-h-11 min-w-0 cursor-pointer items-center gap-3 text-base text-clw-white">
                    <input
                      id={`${field}-pick`}
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggle(a.id, e.target.checked)}
                      className="h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
                    />
                    <span className="min-w-0 break-words">{a.name}</span>
                  </label>
                ) : (
                  <span className="flex min-h-11 min-w-0 items-center break-words text-base text-clw-white">{a.name}</span>
                )}
                {state && (
                  <Badge variant="outline" className={`whitespace-nowrap text-sm ${STATE_STYLES[state]}`}>
                    {STATE_LABELS[state]}
                  </Badge>
                )}
              </div>

              {checked && payable && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label htmlFor={`${field}-weight`} className="block text-base text-clw-gray">
                      Weight (lbs)
                    </label>
                    <Input
                      id={`${field}-weight`}
                      inputMode="decimal"
                      autoComplete="off"
                      required
                      placeholder="e.g. 62"
                      value={draft.weight}
                      onChange={(e) => setDraft(a.id, { weight: e.target.value })}
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`${field}-division`} className="block text-base text-clw-gray">
                      Division
                    </label>
                    <Input
                      id={`${field}-division`}
                      autoComplete="off"
                      required
                      maxLength={MAX_DIVISION}
                      value={draft.division}
                      onChange={(e) => setDraft(a.id, { division: e.target.value })}
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`${field}-grade`} className="block text-base text-clw-gray">
                      Grade (optional)
                    </label>
                    <Input
                      id={`${field}-grade`}
                      autoComplete="off"
                      maxLength={MAX_GRADE}
                      value={draft.grade}
                      onChange={(e) => setDraft(a.id, { grade: e.target.value })}
                      className="text-base"
                    />
                  </div>
                </div>
              )}

              {reg && state === 'due' && !locked && (
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-base max-sm:w-full"
                    disabled={busy !== null || pending}
                    onClick={() => withdraw(a.id, reg.id)}
                  >
                    {rowBusy && pending ? 'Withdrawing…' : 'Withdraw'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="text-base max-sm:w-full"
                    disabled={busy !== null || pending}
                    onClick={() => payNow(a.id)}
                  >
                    {rowBusy && !pending ? 'Starting checkout…' : `Pay now ${formatCents(reg.feeCents ?? feeCents)}`}
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {hasLocked && <p className="text-base text-clw-gray">{PAID_ENTRY_NOTE}</p>}

      {error && (
        <p role="alert" className="text-base text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-clw-gold/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base text-clw-white" aria-live="polite">
          {selected.length === 0
            ? 'Pick the wrestlers to register.'
            : tooMany
              ? `Register at most ${MAX_WRESTLERS_PER_CHECKOUT} wrestlers at a time.`
              : `Total for ${selected.length} ${selected.length === 1 ? 'wrestler' : 'wrestlers'}: `}
          {total != null && <span className="font-semibold text-clw-gold-ink">{formatCents(total)}</span>}
        </p>
        <Button
          type="button"
          className="h-auto min-h-12 whitespace-normal text-base max-sm:w-full"
          disabled={selected.length === 0 || tooMany || busy !== null || pending}
          onClick={() => void pay(selected)}
        >
          {busy === 'all' ? 'Starting checkout…' : payButtonLabel(feeCents, selected.length)}
        </Button>
      </div>
    </div>
  )
}
