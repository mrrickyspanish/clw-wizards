import type { FaqItem } from '@/types/database'
import { FaqDialog } from './FaqDialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function FaqManager({ items }: { items: FaqItem[] }) {
  const nextSort = items.reduce((max, i) => Math.max(max, i.sort_order), 0) + 1

  return (
    <section className="rounded-md border border-clw-gold/10 bg-clw-black p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg uppercase tracking-wide text-clw-gold">Frequently asked questions</h2>
          <p className="text-sm text-clw-gray">The Q&amp;A accordion on the public FAQ page.</p>
        </div>
        <FaqDialog nextSort={nextSort} />
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-clw-gold/10 bg-clw-black-2 p-6 text-center text-sm text-clw-gray">
          No questions yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-clw-gold/10">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">#</TableHead>
                <TableHead className="text-clw-gray">Question</TableHead>
                <TableHead className="text-clw-gray">Status</TableHead>
                <TableHead className="text-clw-gray text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-clw-gold/10 align-top">
                  <TableCell className="text-clw-gray">{item.sort_order}</TableCell>
                  <TableCell>
                    <span className="font-medium text-clw-white">{item.question}</span>
                    <span className="mt-1 block max-w-xl truncate text-sm text-clw-gray/70">{item.answer}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.active
                          ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                          : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                      }
                    >
                      {item.active ? 'active' : 'hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <FaqDialog item={item} />
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
