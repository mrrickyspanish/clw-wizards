import { CheckCircle2 } from 'lucide-react'

const POINTS = [
  'USA Wrestling certified club',
  'IKWF & Crystal Lake Park District affiliated',
  '501(c)(3) nonprofit, run by volunteers',
  'Family first. Wizard proud.',
]

export function WhyCLW() {
  return (
    <div className="chamfer-md flex h-full flex-col border border-black/10 bg-white p-7 shadow-xl shadow-black/5">
      <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold-ink">Trust</p>
      <h2 className="mt-4 font-display text-5xl uppercase leading-none tracking-wide text-clw-ink">Why CLW</h2>
      <ul className="mt-7 flex-1 space-y-4">
        {POINTS.map((point) => (
          <li key={point} className="flex items-start gap-3 border-t border-black/10 pt-4 text-lg leading-relaxed text-clw-muted-dark">
            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-clw-gold-ink" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-black/10 pt-6 text-lg leading-relaxed text-clw-muted-dark">
        Families register, manage wrestlers, and handle dues from one parent portal.
      </p>
    </div>
  )
}
