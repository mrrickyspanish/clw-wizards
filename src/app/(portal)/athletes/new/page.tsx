import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { AddAthleteForm } from '../AddAthleteForm'

export default function NewAthletePage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/athletes" className="inline-flex items-center gap-1 text-sm text-clw-gray hover:text-clw-gold-ink">
        <ChevronLeft className="h-4 w-4" /> Back to wrestlers
      </Link>
      <div>
        <h1 className="font-display text-3xl text-clw-gold-ink">Add a wrestler</h1>
        <p className="mt-1 text-sm text-clw-gray">Add your wrestler to register for practices and tournaments.</p>
      </div>
      <div className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
        <AddAthleteForm />
      </div>
    </div>
  )
}
