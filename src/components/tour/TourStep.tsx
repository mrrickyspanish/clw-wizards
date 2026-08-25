'use client'

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'

import { useTourContext } from './TourProvider'

// Wraps a dashboard section so the tour can spotlight it. Renders no extra
// styling of its own — just a ref-bearing div the overlay measures against.
export function TourStep({
  id,
  children,
  className,
  style,
}: {
  id: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const tour = useTourContext()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!tour) return
    const node = ref.current
    if (!node) return
    tour.registerTarget(id, node)
    return () => tour.unregisterTarget(id, node)
  }, [tour, id])

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
