import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Eye, ShieldCheck, Users } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { CHURCH_READ_ONLY, READ_ONLY_MESSAGE } from '@/lib/demo-readonly'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

// The church demo's front door (RJ, Nov 17): no password, three ways in.
const VIEWS = [
  { as: 'admin', label: 'View as Church Administrator', note: 'Full access: members, giving, website content, communications and the admin team.', Icon: ShieldCheck },
  { as: 'staff', label: 'View as Ministry Staff', note: 'Limited access: the day-to-day tools, without website content or the admin team.', Icon: Users },
  { as: 'member', label: 'View as a Member', note: 'What a church member sees when they sign in.', Icon: Eye },
] as const

export default async function DemoEntryPage({ searchParams }: { searchParams: Promise<{ unavailable?: string }> }) {
  if (!CHURCH_READ_ONLY) notFound()
  const { unavailable } = await searchParams
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col justify-center gap-8 bg-clw-black px-4 py-12">
      <header className="space-y-3">
        <p className="font-cond text-base uppercase tracking-[0.2em] text-clw-gold">{ORG.name}</p>
        <h1 className="font-display text-5xl uppercase leading-none text-clw-white sm:text-6xl">Staff Dashboard</h1>
        <p className="text-lg text-clw-gray">
          A working demo with sample data only. Choose a view to look around. {READ_ONLY_MESSAGE.replace('Read-only demo: c', 'C')}
        </p>
      </header>
      {unavailable && (
        <p className="rounded-lg border border-clw-gold/40 bg-clw-black-2 p-4 text-base text-clw-white">
          That view isn&apos;t available right now. Please try again in a moment.
        </p>
      )}
      <ul className="space-y-4">
        {VIEWS.map(({ as, label, note, Icon }) => (
          <li key={as}>
            <Link
              href={`/demo/enter?as=${as}`}
              prefetch={false}
              className="flex min-h-20 items-center gap-4 rounded-xl border border-clw-gold/30 bg-clw-black-2 p-5 transition-colors hover:border-clw-gold hover:bg-clw-black-3"
            >
              <Icon className="h-8 w-8 shrink-0 text-clw-gold" aria-hidden />
              <span className="space-y-1">
                <span className="block text-xl font-semibold text-clw-white">{label}</span>
                <span className="block text-base text-clw-gray">{note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
