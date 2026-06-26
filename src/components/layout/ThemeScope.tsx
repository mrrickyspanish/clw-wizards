'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

const STORAGE_KEY = 'clw-theme'

// Scopes the portal's theme via data-theme on its own wrapper (NOT <html>),
// so the public marketing/auth pages stay dark regardless. Default dark;
// choice persists per browser.
export function ThemeScope({ children, className }: { children: ReactNode; className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    } catch {
      // localStorage unavailable; stay on default.
    }
  }, [])

  function toggle() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore persistence failure
      }
      return next
    })
  }

  return (
    <div data-theme={theme} className={className}>
      <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
    </div>
  )
}
