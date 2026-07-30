'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

type QuietBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type QuietBoundaryState = {
  failed: boolean
}

/**
 * Contains a non-essential piece of UI so a crash inside it cannot propagate
 * to the root error boundary and replace the entire page with React's
 * "Application error: a client-side exception has occurred" screen.
 *
 * Only wrap decorative or supplementary widgets. Anything a visitor needs in
 * order to use the page should fail loudly instead.
 */
export class QuietBoundary extends Component<QuietBoundaryProps, QuietBoundaryState> {
  state: QuietBoundaryState = { failed: false }

  static getDerivedStateFromError(): QuietBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Suppressed a non-essential UI error:', error, info.componentStack)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
