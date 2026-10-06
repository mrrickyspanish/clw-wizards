import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'

import { pageMetadata } from '@/lib/page-metadata'
import { ORG } from '@/config/org.config'
import { SMS_CONSENT_TEXT } from '@/lib/twilio/opt-in'
import { PolicySection } from '@/components/marketing/PolicySection'

export const metadata: Metadata = pageMetadata({
  title: 'SMS Terms',
  description: `Terms for text messages from ${ORG.name}: what we send, how often, how to opt in, and how to stop.`,
})

const EFFECTIVE_DATE = 'October 6, 2026'

/**
 * The text-message program terms carriers require, and the public record of how
 * families opt in. The opt-in checkbox itself sits behind sign-in, so this page
 * reproduces it with the exact wording parents see (SMS_CONSENT_TEXT), for the
 * carrier review of the club's number.
 */
export default function SmsTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">Text Messages</p>
      <h1 className="mt-4 font-display text-5xl uppercase leading-none text-clw-white sm:text-6xl">SMS Terms</h1>
      <p className="mt-6 text-base leading-relaxed text-clw-gray">
        These terms cover text messages from {ORG.name} (&ldquo;CLW Wizards&rdquo;). Effective {EFFECTIVE_DATE}.
      </p>

      <div className="mt-12 space-y-12">
        <PolicySection title="What we send">
          <p>
            CLW Wizards club alerts: practice updates and cancellations, tournament and weigh-in reminders, and dues
            reminders, sent to parents and guardians of registered wrestlers. We do not send marketing messages.
          </p>
        </PolicySection>

        <PolicySection title="How you opt in">
          <p>
            Text messages are optional. Parents and guardians opt in on this website by checking the box below, either
            when they set up their account or later under Contact &amp; SMS preferences on their account&rsquo;s Profile page. Texts go only to the
            mobile number they enter there. Signing up for the club does not require agreeing to texts.
          </p>
          <div className="rounded-md border border-clw-gold/25 bg-clw-black-2 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-clw-gold">The opt-in, as parents see it</p>
            <div className="mt-4 flex items-start gap-3">
              <span
                aria-hidden
                className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-clw-gold bg-clw-gold text-clw-black"
              >
                <Check className="h-4 w-4" />
              </span>
              <p className="text-base leading-relaxed text-clw-white">
                {SMS_CONSENT_TEXT} See our SMS Terms and Privacy Policy.
              </p>
            </div>
            <p className="mt-4 text-sm text-clw-gray">
              The box starts unchecked. Each opt-in is recorded with the date and the exact wording agreed to.
            </p>
          </div>
        </PolicySection>

        <PolicySection title="How often">
          <p>Message frequency varies, usually a few messages a month during the season.</p>
        </PolicySection>

        <PolicySection title="Cost">
          <p>Message and data rates may apply, depending on your mobile plan. The club does not charge for texts.</p>
        </PolicySection>

        <PolicySection title="How to stop">
          <p>
            Reply <span className="font-semibold text-clw-white">STOP</span> to any message to stop receiving texts. You
            will get one message confirming you have been unsubscribed, and no more after that. You can also uncheck the
            box under Contact &amp; SMS preferences on your Profile page. To start again, reply{' '}
            <span className="font-semibold text-clw-white">START</span>.
          </p>
        </PolicySection>

        <PolicySection title="Help">
          <p>
            Reply <span className="font-semibold text-clw-white">HELP</span> to any message for help, or email{' '}
            <a href={`mailto:${ORG.contactEmail}`} className="text-clw-gold hover:underline">
              {ORG.contactEmail}
            </a>
            .
          </p>
        </PolicySection>

        <PolicySection title="Carriers">
          <p>Mobile carriers are not liable for delayed or undelivered messages.</p>
        </PolicySection>

        <PolicySection title="Privacy">
          <p>
            No mobile information will be shared with third parties or affiliates for marketing or promotional
            purposes. See our{' '}
            <Link href="/privacy" className="text-clw-gold hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </PolicySection>
      </div>
    </div>
  )
}
