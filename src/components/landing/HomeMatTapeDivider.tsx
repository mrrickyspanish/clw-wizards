type TapeProfile = 'white-left' | 'black-right'

type TapeSettings = {
  src: string
  frameClassName: string
  frameOffset: string
  imageOffset: string
  imageFilter?: string
}

const TAPE_SETTINGS: Record<TapeProfile, TapeSettings> = {
  'white-left': {
    src: '/images/real/clw_tape_white_profile_a_star_left.png',
    frameClassName: 'h-12 sm:h-14 lg:h-16',
    frameOffset: 'translateY(0)',
    imageOffset: 'translate(-50%, -50%)',
  },
  'black-right': {
    src: '/images/real/clw_tape_black_profile_b_star_right.png',
    frameClassName: 'h-7 sm:h-8 lg:h-9',
    frameOffset: 'translateY(-66%)',
    imageOffset: 'translate(-50%, -39%)',
    imageFilter: 'brightness(0.72) contrast(1.12) saturate(0.9)',
  },
}

export function HomeMatTapeDivider({ profile }: { profile: TapeProfile }) {
  const tape = TAPE_SETTINGS[profile]

  return (
    <div aria-hidden className="pointer-events-none relative z-50 h-0 w-full overflow-visible">
      <div
        className={`absolute left-0 top-0 w-full overflow-hidden ${tape.frameClassName}`}
        style={{ transform: tape.frameOffset }}
      >
        <img
          src={tape.src}
          alt=""
          draggable={false}
          className="absolute left-1/2 top-1/2 h-auto w-[104vw] max-w-none select-none"
          style={{ transform: tape.imageOffset, filter: tape.imageFilter }}
        />
        {profile === 'black-right' && (
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
