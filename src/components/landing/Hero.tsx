/**
 * Mission-control hero: full-bleed horizontally like a premium sports landing
 * page. The text stays on a safe internal grid while the media and panel chrome
 * run edge to edge.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-clw-gold/10 bg-clw-black pt-24 md:pt-28">
      <div className="relative flex min-h-[480px] overflow-hidden bg-clw-black-2 lg:min-h-[616px]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- real club team photo */}
          <img
            src="/images/real/team_march2025.jpg"
            alt=""
            aria-hidden
            className="animate-kenburns absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-95"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero.jpg"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-clw-black-2/80 via-clw-black-2/45 to-clw-black/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-clw-black-2/75 via-clw-black/10 to-clw-black/10" />
        </div>

        <div className="relative z-10 flex max-w-4xl flex-col justify-end px-5 py-12 sm:px-8 lg:max-w-none lg:w-full lg:items-center lg:justify-center lg:px-12 lg:text-center xl:px-16 2xl:px-20 lg:min-h-[616px]">
          <p className="hidden font-cond text-sm uppercase tracking-[0.34em] text-clw-gold md:block lg:hidden">
            Crystal Lake Wizards Wrestling Club
          </p>
          <h1 className="max-w-3xl font-display text-[5.625rem] uppercase leading-[0.88] text-clw-white sm:text-[6.75rem] md:mt-4 lg:max-w-none lg:font-impact lg:font-black lg:text-[8.01rem] xl:text-[10.35rem] 2xl:text-[11.475rem]">
            Work. Compete. <span className="text-clw-gold">Repeat.</span>
          </h1>
        </div>

        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-8 right-6 select-none font-display text-[11rem] leading-none text-clw-gold/[0.1] lg:right-10 lg:text-[14rem]"
        >
          W
        </span>
        <span aria-hidden className="absolute left-5 top-5 h-5 w-5 border-l-2 border-t-2 border-clw-gold/50" />
        <span aria-hidden className="absolute bottom-5 right-5 h-5 w-5 border-b-2 border-r-2 border-clw-gold/50" />
      </div>

      <p className="px-5 py-4 font-cond text-sm uppercase tracking-[0.34em] text-clw-gold sm:px-8 md:hidden">
        Crystal Lake Wizards Wrestling Club
      </p>
    </section>
  )
}
