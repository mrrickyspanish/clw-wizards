'use client'

import { Sun, Moon } from 'lucide-react'

import { useTheme } from './ThemeScope'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const toLight = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={toLight ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-clw-gold/20 text-clw-gold-ink transition-colors hover:bg-clw-gold/10 ${className}`}
    >
      {toLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
