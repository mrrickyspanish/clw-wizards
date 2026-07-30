import { getSiteContent } from '@/lib/content/get'

/**
 * Mission-control hero: full-bleed horizontally like a premium sports landing
 * page. The text stays on a safe internal grid while the media and panel chrome
 * run edge to edge.
 */
export async function Hero() {
  const content = await getSiteContent()
  const line1 = content.get('home.hero.line1')
  const line2 = content.get('home.hero.line2')
  const line3 = content.get('home.hero.line3')
  const mobilePhoto = content.get('home.hero.photo')
  return (
    <section className="relative isolate overflow-hidden border-b border-clw-gold/10 bg-clw-black">
      <div className="relative flex min-h-[86svh] overflow-hidden bg-clw-black-2 sm:min-h-[620px] lg:h-[calc(100vh-104px)] lg:min-h-[616px] lg:max-h-[900px]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- real club team photo */}
          <img
            src={mobilePhoto}
            alt=""
            aria-hidden
            className="animate-kenburns absolute inset-0 h-full w-full object-cover object-[57%_26%] lg:hidden"
          />

          {/* eslint-disable-next-line @next/next/no-img-element -- supplied desktop hero artwork */}
          <img
            src="/images/real/clw_wizards_hero_landscape.png"
            alt=""
            aria-hidden
            className="absolute inset-0 hidden h-full w-full object-cover object-center lg:block"
            style={{ filter: 'saturate(0.22) contrast(1.06) brightness(0.74)' }}
          />

          {/* eslint-disable-next-line @next/next/no-img-element -- registered cinematic focus pass */}
          <img
            src="/images/real/clw_wizards_hero_landscape.png"
            alt=""
            aria-hidden
            className="absolute inset-0 hidden h-full w-full object-cover object-center lg:block"
            style={{
              filter: 'saturate(0.72) contrast(1.06) brightness(0.94)',
              WebkitMaskImage:
                'radial-gradient(ellipse 42% 72% at 59% 55%, black 0%, black 42%, rgba(0,0,0,.82) 58%, transparent 100%)',
              maskImage:
                'radial-gradient(ellipse 42% 72% at 59% 55%, black 0%, black 42%, rgba(0,0,0,.82) 58%, transparent 100%)',
            }}
          />

          <div
            aria-hidden
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                'radial-gradient(ellipse at 59% 52%, transparent 34%, rgba(0,0,0,.08) 62%, rgba(0,0,0,.36) 100%)',
            }}
          />

          {/* Desktop keeps the original stronger left-side cinema fade because
              the headline occupies a dedicated left column. Mobile uses the
              lighter localized scrim below so the portrait photo stays open. */}
          <div
            aria-hidden
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                'linear-gradient(90deg, rgba(11,11,11,.92) 0%, rgba(11,11,11,.7) 30%, rgba(11,11,11,.2) 54%, transparent 70%)',
            }}
          />

          <div
            aria-hidden
            className="absolute inset-0 hidden opacity-[0.045] mix-blend-soft-light lg:block"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(255,255,255,.5) 0 .4px, transparent .6px), radial-gradient(circle at 75% 65%, rgba(0,0,0,.6) 0 .45px, transparent .65px)',
              backgroundSize: '3px 3px, 4px 4px',
            }}
          />

          {/* Keep only a light, localized left scrim for headline contrast. The
              bottom gradient does most of the legibility work so the arena and
              photo detail remain visible across the mobile frame. */}
          <div
            aria-hidden
            className="absolute inset-0 lg:hidden"
            style={{
              background:
                'linear-gradient(90deg, rgba(11,11,11,.42) 0%, rgba(11,11,11,.12) 38%, transparent 62%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-clw-black via-clw-black/30 to-clw-black/10 lg:hidden" />
        </div>

        <div className="relative z-10 flex max-w-4xl flex-col justify-end px-5 pb-28 pt-16 sm:px-8 sm:pb-24 lg:min-h-[616px] lg:w-[42%] lg:max-w-none lg:items-start lg:justify-center lg:px-12 lg:py-0 lg:text-left xl:w-[44%] xl:px-16 2xl:w-[46%] 2xl:px-20">
          <p className="mb-3 flex items-center gap-2.5 font-cond text-sm font-semibold uppercase tracking-[0.32em] text-clw-gold lg:mb-4 lg:text-base lg:tracking-[0.28em]">
            <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 shrink-0 fill-clw-gold">
              <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01z" />
            </svg>
            Wizards Wrestling Club
            <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 shrink-0 fill-clw-gold">
              <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01z" />
            </svg>
          </p>
          <h1 className="font-impact text-[7rem] font-black uppercase leading-[0.82] tracking-normal text-clw-white sm:text-[8rem] lg:max-w-none lg:text-[6.625rem] xl:text-[8.125rem] 2xl:text-[9.5rem]">
            <span className="block">{line1}</span>
            <span className="block">{line2}</span>
            <span className="block text-clw-gold">{line3}</span>
          </h1>
        </div>
      </div>
    </section>
  )
}
