'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { matchRows, normalizeName, parseWrestlerList, type MatchedRow } from '@/lib/tw-roster'

// "Paste from TrackWrestling" on a tournament's roster page (Tyler, Nov 13).
// Reading a paste only matches names and changes nothing; Save replaces the
// tournament's list. RLS (admins_manage_tournament_entries) and the save
// function both refuse anyone but an admin; these checks give a clean error.

async function adminClient() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  return profile?.role === 'admin' && profile.is_active ? supabase : null
}

export type ReadResult =
  | { ok: true; rows: MatchedRow[]; otherTeams: number; dropped: string[] }
  | { ok: false; error: string }

export async function readTrackWrestlingPaste(tournamentId: string, text: string): Promise<ReadResult> {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'Admin access required.' }
  if (!z.string().uuid().safeParse(tournamentId).success) return { ok: false, error: 'Tournament not found.' }
  if (text.length > 400_000) return { ok: false, error: 'That paste is too long. Copy just the Wrestler List table.' }

  const { rows, otherTeams } = parseWrestlerList(text)
  if (!rows.length) {
    return {
      ok: false,
      error:
        otherTeams > 0
          ? `Found ${otherTeams} wrestlers, but none on Crystal Lake Wizards.`
          : "Couldn't read a Wrestler List there. On TrackWrestling, open the tournament's Wrestler List, select the whole table, copy and paste it here.",
    }
  }

  const [{ data: athletes }, { data: past }, { data: current }] = await Promise.all([
    supabase.from('athletes').select('id, first_name, last_name, date_of_birth').eq('active', true),
    // Picks made on earlier pastes, so "William Hoy II" is matched once, not every time.
    supabase
      .from('tournament_entries')
      .select('external_name, athlete_id, imported_at')
      .not('athlete_id', 'is', null)
      .order('imported_at', { ascending: true }),
    supabase.from('tournament_entries').select('external_name').eq('tournament_id', tournamentId),
  ])
  const remembered = new Map<string, string>()
  for (const p of past ?? []) if (p.athlete_id) remembered.set(normalizeName(p.external_name), p.athlete_id)

  const pastedNames = new Set(rows.map((r) => r.externalName))
  const dropped = (current ?? []).map((c) => c.external_name).filter((name) => !pastedNames.has(name))
  return { ok: true, rows: matchRows(rows, athletes ?? [], remembered), otherTeams, dropped }
}

const saveSchema = z.object({
  tournamentId: z.string().uuid(),
  rows: z
    .array(
      z.object({
        externalName: z.string().trim().min(1).max(200),
        athleteId: z.string().uuid().nullable(),
        division: z.string().max(60).nullable(),
        weight: z.string().max(20).nullable(),
        grade: z.string().max(20).nullable(),
        paid: z.boolean(),
        submitted: z.string().max(40).nullable(),
      })
    )
    .max(500),
})

export type SaveResult = { ok: true; saved: number; matched: number } | { ok: false; error: string }

export async function saveTrackWrestlingRoster(values: z.input<typeof saveSchema>): Promise<SaveResult> {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'Admin access required.' }
  const parsed = saveSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: 'Something in the list was off. Paste it again.' }
  const { tournamentId, rows } = parsed.data

  // Two TrackWrestling names can't both be the same wrestler.
  const picked = rows.map((r) => r.athleteId).filter((id): id is string => Boolean(id))
  if (new Set(picked).size !== picked.length) {
    return { ok: false, error: 'The same wrestler is picked for two names. Fix one and save again.' }
  }
  if (picked.length) {
    const { data: found } = await supabase.from('athletes').select('id').in('id', picked)
    if ((found ?? []).length !== picked.length) return { ok: false, error: 'A picked wrestler is no longer on the site.' }
  }

  const { data, error } = await supabase.rpc('replace_tournament_entries', {
    p_tournament: tournamentId,
    p_entries: rows.map((r) => ({
      external_name: r.externalName,
      athlete_id: r.athleteId,
      division: r.division,
      weight: r.weight,
      grade: r.grade,
      paid: r.paid,
      submitted: r.submitted,
    })),
  })
  if (error) return { ok: false, error: 'Could not save the roster. Try again.' }
  revalidatePath(`/admin/tournaments/${tournamentId}`)
  revalidatePath('/admin/tournaments')
  return { ok: true, saved: Number(data ?? rows.length), matched: picked.length }
}
