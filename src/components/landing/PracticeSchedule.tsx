import Link from 'next/link'
import { CalendarDays, Lock } from 'lucide-react'

/**
 * Where practice times are (Ricky, Oct 30): in the parent portal only. A
 * public schedule says when groups of kids will be at a known address, so the
 * Groups page points families to it instead of listing times.
 */
export function PracticeSchedule() {
  return (
    <section id="schedule" className="mt-6 scroll-mt-44 chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:p-10">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-clw-gold" />
        <p className="font-cond text-sm uppercase tracking-[0.26em] text-clw-gold">Practice Schedule</p>
      </div>
      <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] text-clw-white sm:text-5xl">
        Practice times are in the parent portal
      </h2>
      <p className="mt-4 flex max-w-2xl items-start gap-2 text-lg leading-relaxed text-clw-gray">
        <Lock className="mt-1.5 h-5 w-5 shrink-0 text-clw-gold" />
        For our wrestlers&apos; safety, the practice calendar is only shown to club families and coaches. Log in to see
        every practice by date, and the days there is no practice.
      </p>
      <Link
        href="/schedule"
        className="mt-6 inline-flex min-h-11 items-center bg-clw-gold px-6 font-cond text-base font-semibold uppercase tracking-[0.12em] text-clw-black hover:bg-clw-gold-l"
      >
        Log in to see practices
      </Link>
      <p className="mt-6 text-base text-clw-gray">
        Not sure which group your wrestler is in? Coaches place each wrestler at the start of the season.
      </p>
    </section>
  )
}
