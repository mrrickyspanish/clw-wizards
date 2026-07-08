/**
 * Mission-control hero: full-bleed horizontally like a premium sports landing
 * page. The text stays on a safe internal grid while the media and panel chrome
 * run edge to edge.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-clw-gold/10 bg-clw-black lg:pt-[72px]">
      <div className="relative flex min-h-[648px] overflow-hidden bg-clw-black-2 lg:h-[calc(100vh-72px)] lg:min-h-[616px] lg:max-h-[900px]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- real club team photo */}
          <img
            src="/images/real/clw-wizards-hero-photo-2.jpg"
            alt=""
            aria-hidden
            className="animate-kenburns absolute inset-0 h-full w-full object-cover opacity-90 lg:hidden"
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

          <div
            aria-hidden
            className="absolute inset-0 hidden opacity-[0.045] mix-blend-soft-light lg:block"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, rgba(255,255,255,.5) 0 .4px, transparent .6px), radial-gradient(circle at 75% 65%, rgba(0,0,0,.6) 0 .45px, transparent .65px)',
              backgroundSize: '3px 3px, 4px 4px',
            }}
          />

          <video
            className="absolute inset-0 h-full w-full object-cover opacity-95 lg:hidden"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero.jpg"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-clw-black-2/80 via-clw-black-2/45 to-clw-black/5 lg:hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-clw-black-2/75 via-clw-black/10 to-clw-black/10 lg:hidden" />
        </div>

        <div className="relative z-10 flex max-w-4xl flex-col justify-end px-5 pb-12 pt-28 sm:px-8 lg:min-h-[616px] lg:w-[42%] lg:max-w-none lg:items-start lg:justify-center lg:px-12 lg:py-0 lg:text-left xl:w-[44%] xl:px-16 2xl:w-[46%] 2xl:px-20">
          <p className="mb-4 font-cond text-xs uppercase tracking-[0.34em] text-clw-gold sm:text-sm lg:hidden">
            Wizards Wrestling • McHenry County
          </p>
          <h1 className="max-w-3xl font-display text-[5.625rem] uppercase leading-[0.88] text-clw-white sm:text-[6.75rem] md:mt-0 lg:max-w-none lg:font-impact lg:text-[6.625rem] lg:font-black lg:leading-[0.82] xl:text-[8.125rem] 2xl:text-[9.5rem]">
            <span className="block">Work.</span>
            <span className="block">Compete.</span>
            <span className="block text-clw-gold">Repeat.</span>
          </h1>
        </div>
      </div>
    </section>
  )
}
