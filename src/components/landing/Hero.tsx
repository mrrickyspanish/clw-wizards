import Link from 'next/link'

import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative flex min-h-[560px] items-center overflow-hidden border-b border-clw-gold/10 bg-clw-black pt-24 md:pt-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-clw-black" />
        <img
          src="https://picsum.photos/seed/clw-wrestling-mat/2200/1000"
          alt=""
          aria-hidden
          className="animate-kenburns absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-75"
          autoPlay
          muted
          loop
          playsInline
          poster="/hero.jpg"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-clw-black via-clw-black/80 to-clw-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-clw-black via-clw-black/20 to-clw-black/30" />
      </div>

      <div className="w-full px-5 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <p className="font-cond text-sm uppercase tracking-[0.34em] text-clw-gold">Crystal Lake, Illinois</p>
        <h1 className="mt-4 max-w-3xl font-display text-6xl uppercase leading-[0.88] text-clw-white sm:text-7xl lg:text-8xl xl:text-9xl">
          Wrestle like a <span className="text-clw-gold">Wizard</span>.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-clw-gray">
          Develop technique, toughness, and team, on and off the mat.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button asChild size="lg" className="chamfer-sm h-12 w-full rounded-none px-8 sm:w-auto">
            <Link href="/signup">Join the Wizards</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="chamfer-sm h-12 w-full rounded-none px-8 sm:w-auto">
            <Link href="/login">Parent Portal Login</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
