export type AppRole = 'admin' | 'staff' | 'parent'

export type SponsorTier = 'platinum' | 'yellow' | 'black' | 'white' | 'wizard_for_life'
export type CommChannel = 'email' | 'sms'
export type CommType =
  | 'tournament_reminder_wednesday'
  | 'tournament_reminder_weigh_in'
  | 'dues_reminder'
  | 'open_tournaments_digest'
  | 'general_blast'
  | 'registration_confirmation'
  | 'welcome'

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: AppRole
  phone: string | null
  practice_group: string | null
  sms_opt_in: boolean
  sms_opt_in_at: string | null
  consent_text: string | null
  email_unsubscribe_token: string
  is_active: boolean
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
}

export type Athlete = {
  id: string
  parent_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  weight_class: string | null
  practice_group: string
  usa_wrestling_card_number: string | null
  shirt_size: string | null
  birth_certificate_url: string | null
  usa_wrestling_card_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type Tournament = {
  id: string
  name: string
  date: string
  location: string
  city: string
  state: string
  external_registration_url: string | null
  external_platform: 'trackwrestling' | 'flowrestling' | 'internal' | 'other' | null
  weigh_in_time: string | null
  weigh_in_date: string | null
  weigh_in_location: string | null
  start_time: string | null
  status: 'open' | 'closed' | 'cancelled'
  practice_groups: string[]
  competition_level: string | null
  image_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type TournamentRegistration = {
  id: string
  tournament_id: string
  athlete_id: string
  parent_id: string
  status: 'registered' | 'confirmed' | 'withdrawn' | 'no_show'
  registered_at: string
  confirmed_at: string | null
  notes: string | null
}

export type DuesPayment = {
  id: string
  parent_id: string
  athlete_id: string | null
  amount_cents: number
  amount_paid_cents: number
  season: string
  status: 'pending' | 'partial' | 'paid' | 'waived' | 'overdue'
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  payment_plan: boolean
  waived_by: string | null
  waived_at: string | null
  waived_note: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export type Sponsor = {
  id: string
  name: string
  tier: SponsorTier
  logo_url: string | null
  website_url: string | null
  contact_name: string | null
  contact_email: string | null
  amount_cents: number | null
  recurring: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  active: boolean
  golf_outing_hole: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type PageContentRow = {
  key: string
  value: string
  updated_at: string
}

export type FaqItem = {
  id: string
  question: string
  answer: string
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export type SponsorTierRow = {
  slug: SponsorTier
  label: string
  price_cents: number | null
  sort_order: number
  public_checkout: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export type CommunicationLogRow = {
  id: string
  channel: CommChannel
  comm_type: CommType
  recipient_id: string | null
  recipient_email: string | null
  recipient_phone: string | null
  tournament_id: string | null
  subject: string | null
  body_preview: string | null
  status: 'sent' | 'failed' | 'bounced'
  sent_at: string
  external_id: string | null
}

export type AthleteDocument = {
  id: string
  athlete_id: string
  parent_id: string
  doc_type: 'birth_certificate' | 'usa_wrestling_card' | 'other'
  file_url: string
  file_name: string
  verified: boolean
  verified_by: string | null
  verified_at: string | null
  uploaded_at: string
}

export type Practice = {
  id: string
  practice_group: string
  weekday: number
  start_time: string
  end_time: string | null
  location: string
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type ClubEventType = 'event' | 'banquet' | 'parent_night' | 'fundraiser' | 'meeting' | 'other'

export type ClubEvent = {
  id: string
  title: string
  event_type: ClubEventType
  date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  notes: string | null
  practice_group: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type PracticeCancellation = {
  id: string
  practice_id: string
  date: string
  reason: string | null
  created_at: string
}

export type FamilyGuardian = {
  id: string
  owner_id: string
  guardian_id: string
  created_at: string
}

export type FamilyInvite = {
  id: string
  code: string
  inviter_id: string
  expires_at: string
  redeemed_by: string | null
  redeemed_at: string | null
  created_at: string
}

export type Donation = {
  id: string
  donor_name: string | null
  donor_email: string | null
  amount_cents: number
  recurring: boolean
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  thank_you_sent_at: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
        Relationships: []
      }
      athletes: {
        Row: Athlete
        Insert: Partial<Athlete>
        Update: Partial<Athlete>
        Relationships: []
      }
      tournaments: {
        Row: Tournament
        Insert: Partial<Tournament>
        Update: Partial<Tournament>
        Relationships: []
      }
      tournament_registrations: {
        Row: TournamentRegistration
        Insert: Partial<TournamentRegistration>
        Update: Partial<TournamentRegistration>
        Relationships: []
      }
      dues_payments: {
        Row: DuesPayment
        Insert: Partial<DuesPayment>
        Update: Partial<DuesPayment>
        Relationships: []
      }
      sponsors: {
        Row: Sponsor
        Insert: Partial<Sponsor>
        Update: Partial<Sponsor>
        Relationships: []
      }
      sponsor_tiers: {
        Row: SponsorTierRow
        Insert: Partial<SponsorTierRow>
        Update: Partial<SponsorTierRow>
        Relationships: []
      }
      page_content: {
        Row: PageContentRow
        Insert: Partial<PageContentRow>
        Update: Partial<PageContentRow>
        Relationships: []
      }
      faq_items: {
        Row: FaqItem
        Insert: Partial<FaqItem>
        Update: Partial<FaqItem>
        Relationships: []
      }
      communication_log: {
        Row: CommunicationLogRow
        Insert: Partial<CommunicationLogRow>
        Update: Partial<CommunicationLogRow>
        Relationships: []
      }
      athlete_documents: {
        Row: AthleteDocument
        Insert: Partial<AthleteDocument>
        Update: Partial<AthleteDocument>
        Relationships: []
      }
      donations: {
        Row: Donation
        Insert: Partial<Donation>
        Update: Partial<Donation>
        Relationships: []
      }
      practices: {
        Row: Practice
        Insert: Partial<Practice>
        Update: Partial<Practice>
        Relationships: []
      }
      club_events: {
        Row: ClubEvent
        Insert: Partial<ClubEvent>
        Update: Partial<ClubEvent>
        Relationships: []
      }
      practice_cancellations: {
        Row: PracticeCancellation
        Insert: Partial<PracticeCancellation>
        Update: Partial<PracticeCancellation>
        Relationships: []
      }
      family_guardians: {
        Row: FamilyGuardian
        Insert: Partial<FamilyGuardian>
        Update: Partial<FamilyGuardian>
        Relationships: []
      }
      family_invites: {
        Row: FamilyInvite
        Insert: Partial<FamilyInvite>
        Update: Partial<FamilyInvite>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
  }
}
