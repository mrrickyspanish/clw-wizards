// Editable marketing-content registry. Each entry is one editable slot on a
// public page: a stable key, how it renders (type), which page it lives on
// (group + revalidate path), and its DEFAULT — the exact copy currently shipped.
//
// Defaults live here (not in the DB), so:
//   * the site renders identically until someone edits a field, and
//   * the admin editor can always show the current effective value.
// The page_content table only stores overrides.
//
// To make a new slot editable: add an entry here, then read it in the component
// via getSiteContent(). Nothing else is required.

export type ContentFieldType = 'text' | 'textarea' | 'image'

export type ContentField = {
  key: string
  label: string
  type: ContentFieldType
  group: string
  default: string
  help?: string
  /** Public path to revalidate when this field changes. */
  revalidate: string
}

export const CONTENT_FIELDS: ContentField[] = [
  // --- Home · Hero ---------------------------------------------------------
  {
    key: 'home.hero.line1',
    label: 'Headline line 1',
    type: 'text',
    group: 'Home · Hero',
    default: 'Work.',
    revalidate: '/',
  },
  {
    key: 'home.hero.line2',
    label: 'Headline line 2',
    type: 'text',
    group: 'Home · Hero',
    default: 'Compete.',
    revalidate: '/',
  },
  {
    key: 'home.hero.line3',
    label: 'Headline line 3 (gold)',
    type: 'text',
    group: 'Home · Hero',
    default: 'Repeat.',
    revalidate: '/',
  },
  {
    key: 'home.hero.photo',
    label: 'Mobile hero photo',
    type: 'image',
    group: 'Home · Hero',
    default: '/images/real/clw-wizards-hero-photo-2.jpg',
    help: 'Background photo on phones. Desktop uses the composed hero artwork.',
    revalidate: '/',
  },

  // --- Home · Intro (McHenry County section) -------------------------------
  {
    key: 'home.intro.body1',
    label: 'Intro paragraph 1',
    type: 'textarea',
    group: 'Home · Intro',
    default:
      'The Wizards Wrestling Club helps young wrestlers take the next step, whether they are learning the basics or chasing bigger goals. Our club gives kids a place to train hard, build confidence, and represent McHenry County with pride.',
    revalidate: '/',
  },
  {
    key: 'home.intro.body2',
    label: 'Intro paragraph 2',
    type: 'textarea',
    group: 'Home · Intro',
    default: 'We are volunteer-run, family-powered, and committed to helping every wrestler grow.',
    revalidate: '/',
  },
  {
    key: 'home.intro.stat_years',
    label: 'Stat — years',
    type: 'text',
    group: 'Home · Intro',
    default: '45+',
    revalidate: '/',
  },
  {
    key: 'home.intro.stat_wrestlers',
    label: 'Stat — wrestlers',
    type: 'text',
    group: 'Home · Intro',
    default: '120+',
    revalidate: '/',
  },

  // --- Home · Coach Tony ---------------------------------------------------
  {
    key: 'home.tony.quote',
    label: 'Tony’s quote',
    type: 'textarea',
    group: 'Home · Coach Tony',
    default:
      'I started this club to give McHenry County kids a room where they get pushed hard and supported harder. We build tough, confident kids first — the wins take care of themselves.',
    help: 'Tony’s philosophy quote on the home page.',
    revalidate: '/',
  },
  {
    key: 'home.tony.photo',
    label: 'Tony’s photo',
    type: 'image',
    group: 'Home · Coach Tony',
    default: '/images/real/clw-wizards-youth-banquet-tony.jpg',
    revalidate: '/',
  },
]

export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(
  CONTENT_FIELDS.map((f) => [f.key, f.default]),
)

const FIELD_BY_KEY = new Map(CONTENT_FIELDS.map((f) => [f.key, f]))

export function isContentKey(key: string): boolean {
  return FIELD_BY_KEY.has(key)
}

export function contentField(key: string): ContentField | undefined {
  return FIELD_BY_KEY.get(key)
}
