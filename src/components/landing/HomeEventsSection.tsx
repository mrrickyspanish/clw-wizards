import Link from 'next/link'

import type { Tournament } from '@/types/database'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(value: string | null) {
  if (!value) return 'TBD'
  const [hours = '0', minutes = '0'] = value.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function HomeEventsSection({ tournaments }: { tournaments: Tournament[] }) {
  const rows = tournaments.slice(0, 4)

  return (
    <section className="section-light relative overflow-hidden border-y border-clw-gold/35 bg-[#F7F7F7] px-5 py-14 text-clw-ink sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(180deg,rgba(255,255,255,.84),transparent_48%),radial-gradient(circle_at_12%_0%,rgba(240,192,32,.1),transparent_24%)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 select-none font-display text-[11rem] leading-none text-clw-gold-dim/[0.05] sm:text-[14rem] lg:text-[18rem]"
      >
        W
      </span>

      <div id="events" className="relative mx-auto max-w-7xl scroll-mt-24">
        <div className="lg:text-center">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-ink">Events</p>
          <h2 className="mt-6 max-w-3xl uppercase leading-[0.92] text-clw-ink lg:mx-auto lg:max-w-none">
            <span className="block font-cond text-[clamp(3rem,12vw,5rem)] font-light tracking-[-0.04em]">
              Upcoming
            </span>
            <span className="block font-display text-[clamp(3.4rem,13vw,5.6rem)] font-black tracking-[-0.035em]">
              Club Events
            </span>
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="mt-10 border border-dashed border-clw-ink/25 bg-white p-7 sm:p-8">
            <p className="font-display text-3xl uppercase leading-none text-clw-ink">No upcoming events posted yet.</p>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-clw-muted-dark">
              Once dates are added to the calendar, the next tournaments, fundraisers, and club updates will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {rows.map((event, index) => {
              const href = event.external_registration_url || '/login'
              return (
                <Link
                  key={event.id}
                  href={href}
                  target={event.external_registration_url ? '_blank' : undefined}
                  rel={event.external_registration_url ? 'noopener noreferrer' : undefined}
                  className={`group flex min-h-[230px] flex-col border border-clw-ink/45 bg-white shadow-xl shadow-clw-black/5 transition hover:-translate-y-1 hover:border-clw-gold ${index > 2 ? 'hidden xl:flex' : ''}`}
                >
                  <div className="flex flex-1 flex-col px-6 py-5 sm:px-7">
                    <h3 className="font-body text-2xl font-semibold leading-tight text-clw-ink xl:text-[1.35rem]">
                      {event.name}
                    </h3>
                    <div className="mt-3 h-px w-full bg-clw-gold" />

                    <div className="mt-4 space-y-2.5 text-clw-ink">
                      <div>
                        <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-ink/75">When</p>
                        <p className="mt-1 text-base font-semibold leading-tight sm:text-lg xl:text-base">{formatDate(event.date)}</p>
                      </div>
                      <div>
                        <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-ink/75">Time</p>
                        <p className="mt-1 text-base font-semibold leading-tight sm:text-lg xl:text-base">{formatTime(event.start_time)}</p>
                      </div>
                      <div>
                        <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-ink/75">Where</p>
                        <p className="mt-1 text-base font-semibold leading-tight sm:text-lg xl:text-base">
                          {event.location || `${event.city}, ${event.state}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-clw-black px-6 py-3 text-center font-display text-lg uppercase tracking-wide text-clw-white transition group-hover:bg-clw-gold group-hover:text-clw-black">
                    Learn more
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="lg:text-center">
          <Link href="/login" className="mt-8 inline-block font-cond text-xl uppercase tracking-[0.18em] text-clw-gold-ink underline-offset-4 hover:text-clw-ink hover:underline">
            View full calendar →
          </Link>
        </div>
      </div>
    </section>
  )
}
