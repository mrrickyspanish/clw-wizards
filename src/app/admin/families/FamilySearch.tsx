'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

export function FamilySearch({ initial }: { initial: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initial)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    router.push(trimmed ? `/admin/families?q=${encodeURIComponent(trimmed)}` : '/admin/families')
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clw-gray" />
      <Input
        type="search"
        placeholder="Search name or email…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
      />
    </form>
  )
}
