type TapeProfile = 'white-left' | 'black-right'

type TapeSettings = {
  src: string
  frameClassName: string
  frameOffset: string
  imageOffset: string
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
  },
}

export function HomeMatTapeDivider({ profile }: { profile: TapeProfile }) {
  const tape = TAPE_SETTINGS[profile]

  return (
    <div aria-hidden className="pointer-events-none relative z-30 h-0 w-full overflow-visible">
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
          style={{ transform: tape.imageOffset }}
        />
      </div>
    </div>
  )
}
