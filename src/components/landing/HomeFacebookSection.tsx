import { FacebookFeedWithFallback } from '@/components/landing/FacebookFeedWithFallback'

const FACEBOOK_URL = 'https://www.facebook.com/pages/Wizards-Wrestling-Club/103467966667221'

const CLUB_PHOTOS = [
  {
    src: '/images/real/team_march2025.jpg',
    alt: 'Crystal Lake Wizards wrestlers gathered for a team photo',
    position: 'center',
  },
  {
    src: '/images/real/clw-wizards-youth-team-photo-2.jpg',
    alt: 'Crystal Lake Wizards youth wrestling team together',
    position: 'center',
  },
  {
    src: '/images/real/clw-wizards-youth-outing.jpg',
    alt: 'Crystal Lake Wizards wrestlers at a team outing',
    position: 'center',
  },
  {
    src: '/images/real/clw-wizards-coach-team-photo.jpg',
    alt: 'Crystal Lake Wizards coaches and wrestlers together',
    position: 'center',
  },
  {
    src: '/images/real/clw-wizards-teen-photo.jpg',
    alt: 'Crystal Lake Wizards teenage wrestlers together',
    position: 'center',
  },
  {
    src: '/images/real/clw-wizards-youth-win.jpg',
    alt: 'Crystal Lake Wizards youth wrestlers celebrating a win',
    position: 'center',
  },
]

export function HomeFacebookSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black px-5 py-14 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_16%_0%,rgba(240,192,32,.14),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />

      <div id="facebook" className="relative mx-auto grid max-w-7xl scroll-mt-24 gap-10 lg:flex lg:flex-col lg:items-center">
        <div className="lg:text-center">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Social</p>
          <h2 className="mt-6 max-w-3xl uppercase leading-[0.92] text-clw-white lg:mx-auto lg:max-w-none">
            <span className="block font-cond text-[clamp(3rem,12vw,5rem)] font-light tracking-[-0.04em]">
              Follow us on
            </span>
            <span className="block font-display text-[clamp(3.4rem,13vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold">
              Facebook
            </span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-clw-gray sm:text-xl lg:mx-auto">
            Practice updates, tournament reminders, photos, and club announcements open directly on Facebook.
          </p>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block font-cond text-xl uppercase tracking-[0.18em] text-clw-gold underline-offset-4 hover:text-clw-gold-l hover:underline"
          >
            Open Facebook page →
          </a>
        </div>

        <div className="lg:w-full lg:max-w-3xl">
          <FacebookFeedWithFallback href={FACEBOOK_URL} />
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-5xl">
          {CLUB_PHOTOS.map((photo, index) => (
            <div
              key={photo.src}
              className={`relative overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-xl shadow-black/20 ${
                index === 0 ? 'aspect-[4/3] sm:col-span-2 sm:aspect-[16/9]' : 'aspect-[4/3]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
              <img
                src={photo.src}
                alt={photo.alt}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: photo.position }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-clw-black/45 via-transparent to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
