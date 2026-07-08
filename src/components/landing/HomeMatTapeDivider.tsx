type SectionTone = 'dark' | 'light'
type TapeProfile = 'white-left' | 'black-right'
type TapeWeight = 'standard' | 'thick'

const TONE_COLORS: Record<SectionTone, string> = {
  dark: '#0D0D0D',
  light: '#F7F7F7',
}

const TAPE_ASSETS: Record<TapeProfile, Record<TapeWeight, string>> = {
  'white-left': {
    standard: '/images/clw_tape_white_profile_a_star_left.png',
    thick: '/images/clw_tape_white_profile_a_star_left_thick.png',
  },
  'black-right': {
    standard: '/images/clw_tape_black_profile_b_star_right.png',
    thick: '/images/clw_tape_black_profile_b_star_right_thick.png',
  },
}

const WEIGHT_CLASSES: Record<TapeWeight, string> = {
  standard: '-mb-4 -mt-4 h-8 sm:-mb-5 sm:-mt-5 sm:h-10 lg:-mb-6 lg:-mt-6 lg:h-12',
  thick: '-mb-6 -mt-6 h-12 sm:-mb-7 sm:-mt-7 sm:h-14 lg:-mb-9 lg:-mt-9 lg:h-[72px]',
}

export function HomeMatTapeDivider({
  from,
  to,
  profile,
  weight = 'standard',
}: {
  from: SectionTone
  to: SectionTone
  profile: TapeProfile
  weight?: TapeWeight
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative z-30 w-full overflow-hidden ${WEIGHT_CLASSES[weight]}`}
      style={{
        background: `linear-gradient(to bottom, ${TONE_COLORS[from]} 0 50%, ${TONE_COLORS[to]} 50% 100%)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- supplied transparent wrestling mat tape artwork */}
      <img
        src={TAPE_ASSETS[profile][weight]}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-1/2 h-[110%] w-[102%] -translate-x-1/2 -translate-y-1/2 select-none object-fill"
      />
    </div>
  )
}
