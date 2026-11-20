'use client'

import { Download, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { combinedRosterCsv, type CombinedRosterRow } from '../tournament-admin'

// Print and spreadsheet copies of the roster, for coaches: the pasted
// TrackWrestling list and the families who registered on our site.
export function RosterTools({ tournament, rows }: { tournament: { name: string; date: string }; rows: CombinedRosterRow[] }) {
  function download() {
    const blob = new Blob([combinedRosterCsv(tournament, rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tournament.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')}-roster.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="flex w-full flex-wrap gap-2 sm:w-auto print:hidden">
      <Button type="button" variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-2 sm:w-auto" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4 shrink-0" /> Print
      </Button>
      <Button type="button" variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-2 sm:w-auto" onClick={download}>
        <Download className="mr-2 h-4 w-4 shrink-0" /> Spreadsheet
      </Button>
    </div>
  )
}
