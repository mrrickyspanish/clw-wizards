import type { Coach } from '@/types/database'
import { CoachDialog } from './CoachDialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function CoachManager({ coaches }: { coaches: Coach[] }) {
  const nextSort = coaches.reduce((max, c) => Math.max(max, c.sort_order), 0) + 1

  return (
    <section className="rounded-md border border-clw-gold/10 bg-clw-black p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg uppercase tracking-wide text-clw-gold">Coaches &amp; staff</h2>
          <p className="text-sm text-clw-gray">
            The board/contacts and practice-room coaches on the public Coaches page.
          </p>
        </div>
        <CoachDialog nextSort={nextSort} />
      </div>

      {coaches.length === 0 ? (
        <p className="rounded-md border border-clw-gold/10 bg-clw-black-2 p-6 text-center text-sm text-clw-gray">
          No one on the roster yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-clw-gold/10">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">#</TableHead>
                <TableHead className="text-clw-gray">Name</TableHead>
                <TableHead className="text-clw-gray">Role / group</TableHead>
                <TableHead className="text-clw-gray">Section</TableHead>
                <TableHead className="text-clw-gray">Status</TableHead>
                <TableHead className="text-right text-clw-gray">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.map((c) => (
                <TableRow key={c.id} className="border-clw-gold/10 align-top">
                  <TableCell className="text-clw-gray">{c.sort_order}</TableCell>
                  <TableCell className="font-medium text-clw-white">{c.name}</TableCell>
                  <TableCell className="text-clw-gray">
                    {c.section === 'board' ? c.role || '—' : c.practice_group || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-clw-gold/25 bg-clw-gold/5 text-clw-gray">
                      {c.section === 'board' ? 'Board' : 'Practice'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.active
                          ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                          : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                      }
                    >
                      {c.active ? 'active' : 'hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CoachDialog coach={c} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
