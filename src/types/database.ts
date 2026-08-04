export type AppRole = 'admin' | 'staff' | 'parent'
export type AdminScope = 'full' | 'limited'
export type CoachSection = 'board' | 'practice'

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
  // Only set for admins: 'full' can also edit public website content; 'limited'
  // does everything else operational. null for staff/parents.
  admin_scope: AdminScope | null
  phone: string | null
  practice_group: string | null
  sms_opt_in: boolean
  sms_opt_in_at: string | null
  consent_text: string | null
  street_address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  email_unsubscribe_token: string
  is_active: boolean
  onboarding_completed_at: string | null
  parent_tour_seen_at: string | null
  admin_tour_seen_at: string | null
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
  // Asked once when the family joins, not re-asked each season.
  referral_source: string | null
  birth_certificate_url: string | null
  usa_wrestling_card_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

// Contact records for a wrestler's guardians. Distinct from FamilyGuardian,
// which is the portal-login relationship created by an invite code — a person
// here may never hold an account at all.
export type AthleteGuardian = {
  id: string
  athlete_id: string
  ordinal: 1 | 2
  name: string
  relationship: string | null
  phone: string | null
  email: string | null
  coach_interest: string | null
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
  // Some logos (a white or light wordmark on a transparent field) are only
  // legible against a dark backdrop. True renders the sponsor's whole card in
  // black with white name text, instead of the logo vanishing against the
  // standard cream card.
  logo_dark_backdrop: boolean
  // Shown on the partner card and fed to the Organization structured data.
  // Both optional -- a sponsor with neither renders as just logo and name.
  industry: string | null
  description: string | null
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

export type ClubEventType =
  | 'event'
  | 'banquet'
  | 'parent_night'
  | 'fundraiser'
  | 'meeting'
  | 'season_registration'
  | 'other'

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

export type SeasonRegistration = {
  id: string
  event_id: string
  season_label: string
  registration_open_date: string
  registration_close_date: string
  dues_amount_cents: number
  dues_due_date: string | null
  instructions: string | null
  require_usa_card: boolean
  created_at: string
  updated_at: string
}

// One step of a season's price ladder. Windows never overlap (enforced by an
// exclusion constraint), so a date resolves to exactly one tier. A season with
// no tiers prices at its flat dues_amount_cents.
export type SeasonPriceTier = {
  id: string
  season_registration_id: string
  label: string
  starts_on: string
  ends_on: string
  amount_cents: number
  created_at: string
  updated_at: string
}

export type SeasonEnrollmentStatus = 'submitted' | 'changes_requested' | 'approved' | 'withdrawn'

export type SeasonEnrollment = {
  id: string
  season_registration_id: string
  athlete_id: string
  parent_id: string
  dues_payment_id: string | null
  usa_card_document_id: string | null
  status: SeasonEnrollmentStatus
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  admin_note: string | null
  // Re-confirmed every season rather than carried over from the athlete record,
  // because all of these change year to year.
  grade: string | null
  school: string | null
  weight_lbs: number | null
  shirt_size: string | null
  years_experience: string | null
  season_commitment: string | null
  created_at: string
  updated_at: string
}

// A legal agreement, versioned by insert. Superseding one means adding the next
// version and clearing `active` on the old row, so signatures already collected
// keep pointing at the text that was actually on screen.
export type Disclosure = {
  id: string
  slug: string
  title: string
  body: string
  agreement_label: string
  version: number
  required: boolean
  requires_signature: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export type DisclosureAcceptance = {
  id: string
  disclosure_id: string
  season_registration_id: string
  athlete_id: string
  accepted_by: string
  accepted_at: string
  typed_signature: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
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

export type Coach = {
  id: string
  name: string
  role: string
  section: CoachSection
  practice_group: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export type AdminInvite = {
  id: string
  code: string
  scope: AdminScope
  inviter_id: string | null
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
      season_registrations: {
        Row: SeasonRegistration
        Insert: Partial<SeasonRegistration>
        Update: Partial<SeasonRegistration>
        Relationships: []
      }
      season_price_tiers: {
        Row: SeasonPriceTier
        Insert: Partial<SeasonPriceTier>
        Update: Partial<SeasonPriceTier>
        Relationships: []
      }
      season_enrollments: {
        Row: SeasonEnrollment
        Insert: Partial<SeasonEnrollment>
        Update: Partial<SeasonEnrollment>
        Relationships: []
      }
      disclosures: {
        Row: Disclosure
        Insert: Partial<Disclosure>
        Update: Partial<Disclosure>
        Relationships: []
      }
      disclosure_acceptances: {
        Row: DisclosureAcceptance
        Insert: Partial<DisclosureAcceptance>
        Update: Partial<DisclosureAcceptance>
        Relationships: []
      }
      athlete_guardians: {
        Row: AthleteGuardian
        Insert: Partial<AthleteGuardian>
        Update: Partial<AthleteGuardian>
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
      admin_invites: {
        Row: AdminInvite
        Insert: Partial<AdminInvite>
        Update: Partial<AdminInvite>
        Relationships: []
      }
      coaches: {
        Row: Coach
        Insert: Partial<Coach>
        Update: Partial<Coach>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      submit_season_enrollment: {
        Args: {
          _season_registration_id: string
          _athlete_id: string
          // The season's per-wrestler answers. Omitted values leave whatever is
          // already stored on the enrollment alone.
          _grade?: string | null
          _school?: string | null
          _weight_lbs?: number | null
          _shirt_size?: string | null
          _years_experience?: string | null
          _season_commitment?: string | null
        }
        Returns: string
      }
      withdraw_season_enrollment: {
        Args: { _enrollment_id: string }
        Returns: undefined
      }
    }
  }
}
