import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Eye } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { CHURCH_READ_ONLY } from '@/lib/demo-readonly'
import { CHURCH_MEMBER_VIEW, CHURCH_ROLES } from '@/lib/demo-roles'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

// The church demo's front door (RJ, Nov 17: no password). One button per staff
// role (SBC, Nov 20), each saying what that role can and can't do.
function ViewButton({ as, label, can, cannot }: { as: string; label: string; can: string; cannot?: string }) {
  return (
    <Link
      href={`/demo/enter?as=${as}`}
      prefetch={false}
      className="block min-h-20 rounded-xl border border-clw-gold/30 bg-clw-black-2 p-5 transition-colors hover:border-clw-gold hover:bg-clw-black-3"
    >
      <span className="block text-xl font-semibold text-clw-white">{label}</span>
      <span className="mt-1 block text-base text-clw-gray">
        <span className="font-semibold text-clw-gold">Can:</span> {can}
      </span>
      {cannot && (
        <span className="block text-base text-clw-gray">
          <span className="font-semibold text-clw-gold">Can&apos;t:</span> {cannot}
        </span>
      )}
    </Link>
  )
}

export default async function DemoEntryPage({ searchParams }: { searchParams: Promise<{ unavailable?: string }> }) {
  if (!CHURCH_READ_ONLY) notFound()
  const { unavailable } = await searchParams
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center gap-8 bg-clw-black px-4 py-12">
      <header className="space-y-3">
        <p className="font-cond text-base uppercase tracking-[0.2em] text-clw-gold">{ORG.name}</p>
        <h1 className="font-display text-5xl uppercase leading-none text-clw-white sm:text-6xl">Staff Dashboard</h1>
        <p className="text-lg text-clw-gray">
          A working demo with sample data only. Pick a role to see the dashboard as that person would. Changes are not
          saved.
        </p>
      </header>
      {unavailable && (
        <p className="rounded-lg border border-clw-gold/40 bg-clw-black-2 p-4 text-base text-clw-white">
          That view isn&apos;t available right now. Please try again in a moment.
        </p>
      )}
      <section className="space-y-4">
        <h2 className="font-display text-3xl uppercase text-clw-gold">Staff views</h2>
        <ul className="space-y-3">
          {CHURCH_ROLES.map((role) => (
            <li key={role.key}>
              <ViewButton as={role.key} label={role.label} can={role.can} cannot={role.cannot} />
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-display text-3xl uppercase text-clw-gold">
          <Eye className="h-6 w-6" aria-hidden /> Member view
        </h2>
        <ViewButton as={CHURCH_MEMBER_VIEW.key} label="View as a Member" can={CHURCH_MEMBER_VIEW.can} />
      </section>
    </main>
  )
}
