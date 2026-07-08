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

function PhotoRiverRow({
  photos,
  reverse = false,
}: {
  photos: typeof CLUB_PHOTOS
  reverse?: boolean
}) {
  const groups = [photos, photos]

  return (
    <div className="marquee-group marquee-mask w-full overflow-hidden">
      <div
        className="marquee-track flex w-max gap-3 will-change-transform sm:gap-4"
        style={{ animationDuration: reverse ? '58s' : '52s', animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
            {group.map((photo) => (
              <div
                key={`${groupIndex}-${photo.src}`}
                className="relative h-40 w-64 shrink-0 overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-xl shadow-black/20 sm:h-48 sm:w-80 lg:h-52 lg:w-96"
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
  const topRow = CLUB_PHOTOS.filter((_, index) => index % 2 === 0)
  const bottomRow = CLUB_PHOTOS.filter((_, index) => index % 2 === 1)

  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black py-14 text-clw-white sm:py-16 lg:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_16%_0%,rgba(240,192,32,.14),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />

      <div id="facebook" className="relative mx-auto flex max-w-7xl scroll-mt-24 flex-col items-center gap-10 px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="text-center">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Social</p>
          <h2 className="mt-6 max-w-3xl uppercase leading-[0.92] text-clw-white lg:max-w-none">
            <span className="block font-cond text-[clamp(3rem,12vw,5rem)] font-light tracking-[-0.04em]">
              Follow us on
            </span>
            <span className="block font-display text-[clamp(3.4rem,13vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold">
              Facebook
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-clw-gray sm:text-xl">
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

        <div className="w-full max-w-3xl">
          <FacebookFeedWithFallback href={FACEBOOK_URL} />
        </div>
      </div>

      <div className="relative mt-10 space-y-3 sm:space-y-4">
        <PhotoRiverRow photos={topRow} />
        <PhotoRiverRow photos={bottomRow} reverse />
      </div>
    </section>
  )
}
