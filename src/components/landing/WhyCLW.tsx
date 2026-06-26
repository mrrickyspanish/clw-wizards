import { CheckCircle2 } from 'lucide-react'

const POINTS = [
  'USA Wrestling certified',
  'Experienced state-level coaching',
  'Technique, character, and team focus',
  'Family first. Wizard proud.',
]

export function WhyCLW() {
  return (
    <div className="chamfer-md card-depth flex h-full flex-col border border-clw-gold/10 bg-clw-black-2 p-6">
      <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Why CLW</h2>
      <ul className="mt-4 flex-1 space-y-3">
        {POINTS.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm text-clw-gray">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-clw-gold-ink" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-clw-gold/10 pt-4 text-xs text-clw-gray">
        Families register, manage wrestlers, and handle dues from one parent portal.
      </p>
    </div>
  )
}
