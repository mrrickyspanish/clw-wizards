import type { Metadata } from 'next'
import Link from 'next/link'

import { pageMetadata } from '@/lib/page-metadata'
import { ORG } from '@/config/org.config'
import { PolicySection } from '@/components/marketing/PolicySection'

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description: `How ${ORG.name} collects, uses, and protects family and wrestler information, including mobile numbers used for club text messages.`,
})

const EFFECTIVE_DATE = 'October 6, 2026'

/**
 * The club's privacy policy. Text-message carriers (through Twilio) require a
 * public privacy policy stating that mobile numbers and text-message consent
 * are never shared or sold for marketing; that clause is in "Text messages".
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">Privacy</p>
      <h1 className="mt-4 font-display text-5xl uppercase leading-none text-clw-white sm:text-6xl">Privacy Policy</h1>
      <p className="mt-6 text-base leading-relaxed text-clw-gray">
        This policy explains what information {ORG.name} (&ldquo;the club,&rdquo; &ldquo;we&rdquo;) collects through this
        website, how we use it, and the choices you have. Effective {EFFECTIVE_DATE}.
      </p>

      <div className="mt-12 space-y-12">
        <PolicySection title="What we collect">
          <p>When a parent or guardian creates an account or registers a wrestler, we collect:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Parent and guardian names, email addresses, phone numbers, and mailing addresses.</li>
            <li>
              Wrestler details: name, date of birth, grade, school, weight, shirt size, experience, and emergency
              contacts.
            </li>
            <li>Documents you upload, such as a birth certificate or USA Wrestling membership card.</li>
            <li>Signed registration agreements, including the name typed as a signature and when it was signed.</li>
            <li>Whether you have agreed to receive text messages from the club, and when.</li>
          </ul>
          <p>
            Payments are processed by our payment provider. We see whether a payment was made and its amount, but we do
            not receive or store your card number.
          </p>
        </PolicySection>

        <PolicySection title="How we use it">
          <p>We use this information only to run the club:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>To register wrestlers, confirm eligibility, and keep rosters and emergency contacts.</li>
            <li>To collect dues and send receipts.</li>
            <li>
              To contact families about practices, tournaments, weigh-ins, dues, and other club business by email, and by
              text message if you have opted in.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="Who we share it with">
          <p>We do not sell personal information. We share it only:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              With service providers that run this website for us, such as hosting, payment processing, and email and
              text-message delivery. They may use it only to provide those services to the club.
            </li>
            <li>With club coaches and board members who need it to run the program.</li>
            <li>When required by law, or to protect the safety of our wrestlers.</li>
          </ul>
        </PolicySection>

        <PolicySection title="Text messages">
          <p>
            If you opt in, we send text messages about club activities. See our{' '}
            <Link href="/sms-terms" className="text-clw-gold hover:underline">
              SMS Terms
            </Link>{' '}
            for details, including how to stop them at any time by replying STOP.
          </p>
          <p className="text-clw-white">
            No mobile information will be shared with third parties or affiliates for marketing or promotional
            purposes. Text-message opt-in data and consent will not be shared with any third parties.
          </p>
          <p>
            Your mobile number is used only to send the club messages you agreed to receive, through the service
            provider that delivers them.
          </p>
        </PolicySection>

        <PolicySection title="Children">
          <p>
            Information about wrestlers is provided by their parents or guardians. Wrestlers do not create their own
            accounts, and we do not knowingly collect information directly from children.
          </p>
        </PolicySection>

        <PolicySection title="Keeping it safe">
          <p>
            Access to family records is limited to the family and to club staff who need it. Uploaded documents are
            stored privately and are not publicly viewable. No system is perfectly secure, but we take reasonable steps
            to protect your information.
          </p>
        </PolicySection>

        <PolicySection title="Your choices">
          <ul className="list-disc space-y-2 pl-6">
            <li>You can review and update your contact details and your wrestlers&rsquo; details in your account.</li>
            <li>You can stop text messages at any time by replying STOP, or by unchecking the box in your account.</li>
            <li>You can ask us to correct or delete your information by contacting us below.</li>
          </ul>
        </PolicySection>

        <PolicySection title="Contact us">
          <p>
            Questions about this policy? Email{' '}
            <a href={`mailto:${ORG.contactEmail}`} className="text-clw-gold hover:underline">
              {ORG.contactEmail}
            </a>{' '}
            or write to {ORG.name}, {ORG.mailingAddress}.
          </p>
          <p>We may update this policy. The effective date above shows when it last changed.</p>
        </PolicySection>
      </div>
    </div>
  )
}
