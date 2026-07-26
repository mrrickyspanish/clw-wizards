type TapeProfile = 'white-left' | 'black-right'

// Section colors this seam bridges — must match the adjacent sections exactly so
// the two-tone split is seamless (no sliver of the wrong color at the join).
const LIGHT = '#F7F7F7' // ProgramIntro / HomeEventsSection background
const DARK = '#0D0D0D' // clw-black — hero base + dark sections

/**
 * Clean angled section divider. Instead of a torn "mat tape" strip laid over a
 * hard seam, this IS the boundary: a crisp diagonal that splits the dark and
 * light sections it sits between, with a gold edge line and a small star badge
 * on the seam for brand punctuation.
 *
 *  - white-left:  dark hero above  → light section below (seam dips left→right)
 *  - black-right: light section above → dark section below (seam rises left→right)
 */
export function HomeMatTapeDivider({ profile }: { profile: TapeProfile }) {
  const isWhite = profile === 'white-left'

  const topFill = isWhite ? DARK : LIGHT
  const bottomFill = isWhite ? LIGHT : DARK

  // The diagonal, as % of the strip height, running edge to edge.
  const line = isWhite ? { y1: 20, y2: 80 } : { y1: 80, y2: 20 }
  const topClip = `polygon(0 0, 100% 0, 100% ${line.y2}%, 0 ${line.y1}%)`
  const bottomClip = `polygon(0 ${line.y1}%, 100% ${line.y2}%, 100% 100%, 0 100%)`

  return (
    <div aria-hidden className="relative z-10 h-16 w-full overflow-hidden sm:h-20 lg:h-24">
      <div className="absolute inset-0" style={{ background: topFill, clipPath: topClip, WebkitClipPath: topClip }} />
      <div
        className="absolute inset-0"
        style={{ background: bottomFill, clipPath: bottomClip, WebkitClipPath: bottomClip }}
      />

      {/* Gold edge line exactly on the seam. */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1={line.y1} x2="100" y2={line.y2} stroke="#F0C020" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* Star badge centered on the seam (both diagonals cross the midpoint). */}
      <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-clw-gold bg-clw-black shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:h-12 sm:w-12">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-clw-gold sm:h-6 sm:w-6">
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01z" />
        </svg>
      </span>
    </div>
  )
}
