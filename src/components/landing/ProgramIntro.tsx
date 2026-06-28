import Link from 'next/link'

export function ProgramIntro() {
  return (
    <section className="section-light border-y border-clw-gold/35 bg-[#F7F7F7] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20">
      <div className="max-w-4xl">
        <h2 className="max-w-3xl uppercase leading-[0.92] text-clw-ink">
          <span className="block font-cond text-[clamp(3rem,13vw,4.75rem)] font-light tracking-[-0.04em] text-clw-ink">
            Where McHenry County
          </span>
          <span className="block font-display text-[clamp(3.4rem,14vw,5.25rem)] font-black tracking-[-0.035em] text-clw-ink">
            Wrestlers Grow
          </span>
        </h2>
        <div className="mt-7 max-w-3xl space-y-5 text-xl leading-relaxed text-clw-ink/85 sm:text-2xl sm:leading-relaxed">
          <p>
            The Wizards help young wrestlers take the next step, whether they are learning the basics or chasing bigger goals. Our club gives kids a place to train hard, build confidence, and represent Crystal Lake with pride.
          </p>
          <p>
            We are volunteer-run, family-powered, and committed to helping every wrestler grow.
          </p>
        </div>
        <Link href="/about" className="mt-8 inline-block font-cond text-xl uppercase tracking-[0.18em] text-clw-gold-ink underline-offset-4 hover:text-clw-ink hover:underline">
          Ready to become a Wizard? →
        </Link>
      </div>
    </section>
  )
}
