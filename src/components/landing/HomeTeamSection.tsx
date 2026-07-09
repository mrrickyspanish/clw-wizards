import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'

// Interim crop of Tony from the trophy photo. When a dedicated Tony photo is
// added to /public/images/real, swap `src` here and re-tune `position`.
const COACH_PHOTO = {
  src: '/images/real/coaches_trophy.jpg',
  position: '12% 22%',
}

// DRAFT quote assembled from existing club copy — confirm exact wording with
// Tony before launch.
const COACH_QUOTE =
  'Every wrestler who walks into our room gets challenged, supported, and held accountable. What they earn here is real confidence — and that carries into everything else they do.'

export function HomeTeamSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black px-5 py-14 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_82%_4%,rgba(240,192,32,.16),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />

      <div id="team" className="relative mx-auto max-w-6xl scroll-mt-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div aria-hidden className="absolute -left-2.5 -top-2.5 h-full w-full border border-clw-gold/45 sm:-left-3 sm:-top-3" />
            <div className="relative overflow-hidden border border-clw-gold/30 bg-clw-black-2 shadow-2xl shadow-black/40">
              <div className="relative aspect-[4/5]">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src={COACH_PHOTO.src}
                  alt="Tony Fontanetta, Wizards Wrestling president and head coach"
                  className="absolute inset-0 h-full w-full object-cover grayscale contrast-110"
                  style={{ objectPosition: COACH_PHOTO.position }}
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-clw-black/90 via-clw-black/10 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="font-display text-3xl uppercase leading-none text-clw-white sm:text-4xl">Tony Fontanetta</p>
                  <p className="mt-2 font-cond text-sm uppercase tracking-[0.2em] text-clw-gold">
                    President, Head Coach &amp; Club Coordinator
                  </p>
                </figcaption>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- club brand mark */}
            <img
              src="/images/real/clw_star_stamp_yellow_gold.png"
              alt=""
              aria-hidden
              draggable={false}
              className="absolute -right-5 -top-6 h-14 w-14 rotate-[9deg] select-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)] sm:-right-7 sm:-top-8 sm:h-20 sm:w-20"
            />
          </figure>

          <div>
            <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Head Coach</p>
            <h2 className="mt-5 uppercase leading-[0.92] text-clw-white">
              <span className="mr-2 inline font-cond text-[clamp(2.4rem,9vw,4.5rem)] font-light tracking-[-0.04em] sm:mr-3">
                Meet
              </span>
              <span className="inline font-display text-[clamp(2.7rem,10vw,5rem)] font-black tracking-[-0.035em] text-clw-gold">
                Coach Tony
              </span>
            </h2>

            <blockquote className="mt-7">
              <span aria-hidden className="block font-display text-7xl leading-[0.4] text-clw-gold">&ldquo;</span>
              <p className="mt-3 max-w-2xl font-cond text-2xl font-light leading-snug text-clw-white sm:text-3xl sm:leading-snug">
                {COACH_QUOTE}
              </p>
            </blockquote>

            <div aria-hidden className="mt-7 h-px w-24 bg-clw-gold/60" />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-clw-gray">
              Tony leads a volunteer staff of board members and practice-room coaches who run every group in the room —
              and he is the first call for families thinking about joining.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/coaches"
                className="chamfer-sm inline-flex min-h-12 items-center justify-center gap-2 bg-clw-gold px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-black transition hover:bg-clw-gold-l"
              >
                Meet the Full Staff <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-clw-gold/35 px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-gold transition hover:border-clw-gold hover:text-clw-gold-l"
              >
                Read Our Mission <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <a
              href="tel:3126567335"
              className="mt-7 inline-flex items-center gap-2 font-cond text-base uppercase tracking-[0.18em] text-clw-gold hover:text-clw-gold-l"
            >
              <Phone className="h-4 w-4" />
              312-656-7335
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
