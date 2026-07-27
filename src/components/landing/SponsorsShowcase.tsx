import type { Sponsor } from '@/types/database'

import { SponsorTicker } from '@/components/landing/SponsorTicker'

const SPONSOR_PLACEHOLDERS: Sponsor[] = [
  {
    id: 'placeholder-1',
    name: 'Sponsor Slot',
    tier: 'yellow',
    logo_url: null,
    website_url: null,
    contact_name: null,
    contact_email: null,
    amount_cents: null,
    recurring: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    active: true,
    golf_outing_hole: false,
    notes: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'placeholder-2',
    name: 'Community Partner',
    tier: 'yellow',
    logo_url: null,
    website_url: null,
    contact_name: null,
    contact_email: null,
    amount_cents: null,
    recurring: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    active: true,
    golf_outing_hole: false,
    notes: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'placeholder-3',
    name: 'Local Supporter',
    tier: 'yellow',
    logo_url: null,
    website_url: null,
    contact_name: null,
    contact_email: null,
    amount_cents: null,
    recurring: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    active: true,
    golf_outing_hole: false,
    notes: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'placeholder-4',
    name: 'Family Business',
    tier: 'yellow',
    logo_url: null,
    website_url: null,
    contact_name: null,
    contact_email: null,
    amount_cents: null,
    recurring: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    active: true,
    golf_outing_hole: false,
    notes: null,
    created_at: '',
    updated_at: '',
  },
]

export function SponsorsShowcase({ sponsors }: { sponsors: Sponsor[] }) {
  const sponsorList = sponsors.length > 0 ? sponsors : SPONSOR_PLACEHOLDERS

  return <SponsorTicker sponsors={sponsorList} />
}
