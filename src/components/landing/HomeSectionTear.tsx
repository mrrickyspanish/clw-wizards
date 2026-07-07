type SectionTone = 'dark' | 'light'
type TearVariant = 'a' | 'b'

const TEAR_PATHS: Record<TearVariant, { backing: string; face: string }> = {
  a: {
    backing:
      'M0 13 L72 10 L148 15 L236 8 L332 14 L430 9 L532 16 L642 7 L748 13 L860 9 L974 16 L1088 8 L1196 14 L1312 10 L1440 15 V48 H0 Z',
    face:
      'M0 19 L72 16 L148 21 L236 14 L332 20 L430 15 L532 22 L642 13 L748 19 L860 15 L974 22 L1088 14 L1196 20 L1312 16 L1440 21 V48 H0 Z',
  },
  b: {
    backing:
      'M0 15 L92 9 L188 14 L286 11 L382 17 L486 8 L590 15 L704 10 L812 17 L926 9 L1040 14 L1152 11 L1266 18 L1364 10 L1440 14 V48 H0 Z',
    face:
      'M0 21 L92 15 L188 20 L286 17 L382 23 L486 14 L590 21 L704 16 L812 23 L926 15 L1040 20 L1152 17 L1266 24 L1364 16 L1440 20 V48 H0 Z',
  },
}

const TONE_COLORS: Record<SectionTone, string> = {
  dark: '#0D0D0D',
  light: '#F7F7F7',
}

export function HomeSectionTear({
  from,
  to,
  variant = 'a',
}: {
  from: SectionTone
  to: SectionTone
  variant?: TearVariant
}) {
  const paths = TEAR_PATHS[variant]
  const sameTone = from === to

  return (
    <div
      aria-hidden
      className="pointer-events-none relative z-30 -mb-5 -mt-5 h-10 w-full overflow-hidden"
      style={{ backgroundColor: TONE_COLORS[from] }}
    >
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path d={paths.backing} fill="#F0C020" opacity={sameTone ? 0.58 : 1} />
        <path d={paths.face} fill={TONE_COLORS[to]} />
      </svg>
    </div>
  )
}
