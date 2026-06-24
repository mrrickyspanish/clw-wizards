import Link from 'next/link'
import { ORG } from '@/config/org.config'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-clw-black px-4 text-center">
      <h1 className="text-5xl font-display text-clw-gold mb-4">{ORG.name}</h1>
      <p className="text-clw-white/70 max-w-xl mb-8">
        The public website is being built out — for now, parents and staff can sign in to the portal below.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="px-6 py-3 rounded-lg bg-clw-gold text-clw-black font-medium">
          Sign In
        </Link>
        <Link href="/signup" className="px-6 py-3 rounded-lg border border-clw-gold text-clw-gold font-medium">
          Create Account
        </Link>
      </div>
    </main>
  )
}
