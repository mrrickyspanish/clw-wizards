import { DEMO_MODE } from '@/lib/demo'

export interface OrgConfig {
  slug: string
  name: string
  shortName: string
  tagline: string
  domain: string
  contactEmail: string
  ein: string
  mailingAddress: string
  practiceGroups: readonly string[]
  social: {
    facebook?: string
  }
  brand: {
    colors: {
      black: string
      gold: string
      white: string
    }
  }
}

export const CRYSTAL_LAKE_WIZARDS: OrgConfig = {
  slug: 'crystal-lake-wizards',
  name: 'Crystal Lake Wizards Wrestling Club',
  shortName: 'CLW',
  tagline: 'Crystal Lake Wizards Wrestling Club',
  domain: 'crystallakewizards.com',
  contactEmail: 'arfont37@sbcglobal.net',
  ein: '45-5192515',
  mailingAddress: '1807 Black Oak Drive, McHenry, IL 60050',
  practiceGroups: ['Group 1', 'Group 2', 'Group 3', 'Group 4'],
  social: {
    facebook: 'https://www.facebook.com/pages/Wizards-Wrestling-Club/103467966667221',
  },
  brand: {
    colors: {
      black: '#0D0D0D',
      gold: '#F0C020',
      white: '#FFFFFF',
    },
  },
}

// The made-up club the Homefield demo shows (RJ, Nov 14). Every detail is
// invented: the town, the contact address (.example never delivers) and the
// tax number. Used only when NEXT_PUBLIC_DEMO_MODE=1.
export const MOHEGAN_VALLEY_DEMO: OrgConfig = {
  slug: 'mohegan-valley-demo',
  name: 'Mohegan Valley Wrestling Club',
  shortName: 'MVW',
  tagline: 'Mohegan Valley Wrestling Club',
  domain: 'moheganvalley.example',
  contactEmail: 'coach@moheganvalley.example',
  ein: '00-0000000',
  mailingAddress: '100 Riverside Drive, Mohegan Valley',
  practiceGroups: ['Group 1', 'Group 2', 'Group 3', 'Group 4'],
  social: {},
  brand: {
    colors: {
      black: '#0E1A33',
      gold: '#F28C28',
      white: '#FFFFFF',
    },
  },
}

export const ORG: OrgConfig = DEMO_MODE ? MOHEGAN_VALLEY_DEMO : CRYSTAL_LAKE_WIZARDS
