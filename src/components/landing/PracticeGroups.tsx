import { ORG } from '@/config/org.config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Short blurbs per group; falls back to a generic line for any group without
// one so adding a group in config never leaves an empty card.
const GROUP_BLURBS: Record<string, string> = {
  Black: 'Our most competitive group — experienced wrestlers training for travel and high-level tournaments.',
  Gold: 'Developing competitors building technique and ring time at regional events.',
  White: 'New and younger wrestlers learning the fundamentals in a fun, encouraging setting.',
  'Wizard for Life': 'Alumni and lifelong members who keep the Wizards community going.',
}

export function PracticeGroups() {
  return (
    <section className="border-b border-clw-gold/10 bg-clw-black">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-3xl text-clw-gold">Practice groups</h2>
        <p className="mt-2 text-clw-gray">A place for every wrestler, whatever their level.</p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ORG.practiceGroups.map((group) => (
            <Card key={group} className="border-clw-gold/10 bg-clw-black-2">
              <CardHeader>
                <CardTitle className="text-clw-white">{group}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-clw-gray">
                  {GROUP_BLURBS[group] ?? 'A training group within the club.'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
