import { Award, History, UserCheck, Users } from 'lucide-react'

const STATS = [
  { label: 'Active wrestlers', value: '120+', icon: Users },
  { label: 'Years running', value: '40+', icon: History },
  { label: 'Ages welcome', value: '5-14', icon: UserCheck },
  { label: 'Affiliated league', value: 'IKWF', icon: Award },
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
