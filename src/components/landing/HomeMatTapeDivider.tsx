type TapeProfile = 'white-left' | 'black-right'

const TAPE_ASSETS: Record<TapeProfile, string> = {
  'white-left': '/images/real/clw_tape_white_profile_a_star_left.png',
  'black-right': '/images/real/clw_tape_black_profile_b_star_right.png',
}

export function HomeMatTapeDivider({ profile }: { profile: TapeProfile }) {
  return (
    <div aria-hidden className="pointer-events-none relative z-30 h-0 w-full overflow-visible">
      <div
        className="absolute left-0 top-0 h-9 w-full overflow-hidden sm:h-10 lg:h-12"
        style={{ transform: 'translateY(-72%)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- supplied transparent wrestling tape artwork */}
        <img
          src={TAPE_ASSETS[profile]}
          alt=""
          draggable={false}
          className="absolute left-1/2 top-1/2 h-auto w-[104vw] max-w-none select-none"
          style={{ transform: 'translate(-50%, -42%)' }}
        />
      </div>
    </div>
  )
}
