import Link from 'next/link'

export function ProgramIntro() {
  return (
    <section className="section-light border-y border-clw-gold/35 bg-[#F7F7F7] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20">
      <div className="max-w-4xl">
        <h2 className="max-w-3xl font-display text-5xl uppercase leading-none tracking-wide text-clw-black sm:text-6xl lg:text-7xl">
          Where McHenry County wrestlers grow.
        </h2>
        <div className="mt-7 max-w-3xl space-y-5 text-xl leading-relaxed text-clw-ink/85 sm:text-2xl sm:leading-relaxed">
          <p>
            The Wizards are here to help young wrestlers take the next step. From first-year athletes learning the basics to experienced competitors chasing bigger goals, our club gives kids a place to train hard, build confidence, and represent Crystal Lake with pride.
          </p>
          <p>
            We are volunteer-run, family-powered, and committed to helping every wrestler grow.
          </p>
        </div>
        <Link href="/about" className="mt-8 inline-block font-cond text-xl uppercase tracking-[0.18em] text-clw-gold-ink underline-offset-4 hover:text-clw-black hover:underline">
          Ready to become a Wizard? →
        </Link>
      </div>
    </section>
  )
}
