import Link from 'next/link'

export function ProgramIntro() {
  return (
    <section className="section-light border-y border-clw-gold/35 bg-[#F6F5F2] px-5 py-14 sm:px-8 sm:py-20 lg:px-12 xl:px-16 2xl:px-20">
      <div className="max-w-4xl">
        <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-ink">Crystal Lake Wizards Wrestling Club</p>
        <p className="mt-6 max-w-3xl text-2xl leading-relaxed text-clw-ink/90 sm:text-3xl sm:leading-relaxed">
          Crystal Lake Wizards Wrestling Club is a USA Wrestling certified, IKWF affiliated youth wrestling program for kids ages 5 to 14 in Crystal Lake, Illinois. Now in our fifth decade, we&apos;re a 501(c)(3) nonprofit run entirely by volunteers, coaching technique, toughness, and team on and off the mat.
        </p>
        <Link href="/about" className="mt-8 inline-block bg-clw-black px-8 py-5 font-display text-xl uppercase tracking-wide text-clw-gold transition hover:bg-clw-gold hover:text-clw-black">
          Learn more about the Wizards
        </Link>
      </div>
    </section>
  )
}
