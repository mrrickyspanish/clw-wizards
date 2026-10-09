import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Athlete, DeletionLogEntry, Profile } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdminSearch } from '../AdminSearch'
import { matchesSearch } from '@/lib/search'

export default async function AdminFamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>
}) {
  const { q, show } = await searchParams
  const query = (q ?? '').trim()
  const emptyOnly = show === 'empty'
  const removedOnly = show === 'removed'

  const supabase = createAdminSupabase()

  const [{ data: families, error }, { data: athletes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, is_active, sms_opt_in')
      .eq('role', 'parent')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true }),
    supabase.from('athletes').select('id, parent_id, active, first_name, last_name'),
  ])
  // Families and wrestlers removed from the site, newest first. Missing table
  // (migration not applied yet) reads as an empty history.
  const { data: removedData } = await supabase
    .from('deletion_log')
    .select('*')
    .order('deleted_at', { ascending: false })
    .limit(200)
  const removed = ((removedData ?? []) as DeletionLogEntry[]).filter((entry) =>
    matchesSearch(query, [entry.family_name, entry.family_email, ...entry.wrestlers.map((w) => w.name)])
  )

  const countsByParent = new Map<string, { total: number; active: number }>()
  const wrestlerNamesByParent = new Map<string, string[]>()
  for (const a of (athletes ?? []) as Pick<Athlete, 'id' | 'parent_id' | 'active' | 'first_name' | 'last_name'>[]) {
    const entry = countsByParent.get(a.parent_id) ?? { total: 0, active: 0 }
    entry.total += 1
    if (a.active) entry.active += 1
    countsByParent.set(a.parent_id, entry)
    wrestlerNamesByParent.set(a.parent_id, [...(wrestlerNamesByParent.get(a.parent_id) ?? []), `${a.first_name} ${a.last_name}`])
  }

  type FamilyRow = Pick<Profile, 'id' | 'full_name' | 'email' | 'phone' | 'is_active' | 'sms_opt_in'>
  const allFamilies = (families ?? []) as FamilyRow[]
  const hasNoWrestlers = (family: FamilyRow) => (countsByParent.get(family.id)?.total ?? 0) === 0
  const emptyCount = allFamilies.filter(hasNoWrestlers).length
  // Search covers the parent and their wrestlers, so a child's name finds the family.
  const rows = allFamilies.filter(
    (family) =>
      (!emptyOnly || hasNoWrestlers(family)) &&
      matchesSearch(query, [family.full_name, family.email, family.phone, ...(wrestlerNamesByParent.get(family.id) ?? [])])
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">Families</h1>
          <p className="text-sm text-clw-gray">Parent accounts and their registered athletes.</p>
        </div>
        <AdminSearch
          initial={query}
          basePath="/admin/families"
          placeholder="Search parent, wrestler, email…"
          keep={emptyOnly ? { show: 'empty' } : removedOnly ? { show: 'removed' } : {}}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterLink href={query ? `/admin/families?q=${encodeURIComponent(query)}` : '/admin/families'} active={!emptyOnly && !removedOnly}>
          All families ({allFamilies.length})
        </FilterLink>
        <FilterLink
          href={`/admin/families?show=empty${query ? `&q=${encodeURIComponent(query)}` : ''}`}
          active={emptyOnly}
        >
          No wrestlers added ({emptyCount})
        </FilterLink>
        <FilterLink
          href={`/admin/families?show=removed${query ? `&q=${encodeURIComponent(query)}` : ''}`}
          active={removedOnly}
        >
          Removed ({removedData?.length ?? 0})
        </FilterLink>
        {emptyOnly && (
          <p className="w-full text-sm text-clw-gray">
            Accounts with no child on them: a family that stopped partway, a second login, a mistake, or a test.
          </p>
        )}
        {removedOnly && (
          <p className="w-full text-base text-clw-gray">
            Every family or wrestler removed from the site, for the club&rsquo;s records. Recorded automatically, including
            removals made outside the site.
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load families: {error.message}
        </p>
      )}

      {removedOnly && <RemovedList entries={removed} />}

      {!removedOnly && !error && rows.length === 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-clw-gray">{query || emptyOnly ? 'No families match this filter.' : 'No families have registered yet.'}</p>
        </div>
      )}

      {!removedOnly && rows.length > 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">Family</TableHead>
                <TableHead className="text-clw-gray">Phone</TableHead>
                <TableHead className="text-clw-gray">Athletes</TableHead>
                <TableHead className="text-clw-gray">SMS</TableHead>
                <TableHead className="text-clw-gray">Status</TableHead>
                <TableHead className="w-[44px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((family) => {
                const counts = countsByParent.get(family.id) ?? { total: 0, active: 0 }
                return (
                  <TableRow key={family.id} className="border-clw-gold/10">
                    <TableCell>
                      <Link href={`/admin/families/${family.id}`} className="font-medium text-clw-white hover:text-clw-gold">
                        {family.full_name ?? 'Unnamed parent'}
                      </Link>
                      <span className="block text-xs text-clw-gray/70">{family.email ?? '—'}</span>
                    </TableCell>
                    <TableCell className="text-clw-gray">{family.phone ?? '—'}</TableCell>
                    <TableCell className="text-clw-gray">
                      {counts.total === 0 ? '—' : `${counts.active} active / ${counts.total} total`}
                    </TableCell>
                    <TableCell>
                      {family.sms_opt_in ? (
                        <Badge variant="outline" className="border-clw-gold/40 bg-clw-gold/10 text-clw-gold">
                          opted in
                        </Badge>
                      ) : (
                        <span className="text-clw-gray/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          family.is_active
                            ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                            : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                        }
                      >
                        {family.is_active ? 'active' : 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/families/${family.id}`} className="text-clw-gray hover:text-clw-gold">
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">View {family.full_name}</span>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full border border-clw-gold/40 bg-clw-gold/10 px-3 py-1 text-sm text-clw-gold'
          : 'rounded-full border border-clw-gold/10 px-3 py-1 text-sm text-clw-gray hover:text-clw-gold'
      }
    >
      {children}
    </Link>
  )
}

const VIA_LABELS: Record<string, string> = {
  site: 'Delete permanently on the site',
  admin: 'An admin, outside the Families page',
  parent: 'The parent, from their account',
  unknown: 'Not recorded',
}

function RemovedList({ entries }: { entries: DeletionLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
        <p className="text-base text-clw-gray">Nothing has been removed since the club started keeping this record.</p>
      </div>
    )
  }
  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-md border border-clw-gold/10 bg-clw-black p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            {/* A div, not a p: Badge renders a div, which a p cannot hold. */}
            <div className="flex flex-wrap items-center gap-2 text-base font-medium text-clw-white">
              {entry.kind === 'family' ? 'Family removed' : 'Wrestler removed'}: {entry.family_name ?? 'Unnamed parent'}
              {entry.had_registration && (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                  was registered
                </Badge>
              )}
            </div>
            <p className="text-sm text-clw-gray">
              {new Date(entry.deleted_at).toLocaleString('en-US', {
                timeZone: 'America/Chicago',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
          {entry.family_email && <p className="text-sm text-clw-gray/70">{entry.family_email}</p>}
          <p className="mt-2 text-base text-clw-gray">
            {entry.wrestlers.length
              ? entry.wrestlers
                  .map((w) => `${w.name}${w.registered ? ` (registered${w.status ? `, ${w.status}` : ''})` : ''}`)
                  .join(' · ')
              : 'No wrestlers on the account'}
          </p>
          <p className="mt-1 text-sm text-clw-gray">
            By {entry.deleted_by_name ?? 'unknown'} · {VIA_LABELS[entry.via] ?? 'Outside the site (Supabase dashboard or SQL)'}
          </p>
          {entry.note && <p className="mt-1 text-sm text-clw-gray/70">{entry.note}</p>}
        </li>
      ))}
    </ul>
  )
}
