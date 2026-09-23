'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

import { markTourSeen, type TourSurface } from '@/lib/tour/actions'

// Every step but "nav" only exists as a DOM target on the surface's home
// page — off that page the overlay would fall back to an untargeted,
// centered card for every step. Gating to the home route keeps the tour
// from starting (or continuing) anywhere the sections it points at aren't
// actually on screen; state (which step you're on) still survives
// navigating away and back, since this provider stays mounted across
// route changes within the same layout.
const TOUR_HOME_PATH: Record<TourSurface, string> = {
  parent: '/dashboard',
  admin: '/admin',
}

export type TourStepConfig = {
  id: string
  title: string
  body: string
  // A welcome/intro card: no target to spotlight, shown centered with a
  // "Start tour" CTA instead of "Next", and excluded from the step count.
  isIntro?: boolean
}

type TourContextValue = {
  activeStepId: string | null
  registerTarget: (id: string, el: HTMLElement) => void
  unregisterTarget: (id: string, el: HTMLElement) => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTourContext() {
  return useContext(TourContext)
}

const CARD_WIDTH = 320
const SPOTLIGHT_PADDING = 8

export function TourProvider({
  surface,
  steps,
  initiallySeen,
  children,
}: {
  surface: TourSurface
  steps: TourStepConfig[]
  initiallySeen: boolean
  children: ReactNode
}) {
  const [index, setIndex] = useState(initiallySeen || steps.length === 0 ? -1 : 0)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const onHomePath = pathname === TOUR_HOME_PATH[surface]
  // A step id can have more than one candidate element registered at once —
  // e.g. the desktop sidebar nav and the mobile tab bar both claim "nav", and
  // only one is visible at a time depending on viewport width.
  const targets = useRef(new Map<string, Set<HTMLElement>>())

  // Overlay positioning needs the real viewport/DOM rects, so it only renders
  // client-side (avoids an SSR/client markup mismatch on window dimensions).
  useEffect(() => setMounted(true), [])

  const finish = useCallback(() => {
    setIndex(-1)
    markTourSeen(surface).catch(() => {})
  }, [surface])

  const next = useCallback(() => {
    setIndex((i) => (i + 1 >= steps.length ? -2 : i + 1))
  }, [steps.length])

  useEffect(() => {
    if (index === -2) finish()
  }, [index, finish])

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  const registerTarget = useCallback((id: string, el: HTMLElement) => {
    const set = targets.current.get(id) ?? new Set<HTMLElement>()
    set.add(el)
    targets.current.set(id, set)
  }, [])

  const unregisterTarget = useCallback((id: string, el: HTMLElement) => {
    targets.current.get(id)?.delete(el)
  }, [])

  // Prefer whichever registered candidate is actually visible (non-zero
  // rect) — falls back to the first candidate if none currently render.
  const getTarget = useCallback((id: string) => {
    const set = targets.current.get(id)
    if (!set || set.size === 0) return null
    for (const el of set) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) return el
    }
    return set.values().next().value ?? null
  }, [])

  const activeStepId = index >= 0 ? steps[index]?.id ?? null : null

  return (
    <TourContext.Provider value={{ activeStepId, registerTarget, unregisterTarget }}>
      {children}
      {mounted && index >= 0 && onHomePath && (
        <TourOverlay stepIndex={index} steps={steps} getTarget={getTarget} onNext={next} onPrev={prev} onSkip={finish} />
      )}
    </TourContext.Provider>
  )
}

function TourOverlay({
  stepIndex,
  steps,
  getTarget,
  onNext,
  onPrev,
  onSkip,
}: {
  stepIndex: number
  steps: TourStepConfig[]
  getTarget: (id: string) => HTMLElement | null
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}) {
  const step = steps[stepIndex]
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    if (!step) return
    function measure() {
      const el = getTarget(step.id)
      setRect(el ? el.getBoundingClientRect() : null)
    }
    measure()
    getTarget(step.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step, getTarget])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onSkip()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onNext, onPrev, onSkip])

  if (!step) return null

  const isLast = stepIndex === steps.length - 1
  const spot =
    rect && !step.isIntro
      ? {
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
        }
      : null

  // Steps are numbered against the real (non-intro) steps only, so the
  // welcome card doesn't show as "Step 1".
  const hasIntro = steps[0]?.isIntro ?? false
  const stepNumber = hasIntro ? stepIndex : stepIndex + 1
  const totalSteps = hasIntro ? steps.length - 1 : steps.length
  const primaryLabel = step.isIntro ? 'Start tour' : isLast ? 'Done' : 'Next'

  const viewportW = window.innerWidth
  const viewportH = window.innerHeight

  let cardTop: number
  let cardLeft: number
  if (spot) {
    const spaceBelow = viewportH - (spot.top + spot.height)
    const placeBelow = spaceBelow > 200 || spot.top < 200
    cardTop = placeBelow ? spot.top + spot.height + 16 : Math.max(16, spot.top - 232)
    cardLeft = Math.min(Math.max(16, spot.left), viewportW - CARD_WIDTH - 16)
  } else {
    cardTop = viewportH / 2 - 110
    cardLeft = viewportW / 2 - CARD_WIDTH / 2
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Guided tour">
      {spot ? (
        // A single inline boxShadow does double duty: the 9999px spread dims
        // everything outside the target (the transparent hole in the middle
        // shows the real page, not a re-dimmed copy of it), and the second,
        // tighter shadow layers a gold glow on top. Both have to live in this
        // one boxShadow value — an inline `style` completely overrides any
        // box-shadow set by a Tailwind class like `ring-*`, so mixing the two
        // silently drops whichever one loses, which is what made the ring
        // invisible before. The crisp edge comes from a real `border`
        // instead, since that's a separate CSS property with no conflict.
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-clw-gold transition-all duration-200"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.75), 0 0 24px 4px rgba(240,192,32,0.45)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      <div
        className="card-depth absolute w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-clw-gold/20 bg-clw-black-3 p-5 shadow-xl transition-all duration-200"
        style={{ top: cardTop, left: cardLeft }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-clw-gold-ink">
            {step.isIntro ? 'Welcome' : `Step ${stepNumber} of ${totalSteps}`}
          </p>
          <button type="button" onClick={onSkip} aria-label="Close tour" className="text-clw-gray hover:text-clw-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 className={step.isIntro ? 'font-display text-2xl leading-tight text-clw-white' : 'font-display text-xl text-clw-white'}>
          {step.title}
        </h2>
        <p className="mt-2 text-base text-clw-gray">{step.body}</p>
        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={onSkip} className="text-sm text-clw-gray hover:text-clw-white">
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && !step.isIntro && (
              <button
                type="button"
                onClick={onPrev}
                className="rounded-lg border border-clw-gold/20 px-4 py-2 text-base font-medium text-clw-white"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="rounded-lg bg-clw-gold px-4 py-2 text-base font-medium text-[#0D0D0D]"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
