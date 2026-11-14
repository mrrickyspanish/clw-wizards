'use client'

import { Download, Printer } from 'lucide-react'

import { rosterCsv } from '@/lib/tw-roster'
import { Button } from '@/components/ui/button'

type Row = { division: string | null; weight: string | null; wrestler: string; externalName: string; paid: boolean }

// Print and spreadsheet copies of the roster, for coaches.
export function RosterTools({ tournament, rows }: { tournament: { name: string; date: string }; rows: Row[] }) {
  function download() {
    const blob = new Blob([rosterCsv(tournament, rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tournament.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')}-roster.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row print:hidden">
      <Button type="button" variant="outline" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" /> Print for coaches
      </Button>
      <Button type="button" variant="outline" onClick={download}>
        <Download className="mr-2 h-4 w-4" /> Download spreadsheet
      </Button>
    </div>
  )
}
