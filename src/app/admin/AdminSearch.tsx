'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

/**
 * Search box for an admin list. Submitting puts the words in the page's
 * ?q= so the server filters the list, and the search survives a refresh or a
 * shared link. `keep` carries any other filter already applied.
 */
export function AdminSearch({
  initial,
  basePath,
  placeholder,
  keep = {},
}: {
  initial: string
  basePath: string
  placeholder: string
  keep?: Record<string, string>
}) {
  const router = useRouter()
  const [value, setValue] = useState(initial)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(keep)
    const trimmed = value.trim()
    if (trimmed) params.set('q', trimmed)
    const query = params.toString()
    router.push(query ? `${basePath}?${query}` : basePath)
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clw-gray" />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
      />
    </form>
  )
}
