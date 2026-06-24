import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Athlete, Profile } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FamilySearch } from './FamilySearch'

export default async function AdminFamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? '').trim()

  const supabase = createAdminSupabase()

  let familiesQuery = supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, sms_opt_in')
    .eq('role', 'parent')
    .order('full_name', { ascending: true })

  if (query) {
    familiesQuery = familiesQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
  }

  const [{ data: families, error }, { data: athletes }] = await Promise.all([
    familiesQuery,
    supabase.from('athletes').select('id, parent_id, active'),
  ])

  const countsByParent = new Map<string, { total: number; active: number }>()
  for (const a of (athletes ?? []) as Pick<Athlete, 'id' | 'parent_id' | 'active'>[]) {
    const entry = countsByParent.get(a.parent_id) ?? { total: 0, active: 0 }
    entry.total += 1
    if (a.active) entry.active += 1
    countsByParent.set(a.parent_id, entry)
  }

  type FamilyRow = Pick<Profile, 'id' | 'full_name' | 'email' | 'phone' | 'is_active' | 'sms_opt_in'>
  const rows = (families ?? []) as FamilyRow[]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">Families</h1>
          <p className="text-sm text-clw-gray">Parent accounts and their registered athletes.</p>
        </div>
        <FamilySearch initial={query} />
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load families: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-clw-gray">{query ? `No families match “${query}”.` : 'No families have registered yet.'}</p>
        </div>
      )}

      {rows.length > 0 && (
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
