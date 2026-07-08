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
    frameClassName: 'h-6 sm:h-7 lg:h-8',
    frameOffset: 'translateY(-68%)',
    imageOffset: 'translate(-50%, -43%)',
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
        {/* eslint-disable-next-line @next/next/no-img-element -- supplied transparent wrestling tape artwork */}
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

      {profile === 'white-left' && (
        /* eslint-disable-next-line @next/next/no-img-element -- supplied transparent gold star seal */
        <img
          src="/images/real/clw_star_stamp_yellow_gold.png"
          alt=""
          draggable={false}
          className="absolute left-1/2 top-0 z-[60] h-7 w-7 -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] sm:h-8 sm:w-8"
        />
      )}
    </div>
  )
}
