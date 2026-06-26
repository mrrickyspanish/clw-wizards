import type { Tournament } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Reveal } from './Reveal'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function UpcomingTournaments({ tournaments }: { tournaments: Tournament[] }) {
  return (
    <section id="tournaments" className="scroll-mt-20 border-b border-clw-gold/10 bg-clw-black-2">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <h2 className="font-display text-4xl text-clw-gold">Upcoming tournaments</h2>
        </Reveal>
        {tournaments.length === 0 ? (
          <p className="mt-4 text-clw-gray">No upcoming tournaments are posted right now. Check back soon.</p>
        ) : (
          <div className="mt-8 space-y-3">
            {tournaments.map((t, i) => (
              <Reveal key={t.id} delay={i * 70}>
              <Card className="lift border-clw-gold/10 bg-clw-black">
                <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
                  <div>
                    <p className="font-medium text-clw-white">{t.name}</p>
                    <p className="text-sm text-clw-gray">
                      {t.location}, {t.city}, {t.state}
                    </p>
                  </div>
                  <p className="text-sm text-clw-gold">{formatDate(t.date)}</p>
                </CardContent>
              </Card>
              </Reveal>
            ))}
          </div>
        )}
        <p className="mt-6 text-sm text-clw-gray">
          Members can register from the <span className="text-clw-gold">parent portal</span> after signing in.
        </p>
      </div>
    </section>
  )
}
