export interface MosaicImage {
  src: string
  alt: string
  position?: string
}

const IMAGE_TREATMENT = 'absolute inset-0 h-full w-full object-cover contrast-105 saturate-[0.85]'

/**
 * Branded proof-point photo composition: one dominant image and two
 * supporting images on a black field with gold hairline seams, an offset
 * gold frame, the club star stamp, and a captioned rule. Replaces the
 * loose overlapping-photo collages used on the homepage intro and the
 * new-families page.
 */
export function BrandedPhotoMosaic({
  primary,
  top,
  bottom,
  caption,
  className = '',
}: {
  primary: MosaicImage
  top: MosaicImage
  bottom: MosaicImage
  caption: string
  className?: string
}) {
  return (
    <figure className={`relative ${className}`}>
      <div aria-hidden className="absolute -right-2.5 -top-2.5 h-full w-full border border-clw-gold/45 sm:-right-3 sm:-top-3" />

      <div className="relative border border-clw-gold/40 bg-clw-black p-1.5 shadow-2xl shadow-black/30 sm:p-2">
        <div className="grid aspect-[5/4] grid-cols-[3fr_2fr] gap-1.5 sm:gap-2">
          <div className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src={primary.src}
              alt={primary.alt}
              className={IMAGE_TREATMENT}
              style={{ objectPosition: primary.position ?? 'center' }}
            />
          </div>
          <div className="grid grid-rows-2 gap-1.5 sm:gap-2">
            {[top, bottom].map((image) => (
              <div key={image.src} className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src={image.src}
                  alt={image.alt}
                  className={IMAGE_TREATMENT}
                  style={{ objectPosition: image.position ?? 'center' }}
                />
              </div>
            ))}
          </div>
        </div>

        <figcaption className="flex items-center gap-3 px-2 pb-1.5 pt-3 sm:px-3 sm:pt-4">
          <span aria-hidden className="h-px flex-1 bg-clw-gold/40" />
          <span className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">{caption}</span>
        </figcaption>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- club brand mark */}
      <img
        src="/images/real/clw_star_stamp_yellow_gold.png"
        alt=""
        aria-hidden
        draggable={false}
        className="absolute -left-5 -top-6 h-14 w-14 rotate-[-10deg] select-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)] sm:-left-7 sm:-top-8 sm:h-20 sm:w-20"
      />
    </figure>
  )
}
