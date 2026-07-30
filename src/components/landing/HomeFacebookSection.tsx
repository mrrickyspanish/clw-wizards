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

function PhotoRiverRow({ photos }: { photos: typeof CLUB_PHOTOS }) {
  const groups = [photos, photos]

  return (
    <div className="marquee-group marquee-mask w-full overflow-hidden">
      <div
        className="marquee-track flex w-max gap-3 will-change-transform sm:gap-4"
        style={{ animationDuration: '56s' }}
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
            {group.map((photo) => (
              <div
                key={`${groupIndex}-${photo.src}`}
                className="relative h-40 w-64 shrink-0 overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-xl shadow-black/20 sm:h-44 sm:w-72 lg:h-40 lg:w-72 2xl:h-52 2xl:w-96"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: photo.position }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-clw-black/35 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomeFacebookSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black py-14 text-clw-white sm:py-16 lg:py-14 2xl:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_16%_0%,rgba(240,192,32,.14),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />

      <div id="facebook" className="relative mx-auto grid max-w-7xl scroll-mt-24 gap-8 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-10 lg:px-12 xl:px-16 2xl:gap-14 2xl:px-20">
        <div className="text-center lg:sticky lg:top-44 lg:text-left">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Social</p>
          <h2 className="mt-4 max-w-3xl uppercase leading-[0.92] text-clw-white lg:max-w-none">
            <span className="block font-cond text-[clamp(3rem,12vw,5rem)] font-light tracking-[-0.04em] lg:text-[3.7rem] xl:text-[4.2rem] 2xl:text-[5rem]">
              Follow us on
            </span>
            <span className="block font-display text-[clamp(3.4rem,13vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold lg:text-[4rem] xl:text-[4.6rem] 2xl:text-[5.6rem]">
              Facebook
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-clw-gray sm:text-xl lg:mx-0 lg:text-lg lg:leading-[1.65] 2xl:mt-6 2xl:text-xl">
            Practice updates, tournament reminders, photos, and club announcements open directly on Facebook.
          </p>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block font-cond text-xl uppercase tracking-[0.18em] text-clw-gold underline-offset-4 hover:text-clw-gold-l hover:underline 2xl:mt-8"
          >
            Open Facebook page →
          </a>
        </div>

        <div className="w-full min-w-0">
          <FacebookFeedWithFallback href={FACEBOOK_URL} />
        </div>
      </div>

      <div className="relative mt-8 2xl:mt-10">
        <PhotoRiverRow photos={CLUB_PHOTOS} />
      </div>
    </section>
  )
}
