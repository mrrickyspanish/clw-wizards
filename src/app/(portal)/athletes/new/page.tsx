import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { AddAthleteForm } from '../AddAthleteForm'

function safeRedirect(value: string | undefined) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/athletes'
}

export default async function NewAthletePage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo } = await searchParams
  const destination = safeRedirect(redirectTo)

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href={destination} className="inline-flex items-center gap-1 text-sm text-clw-gray hover:text-clw-gold-ink">
        <ChevronLeft className="h-4 w-4" /> {destination === '/registration' ? 'Back to registration' : 'Back to wrestlers'}
      </Link>
      <div>
        <h1 className="font-display text-3xl text-clw-gold-ink">Add a wrestler</h1>
        <p className="mt-1 text-sm text-clw-gray">
          Add the wrestler profile once, then reuse it for season registration and tournaments.
        </p>
      </div>
      <div className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
        <AddAthleteForm redirectTo={destination} />
      </div>
    </div>
  )
}
