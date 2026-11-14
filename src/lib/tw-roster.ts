// Reads a TrackWrestling "Wrestler List" that an admin copied and pasted (Tyler,
// Nov 13). The site never fetches TrackWrestling itself: TrackWrestling turns
// away automated requests, so a person opens the list in their browser, copies
// the table and pastes it here.
//
// The table's columns (Nov 13): Tournament, Division, Weight, Name, State,
// Team, Submitted, Payment Received. Copied from a browser, each row is one
// line with the cells split by tabs.

export type TwRow = {
  /** The name exactly as TrackWrestling shows it, e.g. "William Hoy II (6th)". */
  externalName: string
  /** The name without the grade in brackets. */
  name: string
  /** "6th", "Pre-K"... when TrackWrestling shows one. */
  grade: string | null
  division: string | null
  weight: string | null
  team: string
  submitted: string | null
  paid: boolean
}

export type ParsedList = {
  /** Our club's rows. */
  rows: TwRow[]
  /** Rows for other teams, left out. */
  otherTeams: number
}

const COLUMNS = ['tournament', 'division', 'weight', 'name', 'state', 'team', 'submitted', 'payment received'] as const
type Column = (typeof COLUMNS)[number]

/** Names our club appears under on TrackWrestling. */
export function isOurTeam(team: string): boolean {
  const t = team.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
  return t.includes('crystal lake wizard') || t === 'cl wizards' || t === 'clw' || t === 'clw wizards'
}

function splitRow(line: string): string[] {
  // Browsers copy table cells with tabs. Some phones use runs of spaces.
  const cells = line.includes('\t') ? line.split('\t') : line.split(/\s{2,}/)
  return cells.map((c) => c.trim())
}

export function parseWrestlerList(text: string): ParsedList {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim())
  // Default positions; a header row, if pasted, takes over.
  let index: Partial<Record<Column, number>> = Object.fromEntries(COLUMNS.map((c, i) => [c, i]))
  const rows: TwRow[] = []
  let otherTeams = 0
  for (const line of lines) {
    const cells = splitRow(line)
    const lower = cells.map((c) => c.toLowerCase())
    if (lower.includes('name') && lower.includes('team')) {
      index = {}
      lower.forEach((c, i) => {
        const col = COLUMNS.find((name) => name === c)
        if (col) index[col] = i
      })
      // The unlabelled column between Name and Team is the state.
      if (index.name !== undefined && index.state === undefined) index.state = index.name + 1
      continue
    }
    const cell = (col: Column) => {
      const i = index[col]
      return i === undefined ? '' : (cells[i] ?? '')
    }
    const team = cell('team')
    const externalName = cell('name')
    if (!team || !externalName) continue
    if (!isOurTeam(team)) {
      otherTeams++
      continue
    }
    const grade = externalName.match(/\(([^)]+)\)\s*$/)?.[1]?.trim() ?? null
    rows.push({
      externalName,
      name: externalName.replace(/\s*\([^)]*\)\s*$/, '').trim(),
      grade,
      division: cell('division') || null,
      weight: cell('weight') || null,
      team,
      submitted: cell('submitted') || null,
      paid: Boolean(cell('payment received')),
    })
  }
  return { rows, otherTeams }
}

/** Lowercase letters only, no accents, no Jr/II/III, for comparing names. */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+(jr|sr|ii|iii|iv)$/, '')
}

const lastWord = (n: string) => n.split(' ').at(-1) ?? ''

export type Candidate = { id: string; name: string; birthYear: number | null }

export type MatchedRow = TwRow & {
  /** The wrestler it was matched to, or null when someone has to pick. */
  athleteId: string | null
  /** 'exact': one wrestler with this name. 'remembered': picked before.
   * 'pick': lookalikes to choose from. 'none': nobody on the site by that name. */
  how: 'exact' | 'remembered' | 'pick' | 'none'
  candidates: Candidate[]
}

type Athlete = { id: string; first_name: string; last_name: string; date_of_birth: string | null }

