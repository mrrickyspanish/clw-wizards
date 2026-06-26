import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Practice } from '@/types/database'
import { WEEKDAYS, formatTime } from '@/lib/practice'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PracticeDialog } from './PracticeDialog'
import { DeletePracticeButton } from './DeletePracticeButton'

export default async function AdminPracticesPage() {
  const supabase = createAdminSupabase()
  const { data: practices, error } = await supabase
    .from('practices')
    .select('*')
    .order('weekday', { ascending: true })
    .order('start_time', { ascending: true })

  const rows = (practices ?? []) as Practice[]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">Practices</h1>
          <p className="text-sm text-clw-gray">The recurring weekly practice schedule parents see.</p>
        </div>
        <PracticeDialog />
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load practices: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-clw-gray">No practices yet. Add the weekly schedule to get started.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">Day</TableHead>
                <TableHead className="text-clw-gray">Time</TableHead>
                <TableHead className="text-clw-gray">Group</TableHead>
                <TableHead className="text-clw-gray">Location</TableHead>
                <TableHead className="text-clw-gray">Status</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} className="border-clw-gold/10">
                  <TableCell className="font-medium text-clw-white">{WEEKDAYS[p.weekday]}</TableCell>
                  <TableCell className="text-clw-gray">
                    {formatTime(p.start_time)}
                    {p.end_time ? ` - ${formatTime(p.end_time)}` : ''}
                  </TableCell>
                  <TableCell className="text-clw-gray">{p.practice_group}</TableCell>
                  <TableCell className="text-clw-gray">{p.location}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        p.active
                          ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                          : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                      }
                    >
                      {p.active ? 'active' : 'inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <PracticeDialog practice={p} />
                      <DeletePracticeButton id={p.id} label={`${WEEKDAYS[p.weekday]} ${formatTime(p.start_time)}`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
