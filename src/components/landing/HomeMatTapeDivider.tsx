type TapeProfile = 'white-left' | 'black-right'

// Only the section BELOW the seam is painted; its colour must match that section
// exactly so the join is seamless.
const LIGHT = '#F7F7F7' // ProgramIntro / HomeSupportIntro-adjacent light sections
const DARK = '#0D0D0D' // clw-black — dark sections below a light one

/**
 * A real angled section divider — the boundary itself, not a strip laid on top.
 *
 * The element overlaps up into the section above (negative margin) and paints
 * ONLY the section below the seam, clipped to a diagonal top edge. Everything
 * above that diagonal is transparent, so the actual section above (e.g. the hero
 * photo) shows through and the diagonal cuts straight into it — no opaque filler
 * triangle faking a rectangle. A gold line rides the seam, with a star badge.
 *
 *  - white-left:  dark hero above  → light section below (seam dips left→right)
 *  - black-right: light section above → dark section below (seam rises left→right)
 */
export function HomeMatTapeDivider({ profile }: { profile: TapeProfile }) {
  const isWhite = profile === 'white-left'

  const fill = isWhite ? LIGHT : DARK
  // Diagonal top edge of the painted (below) region, as % of strip height.
  const line = isWhite ? { y1: 22, y2: 82 } : { y1: 82, y2: 22 }
  const clip = `polygon(0 ${line.y1}%, 100% ${line.y2}%, 100% 100%, 0 100%)`

  return (
    <div
      aria-hidden
      className="relative z-10 -mt-14 h-14 w-full overflow-hidden sm:-mt-16 sm:h-16 lg:-mt-20 lg:h-20"
    >
      {/* below-section colour with an angled top; the wedge above stays transparent */}
      <div className="absolute inset-0" style={{ background: fill, clipPath: clip, WebkitClipPath: clip }} />

      {/* gold edge line exactly on the diagonal */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1={line.y1} x2="100" y2={line.y2} stroke="#F0C020" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* star badge centred on the seam (both diagonals cross the midpoint) */}
      <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-clw-gold bg-clw-black shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:h-12 sm:w-12">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-clw-gold sm:h-6 sm:w-6">
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01z" />
        </svg>
      </span>
    </div>
  )
}
