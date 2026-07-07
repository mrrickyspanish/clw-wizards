type SectionTone = 'dark' | 'light'
type DividerVariant = 'a' | 'b'
type StarPosition = 'left' | 'right'

const COLORS: Record<SectionTone, string> = {
  dark: '#0D0D0D',
  light: '#F7F7F7',
}

const ASSETS = {
  light: {
    a: '/images/dividers/mat-tape-white-a.svg',
    b: '/images/dividers/mat-tape-white-b.svg',
  },
  dark: {
    a: '/images/dividers/mat-tape-black-a.svg',
    b: '/images/dividers/mat-tape-black-a.svg',
  },
} as const

function StarStamp({ position, tone }: { position: StarPosition; tone: SectionTone }) {
  const wear = tone === 'light' ? '#F4F1E9' : '#111111'

  return (
    <svg
      viewBox="0 0 100 100"
      className={`absolute top-1/2 z-10 h-7 w-7 -translate-y-1/2 sm:h-8 sm:w-8 lg:h-9 lg:w-9 ${
        position === 'left' ? 'left-[14%]' : 'right-[14%]'
      }`}
      aria-hidden
    >
      <path d="M50 7 60 37 92 37 66 56 76 87 50 68 24 87 34 56 8 37 40 37Z" fill="#F0C020" opacity="0.9" />
      <path d="M50 14 58 40 85 40 63 56 71 81 50 66 29 81 37 56 15 40 42 40Z" fill="none" stroke="#0D0D0D" strokeOpacity="0.22" strokeWidth="2" />
      <circle cx="38" cy="42" r="3.2" fill={wear} opacity="0.65" />
      <circle cx="61" cy="54" r="2.4" fill={wear} opacity="0.55" />
      <circle cx="48" cy="66" r="1.8" fill={wear} opacity="0.6" />
    </svg>
  )
}

export function HomeSectionTear({
  from,
  to,
  variant = 'a',
  star,
}: {
  from: SectionTone
  to: SectionTone
  variant?: DividerVariant
  star?: StarPosition
}) {
  const asset = ASSETS[to][variant]
  const mirror = to === 'dark' && variant === 'b'

  return (
    <div
      aria-hidden
      className="pointer-events-none relative z-30 -mb-8 -mt-8 h-16 w-full overflow-hidden sm:-mb-9 sm:-mt-9 sm:h-[72px] lg:-mb-10 lg:-mt-10 lg:h-20"
      style={{
        background: `linear-gradient(to bottom, ${COLORS[from]} 0 50%, ${COLORS[to]} 50% 100%)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- authored transparent athletic tape asset */}
      <img
        src={asset}
        alt=""
        className={`absolute inset-0 h-full w-full object-fill ${mirror ? '-scale-x-100' : ''}`}
      />
      {star ? <StarStamp position={star} tone={to} /> : null}
    </div>
  )
}
