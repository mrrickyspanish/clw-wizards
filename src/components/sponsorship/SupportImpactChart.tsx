// Written in the active voice on purpose. Every row used to open with "Can
// help provide", which reads as hedging to a donor who already understands
// that a club spends its money on the club. The single line under the table
// carries the honest caveat once, so the rows do not have to apologise six
// times over.
const IMPACT_ROWS = [
  {
    amount: '$25',
    category: 'Practice Essentials',
    description: 'Buys tape, cleaning supplies, hydration, first-aid, and the everyday things a working room runs through.',
  },
  {
    amount: '$50',
    category: 'Competition Access',
    description: 'Covers a tournament registration fee, or another competition-day expense, for a wrestler.',
  },
  {
    amount: '$100',
    category: 'Athlete Gear',
    description: 'Puts club gear and practice equipment in a wrestler’s hands, or covers several tournament entries.',
  },
  {
    amount: '$250',
    category: 'Family Support',
    description: 'Offsets travel, team-event costs, and access needs for multiple Wizards families.',
  },
  {
    amount: '$500',
    category: 'Development',
    description: 'Funds an athlete scholarship, coaching education, camp fees, or durable training equipment.',
  },
  {
    amount: '$1,000+',
    category: 'Room Investment',
    description: 'Funds major equipment, facility improvements, and season-long access for the club.',
  },
]

type SupportImpactChartProps = {
  eyebrow?: string
  title?: string
  intro?: string
  compact?: boolean
}

export function SupportImpactChart({
  eyebrow = 'Donation Impact',
  title = 'What your support does',
  intro = 'Every gift stays in the program. Here is where it goes across the season.',
  compact = false,
}: SupportImpactChartProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold-on-light">{eyebrow}</p>
        <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-ink">{title}</h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-relaxed text-clw-muted-dark sm:text-xl">{intro}</p>
      </div>

      <div className={`${compact ? 'mt-8' : 'mt-10 sm:mt-12'} overflow-hidden border border-clw-ink/20 bg-white shadow-xl shadow-black/5`}>
        <div className="hidden grid-cols-[10rem_minmax(0,1fr)_13rem] bg-clw-black px-6 py-4 font-cond text-sm font-semibold uppercase tracking-[0.18em] text-clw-white md:grid">
          <span>Contribution</span>
          <span>Where it goes</span>
          <span>Primary impact</span>
        </div>

        <div className="divide-y divide-clw-ink/12">
          {IMPACT_ROWS.map((row, index) => (
            <div
              key={row.amount}
              className="grid gap-3 px-5 py-5 sm:px-6 sm:py-6 md:grid-cols-[10rem_minmax(0,1fr)_13rem] md:items-center md:gap-6"
            >
              <div className="flex items-center justify-between gap-4 md:block">
                <p className="font-display text-3xl uppercase leading-none text-clw-gold-on-light sm:text-4xl">{row.amount}</p>
                <span className="bg-clw-black px-3 py-1.5 font-cond text-sm font-semibold uppercase tracking-[0.14em] text-clw-gold md:hidden">
                  {row.category}
                </span>
              </div>
              <p className="text-base font-medium leading-relaxed text-clw-ink/82 sm:text-lg">{row.description}</p>
              <div className="hidden items-center gap-3 md:flex">
                <span aria-hidden className={`h-9 w-1.5 ${index % 2 === 0 ? 'bg-clw-gold' : 'bg-clw-black'}`} />
                <span className="font-cond text-sm font-semibold uppercase tracking-[0.14em] text-clw-ink">{row.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The one caveat worth keeping: gifts fund the program, not a
          specific line item reserved for that donor. Stated once, plainly,
          instead of hedging every row above it. */}
      <p className="mt-4 text-center text-sm leading-relaxed text-clw-muted-dark/85">
        Costs and priorities shift across the season. Every dollar stays in the program.
      </p>
    </div>
  )
}
