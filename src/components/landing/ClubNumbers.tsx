import { Award, Trophy, UserCheck, Users } from 'lucide-react'

const STATS = [
  { label: 'Active wrestlers', value: '120+', icon: Users },
  { label: 'Dedicated coaches', value: '18', icon: UserCheck },
  { label: 'Tournament wins', value: '43', icon: Trophy },
  { label: 'State qualifiers', value: '6', icon: Award },
]

export function ClubNumbers() {
  return (
    <div className="chamfer-md card-depth flex h-full flex-col border border-clw-gold/20 bg-clw-black-2 p-7">
      <h2 className="font-display text-4xl uppercase tracking-wide text-clw-white">Club by the numbers</h2>
      <div className="mt-6 grid flex-1 grid-cols-2 gap-3.5">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-md border border-clw-gold/20 bg-clw-black/55 p-4">
            <Icon className="h-5 w-5 text-clw-gold-ink" />
            <p className="mt-2 font-display text-4xl leading-none text-clw-white">{value}</p>
            <p className="mt-1 text-sm leading-snug text-clw-gray">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
