import type { Metadata } from 'next'

import { pageMetadata } from '@/lib/page-metadata'
import { createPublicSupabase } from '@/lib/supabase/public'
import { ORG } from '@/config/org.config'
import type { Disclosure } from '@/types/database'

export const metadata: Metadata = pageMetadata({
  title: 'Agreements & Terms',
  description: `The agreements families sign when registering with ${ORG.name}, including the program waiver and release of all claims.`,
})

export const revalidate = 300

/**
 * The agreements families sign, published so they can be read before anyone
 * starts a registration — and re-read afterwards without digging through email.
 *
 * Rendered from the same `disclosures` rows the registration form signs against,
 * so this page and the waiver a parent actually agreed to can never drift apart.
 */
export default async function TermsPage() {
  const supabase = createPublicSupabase()
  const { data } = supabase
    ? await supabase.from('disclosures').select('*').eq('active', true).order('title')
    : { data: [] as Disclosure[] }

  const disclosures = (data ?? []) as Disclosure[]

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">Agreements</p>
      <h1 className="mt-4 font-display text-5xl uppercase leading-none text-clw-white sm:text-6xl">
        Terms &amp; Agreements
      </h1>
      <p className="mt-6 text-base leading-relaxed text-clw-gray">
        Every family signs these when registering a wrestler with {ORG.name}. They are reproduced here in full so you
        can read them before you begin, and return to them any time afterward. You sign them once per wrestler, per
        season, inside the parent portal.
      </p>

      {disclosures.length === 0 ? (
        <p className="mt-12 text-base leading-relaxed text-clw-gray">
          The club has not published its registration agreements yet. Contact{' '}
          <a href={`mailto:${ORG.contactEmail}`} className="text-clw-gold hover:underline">
            {ORG.contactEmail}
          </a>{' '}
          for a copy.
        </p>
      ) : (
        <div className="mt-12 space-y-12">
          {disclosures.map((disclosure) => (
            <section key={disclosure.id}>
              <h2 className="font-display text-3xl uppercase leading-none text-clw-white">{disclosure.title}</h2>
              <p className="mt-2 text-sm text-clw-gray">
                Version {disclosure.version}
                {disclosure.required ? ' · required to register' : ' · optional'}
              </p>
              <div className="mt-6 border-l-2 border-clw-gold/30 pl-6">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-clw-gray">{disclosure.body}</p>
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-16 text-sm leading-relaxed text-clw-gray">
        {ORG.name} is a registered 501(c)(3) nonprofit organization. EIN {ORG.ein}. Questions about these agreements can
        go to{' '}
        <a href={`mailto:${ORG.contactEmail}`} className="text-clw-gold hover:underline">
          {ORG.contactEmail}
        </a>
        .
      </p>
    </div>
  )
}
