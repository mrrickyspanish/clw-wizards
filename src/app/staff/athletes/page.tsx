import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'
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

function ageFromDob(dob: string): number {
  const birth = new Date(`${dob}T00:00:00`)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}

export default async function StaffAthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  const { group } = await searchParams
  const activeGroup = group && ORG.practiceGroups.includes(group) ? group : null

  // Staff have RLS SELECT on athletes but not on other families' profiles, so
  // the family-name join needs the service-role client. This page is
  // middleware-gated to staff/admin, and only roster-appropriate fields are
  // surfaced.
  const supabase = createAdminSupabase()

  let athletesQuery = supabase
    .from('athletes')
    .select('id, first_name, last_name, date_of_birth, weight_class, practice_group, parent_id, active')
    .eq('active', true)
    .order('practice_group', { ascending: true })
    .order('last_name', { ascending: true })
  if (activeGroup) athletesQuery = athletesQuery.eq('practice_group', activeGroup)

  const { data: athletes, error } = await athletesQuery

  const rows = (athletes ?? []) as Pick<
    Athlete,
    'id' | 'first_name' | 'last_name' | 'date_of_birth' | 'weight_class' | 'practice_group' | 'parent_id' | 'active'
  >[]

  const parentIds = [...new Set(rows.map((r) => r.parent_id))]
  const { data: parents } = parentIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', parentIds)
    : { data: [] }
  const parentById = new Map(((parents ?? []) as Pick<Profile, 'id' | 'full_name'>[]).map((p) => [p.id, p]))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-clw-gold">Athletes</h1>
        <p className="text-sm text-clw-gray">Active club roster.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <GroupChip label="All groups" href="/staff/athletes" active={!activeGroup} />
        {ORG.practiceGroups.map((g) => (
          <GroupChip
            key={g}
            label={g}
            href={`/staff/athletes?group=${encodeURIComponent(g)}`}
            active={activeGroup === g}
          />
        ))}
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load roster: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-clw-gray">
            {activeGroup ? `No active athletes in ${activeGroup}.` : 'No active athletes yet.'}
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">Athlete</TableHead>
                <TableHead className="text-clw-gray">Group</TableHead>
                <TableHead className="text-clw-gray">Age</TableHead>
                <TableHead className="text-clw-gray">Weight</TableHead>
                <TableHead className="text-clw-gray">Family</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id} className="border-clw-gold/10">
                  <TableCell className="font-medium text-clw-white">
                    {a.first_name} {a.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-clw-gold/40 bg-clw-gold/10 text-clw-gold">
                      {a.practice_group}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-clw-gray">{ageFromDob(a.date_of_birth)}</TableCell>
                  <TableCell className="text-clw-gray">{a.weight_class || '—'}</TableCell>
                  <TableCell className="text-clw-gray">{parentById.get(a.parent_id)?.full_name ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function GroupChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a
      href={href}
      className={
        active
          ? 'rounded-full border border-clw-gold/40 bg-clw-gold/10 px-3 py-1 text-sm text-clw-gold'
          : 'rounded-full border border-clw-gold/10 px-3 py-1 text-sm text-clw-gray hover:text-clw-gold'
      }
    >
      {label}
    </a>
  )
}
