import { ExternalLink } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import type { Tournament } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TournamentDialog } from './TournamentDialog'
import { DeleteTournamentButton } from './DeleteTournamentButton'

const STATUS_STYLES: Record<Tournament['status'], string> = {
  open: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold',
  closed: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
  cancelled: 'border-red-500/40 bg-red-500/10 text-red-400',
}

function formatDate(value: string) {
  // DATE columns are 'YYYY-MM-DD'; anchor to midnight local so the day doesn't
  // shift across timezones.
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminTournamentsPage() {
  const supabase = await createServerSupabase()
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('date', { ascending: false })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">Tournaments</h1>
          <p className="text-sm text-clw-gray">Manage the club tournament schedule.</p>
        </div>
        <TournamentDialog />
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load tournaments: {error.message}
        </p>
      )}

      {!error && (!tournaments || tournaments.length === 0) && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-clw-gray">No tournaments yet. Add the first one to get started.</p>
        </div>
      )}

      {tournaments && tournaments.length > 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">Name</TableHead>
                <TableHead className="text-clw-gray">Date</TableHead>
                <TableHead className="text-clw-gray">Location</TableHead>
                <TableHead className="text-clw-gray">Groups</TableHead>
                <TableHead className="text-clw-gray">Status</TableHead>
                <TableHead className="text-clw-gray">Reg.</TableHead>
                <TableHead className="w-[88px] text-right text-clw-gray">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((t) => (
                <TableRow key={t.id} className="border-clw-gold/10">
                  <TableCell className="font-medium text-clw-white">{t.name}</TableCell>
                  <TableCell className="text-clw-gray">{formatDate(t.date)}</TableCell>
                  <TableCell className="text-clw-gray">
                    {t.location}
                    <span className="block text-xs text-clw-gray/70">
                      {t.city}, {t.state}
                    </span>
                  </TableCell>
                  <TableCell className="text-clw-gray">
                    {t.practice_groups.length === 0 ? 'All' : t.practice_groups.join(', ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_STYLES[t.status]}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.external_registration_url ? (
                      <a
                        href={t.external_registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-clw-gold hover:underline"
                      >
                        Link <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-clw-gray/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <TournamentDialog tournament={t} />
                      <DeleteTournamentButton id={t.id} name={t.name} />
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
