type TapeProfile = 'white-left' | 'black-right'

const TAPE_ASSETS: Record<TapeProfile, string> = {
  'white-left': '/images/real/clw_tape_white_profile_a_star_left.png',
  'black-right': '/images/real/clw_tape_black_profile_b_star_right.png',
}

export function HomeMatTapeDivider({ profile }: { profile: TapeProfile }) {
  return (
    <div aria-hidden className="pointer-events-none relative z-30 h-0 w-full overflow-visible">
      {/* eslint-disable-next-line @next/next/no-img-element -- supplied transparent wrestling tape artwork */}
      <img
        src={TAPE_ASSETS[profile]}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-0 h-auto w-[104vw] max-w-none select-none"
        style={{ transform: 'translate(-50%, -54%)' }}
      />
    </div>
  )
}
