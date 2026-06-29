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
  practiceGroups: ['Black', 'Gold', 'White'],
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

export const ORG: OrgConfig = CRYSTAL_LAKE_WIZARDS
