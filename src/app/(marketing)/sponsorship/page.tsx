import type { Metadata } from 'next'

import { SupportOverview } from '@/components/sponsorship/SupportOverview'
import { SupportStatusAlert } from '@/components/sponsorship/SupportStatusAlert'

export const metadata: Metadata = {
  title: 'Support the Club',
  description:
    'See why community support matters, where donations go, and how to donate, join the boosters, sponsor, or volunteer with Wizards Wrestling Club.',
}

export default async function SponsorshipPage({
  searchParams,
}: {
  searchParams: Promise<{ donation?: string; sponsor?: string }>
}) {
  const { donation, sponsor } = await searchParams
  const legacyStatus = donation ?? sponsor

  return (
    <main className="overflow-x-clip bg-clw-black text-clw-white">
      <SupportStatusAlert status={legacyStatus} successMessage="Thank you for supporting the Wizards. Your payment was received." />
      <SupportOverview />
    </main>
  )
}
