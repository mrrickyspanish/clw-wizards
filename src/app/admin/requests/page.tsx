import Link from 'next/link'

import { createAdminSupabase } from '@/lib/supabase/admin'
import type { RequestLogEntry } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { AdminSearch } from '../AdminSearch'
import { matchesSearch } from '@/lib/search'

const STATUS: Record<RequestLogEntry['status'], { label: string; className: string }> = {
  done: { label: 'Done', className: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold' },
  waiting: { label: 'Waiting', className: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  open: { label: 'In progress', className: 'border-sky-500/40 bg-sky-500/10 text-sky-300' },
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>
}) {
  const { q, show } = await searchParams
  const query = (q ?? '').trim()
  const openOnly = show === 'open'

  // Missing table (migration not applied yet) reads as an empty history.
  const supabase = createAdminSupabase()
  const { data } = await supabase.from('request_log').select('*').order('received_at', { ascending: false }).limit(500)
  const all = (data ?? []) as RequestLogEntry[]
  const notDone = all.filter((entry) => entry.status !== 'done')
  const rows = all.filter(
    (entry) =>
      (!openOnly || entry.status !== 'done') &&
      matchesSearch(query, [entry.title, entry.outcome, entry.from_name, entry.waiting_on, ...entry.people])
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">Requests</h1>
          <p className="text-base text-clw-gray">What the club asked for, and what was done about it.</p>
        </div>
        <AdminSearch
          initial={query}
          basePath="/admin/requests"
          placeholder="Search name, wrestler, request…"
          keep={openOnly ? { show: 'open' } : {}}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterLink href={query ? `/admin/requests?q=${encodeURIComponent(query)}` : '/admin/requests'} active={!openOnly}>
          All ({all.length})
        </FilterLink>
        <FilterLink href={`/admin/requests?show=open${query ? `&q=${encodeURIComponent(query)}` : ''}`} active={openOnly}>
          Not finished ({notDone.length})
        </FilterLink>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-base text-clw-gray">
            {query || openOnly ? 'No requests match this filter.' : 'No requests recorded yet.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((entry) => (
            <li key={entry.id} className="rounded-md border border-clw-gold/10 bg-clw-black p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-base font-medium text-clw-white">
                  {entry.title}
                  <Badge variant="outline" className={STATUS[entry.status].className}>
                    {STATUS[entry.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-clw-gray">
                  {entry.from_name} ·{' '}
                  {new Date(entry.received_at).toLocaleDateString('en-US', {
                    timeZone: 'America/Chicago',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {entry.outcome && <p className="mt-2 whitespace-pre-line text-base text-clw-gray">{entry.outcome}</p>}
              {entry.status === 'waiting' && entry.waiting_on && (
                <p className="mt-2 text-base text-amber-300">Next step: {entry.waiting_on}</p>
              )}
            </li>
          ))}
        </ul>
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
          ? 'inline-flex min-h-11 items-center rounded-full border border-clw-gold/40 bg-clw-gold/10 px-4 text-sm text-clw-gold'
          : 'inline-flex min-h-11 items-center rounded-full border border-clw-gold/10 px-4 text-sm text-clw-gray hover:text-clw-gold'
      }
    >
      {children}
    </Link>
  )
}
