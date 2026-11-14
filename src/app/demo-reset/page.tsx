import { notFound } from 'next/navigation'

import { DEMO_MODE } from '@/lib/demo'
import { DEMO_LOGINS } from '@/lib/demo-seed'
import { ResetForm } from './ResetForm'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

// Homefield demo only: put everything back to the starting state between takes.
export default function DemoResetPage() {
  if (!DEMO_MODE) notFound()
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-6 bg-clw-black px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-display text-clw-gold">Reset the demo</h1>
        <p className="text-base text-clw-gray">
          Wipes the demo database and reloads the invented families, wrestlers, practices and tournaments. Every login
          below uses the demo password.
        </p>
        <ul className="text-base text-clw-white">
          <li>Parent: {DEMO_LOGINS.parent}</li>
          <li>Full admin: {DEMO_LOGINS.admin}</li>
          <li>Limited admin: {DEMO_LOGINS.staff}</li>
        </ul>
      </div>
      <ResetForm />
    </main>
  )
}
