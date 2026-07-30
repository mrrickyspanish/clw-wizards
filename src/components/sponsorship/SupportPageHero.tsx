type SupportPageHeroProps = {
  eyebrow: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  imagePosition?: string
}

export function SupportPageHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  imagePosition = 'center',
}: SupportPageHeroProps) {
  return (
    <section className="bg-clw-black text-clw-white">
      <div className="relative h-[290px] overflow-hidden sm:h-[380px] lg:h-[460px] xl:h-[500px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-110 brightness-[0.62]"
          style={{ objectPosition: imagePosition }}
        />
        <div className="absolute inset-0 bg-clw-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-clw-black/75 via-clw-black/10 to-clw-black/28" />

        <div className="absolute inset-0 flex items-center justify-center px-5 py-8 sm:px-10 sm:py-10">
          <div className="w-full max-w-5xl text-center">
            <p className="font-cond text-xs font-semibold uppercase tracking-[0.26em] text-clw-gold sm:text-base sm:tracking-[0.32em]">
              {eyebrow}
            </p>
            <div className="mx-auto mt-4 h-1.5 w-full max-w-4xl bg-clw-gold sm:mt-5 sm:h-2" />
            <h1 className="mx-auto my-3 max-w-5xl font-impact text-[3.35rem] font-black uppercase leading-[0.86] tracking-normal text-clw-gold sm:text-[5.75rem] lg:text-[7rem] xl:text-[7.75rem]">
              {title}
            </h1>
            <div className="mx-auto h-1.5 w-full max-w-4xl bg-clw-gold sm:h-2" />
          </div>
        </div>
      </div>

      <div className="bg-clw-white px-5 py-6 text-center text-clw-black sm:px-8 sm:py-10">
        <p className="mx-auto max-w-4xl font-body text-lg font-medium leading-[1.65] text-clw-ink/85 sm:text-xl sm:leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  )
}
