import type { TourStepConfig } from './TourProvider'

export const PARENT_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'nav',
    title: 'Your navigation',
    body: 'Everything for your family lives here — athletes, tournaments, dues, and documents.',
  },
  {
    id: 'hero',
    title: "What's next",
    body: 'Your next practice or event is always front and center, so you never have to go looking for it.',
  },
  {
    id: 'seasonRegistration',
    title: 'Season registration',
    body: 'Register for the season and track your status right from the dashboard.',
  },
  {
    id: 'stats',
    title: 'Your family at a glance',
    body: 'A quick look at your wrestlers, upcoming events, and uploaded documents.',
  },
  {
    id: 'wrestlers',
    title: 'My wrestlers',
    body: 'Manage your athletes here, or add a new wrestler any time.',
  },
  {
    id: 'quickActions',
    title: 'Quick actions',
    body: 'Jump straight to tournaments, document uploads, or reach out to the club.',
  },
]

export const PARENT_TOUR_STEPS_NO_ATHLETES: TourStepConfig[] = [
  {
    id: 'nav',
    title: 'Your navigation',
    body: 'Everything for your family lives here — athletes, tournaments, dues, and documents.',
  },
  {
    id: 'seasonRegistration',
    title: 'Season registration',
    body: 'Register for the season here, then add your wrestler to unlock the rest of your dashboard.',
  },
  {
    id: 'welcome',
    title: 'Add your wrestler',
    body: 'Once you add a wrestler, this page becomes your family’s hub for practices, tournaments, dues, and documents.',
  },
]

export const ADMIN_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'nav',
    title: 'Admin navigation',
    body: 'Manage families, registrations, tournaments, practices, dues, sponsors, and communications from here.',
  },
  {
    id: 'stats',
    title: 'Club overview',
    body: 'A quick snapshot of active families, wrestlers, open tournaments, and outstanding dues — tap any card to dig in.',
  },
]
