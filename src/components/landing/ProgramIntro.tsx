import Link from 'next/link'

export function ProgramIntro() {
  return (
    <section className="section-light border-t border-clw-line-light bg-clw-cream px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20">
      <div className="max-w-3xl">
        <p className="text-lg leading-relaxed text-clw-ink/90 sm:text-xl">
          Crystal Lake Wizards Wrestling Club is a USA Wrestling–certified, IKWF-affiliated youth wrestling program
          for kids ages 5 to 14 in Crystal Lake, Illinois. Now in our fifth decade, we&apos;re a 501(c)(3) nonprofit
          run entirely by volunteers, coaching technique, toughness, and team on and off the mat.
        </p>
        <Link
          href="/about"
          className="mt-3 inline-block text-sm font-medium uppercase tracking-wide text-clw-gold-ink underline-offset-4 hover:underline"
        >
          Learn more about the Wizards →
        </Link>
      </div>
    </section>
  )
}
