export interface OrgConfig {
  slug: string
  name: string
  shortName: string
  tagline: string
  domain: string
  contactEmail: string
  practiceGroups: readonly string[]
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
  contactEmail: 'info@crystallakewizards.com',
  practiceGroups: ['Black', 'Gold', 'White', 'Wizard for Life'],
  brand: {
    colors: {
      black: '#0D0D0D',
      gold: '#F0C020',
      white: '#FFFFFF',
    },
  },
}

export const ORG: OrgConfig = CRYSTAL_LAKE_WIZARDS
