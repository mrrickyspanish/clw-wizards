import { SupportMedia } from './SupportMedia'

const FAQS = [
  ['Where does my donation go?', 'Donations support equipment, tournament costs, coaching resources, scholarships, travel support, and the day-to-day expenses that keep the club strong for every wrestler.'],
  ['Is my donation tax deductible?', 'Crystal Lake Wizards Wrestling Club is a nonprofit program. Please confirm tax details with the club and your tax professional before filing.'],
  ['Can I sponsor a specific wrestler?', 'Reach out to the club and we can talk through the best way to support athlete needs while keeping scholarship and assistance decisions fair for families.'],
  ['Do you accept corporate sponsors?', 'Yes. Local business sponsors can support the club through annual packages, event sponsorship, signage, website placement, and social media recognition.'],
  ['How do I volunteer?', 'Send us a message and tell us how you want to help. We need support at events, tournaments, fundraising efforts, communications, and club operations.'],
]

export function SupportCommunityDetails() {
  return (
    <>
      <section className="bg-clw-black px-7 py-16 text-clw-white sm:px-10 sm:py-20">
        <div className="mx-auto grid max-w-5xl overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-2xl shadow-black/25 lg:grid-cols-[1.1fr_.9fr]">
          <SupportMedia src="/images/real/facility_pano.jpg" alt="Crystal Lake Wizards practice facility" className="h-64 w-full lg:h-full lg:min-h-[420px]" position="center" dim="bg-clw-black/20" />
          <div className="px-7 py-10 text-left sm:p-10">
            <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Volunteer Support</p>
            <h2 className="mt-5 font-display text-5xl uppercase leading-none tracking-wide text-clw-white sm:text-6xl">Volunteer With Us</h2>
            <p className="mt-7 text-xl leading-relaxed text-clw-gray">
              The Wizards are powered by people who show up. Volunteers help with tournaments, fundraising, communications, setup, photography, team meals, and the small details that make a wrestling club feel like a real community.
            </p>
            <a href="#contact" className="mt-8 inline-block bg-clw-gold px-10 py-5 font-display text-xl uppercase tracking-wide text-clw-black transition hover:bg-clw-white">Become a Volunteer</a>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F7F7] px-7 py-16 text-clw-black sm:px-10 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-5xl uppercase leading-none text-clw-black">Questions</h2>
          <div className="mt-8 divide-y divide-clw-black/15 border-y border-clw-black/15">
            {FAQS.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer list-none font-display text-2xl uppercase text-clw-black marker:hidden">{question}</summary>
                <p className="mt-4 text-lg leading-relaxed text-clw-black/70">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
