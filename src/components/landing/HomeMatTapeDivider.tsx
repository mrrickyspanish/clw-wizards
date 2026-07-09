type TapeProfile = 'white-left' | 'black-right'

type TapeSettings = {
  src: string
  frameClassName: string
  frameOffset: string
  imageOffset: string
  imageWidthClassName: string
  imageFilter?: string
  /** Feathers the tape's long edges so the strip melts into the two sections
   *  it bridges instead of reading as a rectangle laid on top of a hard seam. */
  frameMaskImage?: string
  /** Soft contact shadow cast onto the lighter section below the tape. */
  contactShadow?: boolean
  /** Dark gradient blended into the darker section below the tape. */
  darkBlend?: boolean
}

const TAPE_SETTINGS: Record<TapeProfile, TapeSettings> = {
  // Straddles the hero → light-section seam so the tape covers the hard color
  // change (rather than floating below it), and feathers its top/bottom edges
  // so it reads as one taped mat crossover instead of a strip placed on a join.
  'white-left': {
    src: '/images/real/clw_tape_white_profile_a_star_left.png',
    frameClassName: 'h-12 sm:h-14 lg:h-16',
    frameOffset: 'translateY(-48%)',
    imageOffset: 'translate(-60%, -50%)',
    imageWidthClassName: 'w-[130vw]',
    imageFilter: 'contrast(1.05) brightness(0.99)',
    frameMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 24%, #000 76%, transparent 100%)',
    contactShadow: true,
  },
  'black-right': {
    src: '/images/real/clw_tape_black_profile_b_star_right.png',
    frameClassName: 'h-7 sm:h-8 lg:h-9',
    frameOffset: 'translateY(-66%)',
    imageOffset: 'translate(-50%, -39%)',
    imageWidthClassName: 'w-[104vw]',
    imageFilter: 'brightness(0.72) contrast(1.12) saturate(0.9)',
    darkBlend: true,
  },
}

export function HomeMatTapeDivider({ profile }: { profile: TapeProfile }) {
  const tape = TAPE_SETTINGS[profile]

  return (
    <div aria-hidden className="pointer-events-none relative z-50 h-0 w-full overflow-visible">
      {tape.contactShadow && (
        <div className="absolute left-0 top-0 h-10 w-full bg-gradient-to-b from-black/12 via-black/5 to-transparent" />
      )}

      <div
        className={`absolute left-0 top-0 w-full overflow-hidden ${tape.frameClassName}`}
        style={{
          transform: tape.frameOffset,
          WebkitMaskImage: tape.frameMaskImage,
          maskImage: tape.frameMaskImage,
        }}
      >
        <img
          src={tape.src}
          alt=""
          draggable={false}
          className={`absolute left-1/2 top-1/2 h-auto max-w-none select-none ${tape.imageWidthClassName}`}
          style={{ transform: tape.imageOffset, filter: tape.imageFilter }}
        />
        {tape.darkBlend && (
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-clw-black/80" />
        )}
      </div>

      <img
        src="/images/real/clw_star_stamp_yellow_gold.png"
        alt=""
        draggable={false}
        className="absolute left-1/2 top-0 z-[60] h-28 w-28 -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.65)] sm:h-32 sm:w-32 lg:h-[9.5rem] lg:w-[9.5rem]"
      />
    </div>
  )
}
