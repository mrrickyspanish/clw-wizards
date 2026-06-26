import { CheckCircle2 } from 'lucide-react'

const POINTS = [
  'USA Wrestling certified',
  'Experienced state-level coaching',
  'Technique, character, and team focus',
  'Family first. Wizard proud.',
]

export function WhyCLW() {
  return (
    <div className="chamfer-md card-depth flex h-full flex-col border border-clw-gold/20 bg-clw-black-2 p-7">
      <h2 className="font-display text-4xl uppercase tracking-wide text-clw-white">Why CLW</h2>
      <ul className="mt-5 flex-1 space-y-3.5">
        {POINTS.map((point) => (
          <li key={point} className="flex items-start gap-3 text-base leading-relaxed text-clw-gray">
            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-clw-gold-ink" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-clw-gold/15 pt-5 text-sm leading-relaxed text-clw-gray">
        Families register, manage wrestlers, and handle dues from one parent portal.
      </p>
    </div>
  )
}