/**
 * Matches each pasted row to one of our wrestlers. Only an exact, unique name
 * (or a pick an admin made on an earlier paste) counts as matched: a kid listed
 * as "William Hoy II" who is "Liam Hoy" here gets offered, never assumed.
 */
export function matchRows(rows: TwRow[], athletes: Athlete[], remembered: Map<string, string> = new Map()): MatchedRow[] {
  const people = athletes.map((a) => ({
    id: a.id,
    name: `${a.first_name} ${a.last_name}`,
    key: normalizeName(`${a.first_name} ${a.last_name}`),
    last: lastWord(normalizeName(a.last_name)),
    birthYear: a.date_of_birth ? Number(a.date_of_birth.slice(0, 4)) : null,
  }))
  const asCandidate = (p: (typeof people)[number]): Candidate => ({ id: p.id, name: p.name, birthYear: p.birthYear })
  return rows.map((row) => {
    const key = normalizeName(row.name)
    const known = remembered.get(key)
    if (known && people.some((p) => p.id === known)) {
      return { ...row, athleteId: known, how: 'remembered', candidates: [] }
    }
    const exact = people.filter((p) => p.key === key)
    if (exact.length === 1) return { ...row, athleteId: exact[0].id, how: 'exact', candidates: [] }
    if (exact.length > 1) return { ...row, athleteId: null, how: 'pick', candidates: exact.map(asCandidate) }
    const sameLast = people.filter((p) => p.last && p.last === lastWord(key))
    if (sameLast.length) return { ...row, athleteId: null, how: 'pick', candidates: sameLast.map(asCandidate) }
    return { ...row, athleteId: null, how: 'none', candidates: [] }
  })
}

/** Spreadsheet text for coaches: one row per wrestler. */
export function rosterCsv(
  tournament: { name: string; date: string },
  rows: { division: string | null; weight: string | null; wrestler: string; externalName: string; paid: boolean }[]
): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  // Leading = + - @ would run as a formula in a spreadsheet.
  const safe = (v: string) => esc(/^[=+\-@]/.test(v) ? `'${v}` : v)
  const lines = [
    ['Tournament', 'Date', 'Division', 'Weight', 'Wrestler', 'Name on TrackWrestling', 'Paid'].join(','),
    ...rows.map((r) =>
      [tournament.name, tournament.date, r.division ?? '', r.weight ?? '', r.wrestler, r.externalName, r.paid ? 'Yes' : 'No']
        .map(safe)
        .join(',')
    ),
  ]
  return lines.join('\n')
}

/**
 * A TrackWrestling link without the copier's session code (twSessionId), the
 * time stamp (TIM) or tracking tags. tournamentGroupId is what finds the event.
 */
export function cleanTrackWrestlingUrl(raw: string): string {
  try {
    const url = new URL(raw)
    if (!/(^|\.)trackwrestling\.com$/i.test(url.hostname)) return raw
    for (const key of [...url.searchParams.keys()]) {
      if (/^(twSessionId|TIM|utm_.*)$/i.test(key)) url.searchParams.delete(key)
    }
    return url.toString()
  } catch {
    return raw
  }
}

/** Youngest age group first, girls and boys apart, then by weight. */
export function sortRoster<T extends { division: string | null; weight: string | null; wrestler: string }>(rows: T[]): T[] {
  const age = (d: string | null) => Number(d?.match(/(\d+)\s*u\b/i)?.[1] ?? 99)
  const side = (d: string | null) => (/girl/i.test(d ?? '') ? 1 : 0)
  const num = (w: string | null) => Number.parseFloat(w ?? '') || 9999
  return [...rows].sort(
    (a, b) =>
      side(a.division) - side(b.division) ||
      age(a.division) - age(b.division) ||
      (a.division ?? '').localeCompare(b.division ?? '') ||
      num(a.weight) - num(b.weight) ||
      a.wrestler.localeCompare(b.wrestler)
  )
}
