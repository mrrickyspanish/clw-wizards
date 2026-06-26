import { ORG } from '@/config/org.config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Reveal } from './Reveal'

// Short blurbs per group; falls back to a generic line for any group without
// one so adding a group in config never leaves an empty card.
const GROUP_BLURBS: Record<string, string> = {
  Black: 'Our most competitive group: experienced wrestlers training for travel and high-level tournaments.',
  Gold: 'Developing competitors building technique and mat time at regional events.',
  White: 'New and younger wrestlers learning the fundamentals in a fun, encouraging setting.',
  'Wizard for Life': 'Alumni and lifelong members who keep the Wizards community going.',
}

// Left-edge accent per group for visual variation (taste rule 4.7), tied to
// each group's own name where it maps to a color.
const GROUP_ACCENTS: Record<string, string> = {
  Black: 'border-l-clw-white/40',
  Gold: 'border-l-clw-gold',
  White: 'border-l-clw-white',
  'Wizard for Life': 'border-l-clw-gold/50',
}

export function PracticeGroups() {
  return (
    <section id="groups" className="scroll-mt-20 border-b border-clw-gold/10 bg-clw-black">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <Reveal>
          <h2 className="font-display text-4xl text-clw-gold">Practice groups</h2>
          <p className="mt-2 text-clw-gray">A place for every wrestler, whatever their level.</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ORG.practiceGroups.map((group, i) => (
            <Reveal key={group} delay={i * 80}>
              <Card className={`lift h-full border-l-4 border-clw-gold/10 bg-clw-black-2 ${GROUP_ACCENTS[group] ?? 'border-l-clw-gold'}`}>
                <CardHeader>
                  <CardTitle className="text-clw-white">{group}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-clw-gray">
                    {GROUP_BLURBS[group] ?? 'A training group within the club.'}
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
