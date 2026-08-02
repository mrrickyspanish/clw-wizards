import { Clock3, Mail } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { DONATIONS_COMING_SOON_BODY, DONATIONS_COMING_SOON_TITLE } from '@/config/donations'
import { CTA_LINK } from '@/lib/cta'

/**
 * Stands in for a donation form while DONATIONS_ENABLED is false.
 *
 * Takes the form's place rather than hiding the section, so a visitor who came
 * to give learns why they can't and how to reach someone — an empty space would
 * read as a broken page.
 *
 * `light` matches the surrounding band, the same way DonationCheckoutForm
 * handles it: the marketing pages alternate dark and light sections.
 */
export function DonationsComingSoon({ light = false }: { light?: boolean }) {
  return (
    <div
      className={`chamfer-sm mt-6 border p-6 sm:mt-8 sm:p-8 ${
        light ? 'border-clw-ink/20 bg-white/70' : 'border-clw-gold/25 bg-clw-black-2'
      }`}
    >
      <div className="flex items-center gap-3">
        <Clock3 className={`h-6 w-6 ${light ? 'text-clw-gold-on-light' : 'text-clw-gold-ink'}`} />
        <h3
          className={`font-display text-2xl uppercase tracking-wide sm:text-3xl ${
            light ? 'text-clw-ink' : 'text-clw-white'
          }`}
        >
          {DONATIONS_COMING_SOON_TITLE}
        </h3>
      </div>

      <p className={`mt-4 text-base leading-relaxed ${light ? 'text-clw-ink/80' : 'text-clw-gray'}`}>
        {DONATIONS_COMING_SOON_BODY}
      </p>

      <a
        href={`mailto:${ORG.contactEmail}?subject=Supporting%20the%20Wizards`}
        className={`${CTA_LINK} mt-6 ${light ? 'text-clw-gold-on-light' : 'text-clw-gold'}`}
      >
        <Mail /> Contact the club
      </a>
    </div>
  )
}
