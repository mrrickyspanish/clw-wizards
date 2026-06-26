import { Award, Trophy, UserCheck, Users } from 'lucide-react'

// Editorial club stats, not a live query — there is no coaches/results table
// yet. Update these by hand as the season's numbers change.
const STATS = [
  { label: 'Active wrestlers', value: '120+', icon: Users },
  { label: 'Dedicated coaches', value: '18', icon: UserCheck },
  { label: 'Tournament wins', value: '43', icon: Trophy },
  { label: 'State qualifiers', value: '6', icon: Award },
]

export function ClubNumbers() {
  return (
    <div className="chamfer-md card-depth flex h-full flex-col border border-clw-gold/10 bg-clw-black-2 p-6">
      <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Club by the numbers</h2>
      <div className="mt-5 grid flex-1 grid-cols-2 gap-3">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-md border border-clw-gold/10 bg-clw-black/40 p-3">
            <Icon className="h-4 w-4 text-clw-gold-ink" />
            <p className="mt-2 font-display text-2xl text-clw-white">{value}</p>
            <p className="text-xs text-clw-gray">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
