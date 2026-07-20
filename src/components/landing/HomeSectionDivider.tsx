type DividerVariant = 'into-light' | 'into-dark'

// Each variant fills the BOTTOM of the band with the color of the section it
// leads into; the triangle above the diagonal stays transparent so the section
// behind (the sliding SectionSlideOver background) shows through the crossover.
// Both diagonals pass through the band's center point (50,50) so the star stamp
// sits exactly on the seam. The two variants slope opposite ways, giving the
// page an alternating chevron rhythm as you scroll.
const VARIANTS: Record<DividerVariant, { fill: string; points: string; line: [number, number, number, number] }> = {
  // Dark hero -> light section: light trapezoid, diagonal sloping down to the right.
  'into-light': {
    fill: '#F7F7F7',
    points: '0,25 100,75 100,100 0,100',
    line: [0, 25, 100, 75],
  },
  // Light section -> dark section: dark trapezoid, diagonal sloping up to the right.
  'into-dark': {
    fill: 'rgb(11 11 11)',
    points: '0,75 100,25 100,100 0,100',
    line: [0, 75, 100, 25],
  },
}

export function HomeSectionDivider({ variant }: { variant: DividerVariant }) {
  const { fill, points, line } = VARIANTS[variant]
  const [x1, y1, x2, y2] = line

  return (
    <div aria-hidden className="pointer-events-none relative z-10 h-16 w-full overflow-visible sm:h-20 lg:h-24">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        shapeRendering="geometricPrecision"
      >
        <polygon points={points} fill={fill} />
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgb(240 192 32)"
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* eslint-disable-next-line @next/next/no-img-element -- brand star asset */}
      <img
        src="/images/real/clw_star_stamp_yellow_gold.png"
        alt=""
        draggable={false}
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)] sm:h-28 sm:w-28 lg:h-32 lg:w-32"
      />
    </div>
  )
}
