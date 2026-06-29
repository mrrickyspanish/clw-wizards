import { FacebookFeedWithFallback } from '@/components/landing/FacebookFeedWithFallback'

const FACEBOOK_URL = 'https://www.facebook.com/pages/Wizards-Wrestling-Club/103467966667221'

export function HomeFacebookSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black px-5 py-14 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_16%_0%,rgba(240,192,32,.14),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />

      <div id="facebook" className="relative mx-auto grid max-w-7xl scroll-mt-24 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Social</p>
          <h2 className="mt-6 max-w-3xl uppercase leading-[0.92] text-clw-white">
            <span className="block font-cond text-[clamp(3rem,12vw,5rem)] font-light tracking-[-0.04em]">
              Follow us on
            </span>
            <span className="block font-display text-[clamp(3.4rem,13vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold">
              Facebook
            </span>
          </h2>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block font-cond text-xl uppercase tracking-[0.18em] text-clw-gold underline-offset-4 hover:text-clw-gold-l hover:underline"
          >
            Open Facebook page →
          </a>
        </div>

        <FacebookFeedWithFallback href={FACEBOOK_URL} />
      </div>
    </section>
  )
}
