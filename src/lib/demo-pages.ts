// Church demo "Pages" mock (SBC, Nov 20; RJ approved in the SBC chat).
// Staff create and edit pages only inside fixed templates: the wireframe,
// fonts, photo and video positions and section backgrounds are set here, and
// staff fill in the slots. Nothing saves (read-only demo). Pure data, no
// server imports.

export type SlotType = 'text' | 'paragraph' | 'button' | 'image' | 'video' | 'list' | 'linked' | 'date'

export type Slot = {
  key: string
  label: string
  type: SlotType
  help?: string
  /** Character limit for text slots. */
  max?: number
  /** Image shape, e.g. '16:9'. */
  ratio?: string
  /** List slots: allowed item count and the fields of each item. */
  minItems?: number
  maxItems?: number
  item?: Slot[]
}

export type Section = { key: string; label: string; optional?: boolean; slots: Slot[] }

export type TemplateKey = 'story' | 'involved' | 'announcement'

export type PageTemplate = {
  key: TemplateKey
  name: string
  job: string
  bestFor: string
  thumb: string
  sections: Section[]
}

export type Value = string | Record<string, string>[]
export type PageValues = Record<string, Value>

const button = (key: string, label: string): Slot => ({ key, label, type: 'button', max: 24, help: 'Button words. The link is picked from church pages, forms and events.' })
const faq: Section = {
  key: 'faq',
  label: 'Questions and answers',
  optional: true,
  slots: [
    {
      key: 'items',
      label: 'Questions',
      type: 'list',
      minItems: 1,
      maxItems: 8,
      item: [
        { key: 'q', label: 'Question', type: 'text', max: 80 },
        { key: 'a', label: 'Answer', type: 'paragraph', max: 300 },
      ],
    },
  ],
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    key: 'story',
    name: 'Story page',
    job: 'Explain and reassure: what this is, you are welcome, how to reach us.',
    bestFor: 'Care ministries, new member classes, Plan a Visit, About and history pages.',
    thumb: '/images/sbc-pages/grief-hero.jpg',
    sections: [
      {
        key: 'banner',
        label: 'Banner',
        slots: [
          { key: 'photo', label: 'Banner photo or video', type: 'image', ratio: '16:9', help: 'Wide photo. Faces in the middle; the name sits on top.' },
          { key: 'name', label: 'Page name on the banner', type: 'text', max: 40 },
        ],
      },
      {
        key: 'statement',
        label: 'Opening statement',
        slots: [
          { key: 'lead', label: 'Big statement', type: 'text', max: 60 },
          { key: 'intro', label: 'Introduction', type: 'paragraph', max: 260 },
          button('primary', 'Main button'),
          button('secondary', 'Second button'),
        ],
      },
      {
        key: 'welcome',
        label: 'Welcome',
        slots: [
          { key: 'heading', label: 'Heading', type: 'text', max: 30 },
          { key: 'photo', label: 'Large photo', type: 'image', ratio: '4:5' },
          { key: 'place', label: 'Where you meet', type: 'text', max: 40 },
          { key: 'time', label: 'When you meet', type: 'text', max: 40 },
        ],
      },
      {
        key: 'scripture',
        label: 'Scripture',
        optional: true,
        slots: [
          { key: 'verse', label: 'Verse', type: 'paragraph', max: 160 },
          { key: 'ref', label: 'Reference', type: 'text', max: 30 },
        ],
      },
      {
        key: 'resources',
        label: 'Three ways we help',
        slots: [
          { key: 'heading', label: 'Heading', type: 'text', max: 30 },
          {
            key: 'cards',
            label: 'Cards',
            type: 'list',
            minItems: 3,
            maxItems: 3,
            item: [
              { key: 'photo', label: 'Photo', type: 'image', ratio: '1:1' },
              { key: 'title', label: 'Title', type: 'text', max: 28 },
              { key: 'text', label: 'Description', type: 'paragraph', max: 160 },
            ],
          },
        ],
      },
      {
        key: 'panel',
        label: 'Dark panel',
        optional: true,
        slots: [
          { key: 'heading', label: 'Heading', type: 'text', max: 30 },
          { key: 'text', label: 'Text', type: 'paragraph', max: 200 },
          { key: 'points', label: 'List', type: 'list', minItems: 2, maxItems: 5, item: [{ key: 'point', label: 'Point', type: 'text', max: 70 }] },
          button('button', 'Button'),
        ],
      },
      faq,
      {
        key: 'contact',
        label: 'Closing contact',
        slots: [
          { key: 'heading', label: 'Heading', type: 'text', max: 30 },
          { key: 'text', label: 'Text', type: 'paragraph', max: 140 },
          button('button', 'Button'),
        ],
      },
    ],
  },
  {
    key: 'involved',
    name: 'Get Involved page',
    job: 'Show the options and invite people in: the teams, what is coming up, how to join.',
    bestFor: 'Ministries with teams or regular gatherings (youth, music, children), Serve and Small Groups.',
    thumb: '/images/sbc-pages/youth-worship.jpg',
    sections: [
      {
        key: 'top',
        label: 'Title',
        slots: [
          { key: 'name', label: 'Page name', type: 'text', max: 24 },
          { key: 'photo', label: 'Hero photo', type: 'image', ratio: '4:5' },
        ],
      },
      {
        key: 'intro',
        label: 'Introduction',
        slots: [
          { key: 'media', label: 'Video (or photo)', type: 'video', help: 'Upload a video or paste a YouTube link. A poster photo is required.' },
          { key: 'bold', label: 'Headline, bold part', type: 'text', max: 26 },
          { key: 'italic', label: 'Headline, italic part', type: 'text', max: 26 },
          { key: 'accent', label: 'Highlighted line', type: 'text', max: 40 },
          { key: 'text', label: 'Introduction', type: 'paragraph', max: 260 },
          button('primary', 'Main button'),
          button('secondary', 'Second button'),
        ],
      },
      {
        key: 'options',
        label: 'Teams',
        slots: [
          { key: 'heading', label: 'Heading', type: 'text', max: 30 },
          { key: 'sub', label: 'Line under the heading', type: 'text', max: 110 },
          {
            key: 'cards',
            label: 'Team cards',
            type: 'list',
            minItems: 2,
            maxItems: 8,
            item: [
              { key: 'photo', label: 'Photo', type: 'image', ratio: '4:3' },
              { key: 'title', label: 'Title', type: 'text', max: 28 },
              { key: 'text', label: 'One line', type: 'text', max: 100 },
            ],
          },
        ],
      },
      {
        key: 'events',
        label: 'Coming up',
        optional: true,
        slots: [{ key: 'feed', label: 'Upcoming events', type: 'linked', help: 'Filled in automatically from this ministry’s calendar. Nothing to type.' }],
      },
      {
        key: 'join',
        label: 'Join card',
        slots: [
          { key: 'heading', label: 'Heading', type: 'text', max: 30 },
          { key: 'text', label: 'Text', type: 'paragraph', max: 160 },
          button('button', 'Button'),
        ],
      },
      faq,
    ],
  },
  {
    key: 'announcement',
    name: 'Announcement',
    job: 'A card on the home page and events list, with an optional page for the details.',
    bestFor: 'Events, concerts and breakfasts, milestones like the 160th, news and recaps.',
    thumb: '/images/sbc-pages/concert.jpg',
    sections: [
      {
        key: 'card',
        label: 'Home page card',
        slots: [
          { key: 'photo', label: 'Photo or video', type: 'image', ratio: '16:9' },
          { key: 'label', label: 'Small label', type: 'text', max: 30 },
          { key: 'bold', label: 'Headline, bold part', type: 'text', max: 24 },
          { key: 'italic', label: 'Headline, italic part', type: 'text', max: 24 },
          { key: 'text', label: 'One or two lines', type: 'paragraph', max: 120 },
          { key: 'date', label: 'Date shown on the card', type: 'text', max: 30 },
          button('button', 'Button'),
          { key: 'from', label: 'Show from', type: 'date' },
          { key: 'until', label: 'Show until', type: 'date', help: 'The card comes down on its own after this date.' },
        ],
      },
      {
        key: 'when',
        label: 'Date, time and place',
        optional: true,
        slots: [
          { key: 'date', label: 'Date', type: 'text', max: 30 },
          { key: 'time', label: 'Time', type: 'text', max: 30 },
          { key: 'place', label: 'Place', type: 'text', max: 50 },
        ],
      },
      { key: 'details', label: 'Details', slots: [{ key: 'text', label: 'Details', type: 'paragraph', max: 600 }] },
      {
        key: 'schedule',
        label: 'Schedule',
        optional: true,
        slots: [
          {
            key: 'rows',
            label: 'Schedule rows',
            type: 'list',
            minItems: 1,
            maxItems: 10,
            item: [
              { key: 'time', label: 'Time', type: 'text', max: 12 },
              { key: 'what', label: 'What happens', type: 'text', max: 60 },
            ],
          },
        ],
      },
      {
        key: 'gallery',
        label: 'Photo gallery',
        optional: true,
        slots: [{ key: 'photos', label: 'Photos', type: 'list', minItems: 3, maxItems: 12, item: [{ key: 'photo', label: 'Photo', type: 'image', ratio: '1:1' }] }],
      },
      { key: 'signup', label: 'Sign-up', slots: [button('button', 'Button')] },
    ],
  },
]

export function templateFor(key: string | undefined): PageTemplate {
  return PAGE_TEMPLATES.find((t) => t.key === key) ?? PAGE_TEMPLATES[0]
}

export type PageStatus = 'Published' | 'Draft' | 'In review'

export type SamplePage = {
  slug: string
  title: string
  template: TemplateKey
  ministry: string
  status: PageStatus
  editedBy: string
  edited: string
  values: PageValues
  hidden?: string[]
  /** In review: who sent it and their note, plus the live version it would replace. */
  submittedBy?: string
  note?: string
  live?: PageValues
}

export const MINISTRY_OPTIONS = ['Church-wide', 'Brotherhood', 'ELEVATE Youth', 'Grief & Recovery', 'Health Care', 'Hospitality', 'Music Ministry']

const P = '/images/sbc-pages'

const griefValues: PageValues = {
  'banner.photo': `${P}/grief-banner.jpg`,
  'banner.name': 'grief & recovery',
  'statement.lead': "You don't have to grieve alone.",
  'statement.intro':
    'The Grief and Recovery Ministry supports individuals and families through the challenging journey of mourning and healing.',
  'statement.primary': 'Request Support',
  'statement.secondary': 'Ask a Question',
  'welcome.heading': 'Come As You Are.',
  'welcome.photo': `${P}/grief-hero.jpg`,
  'welcome.place': 'Second Baptist Church, 1280 Summit St',
  'welcome.time': 'Weekly (sample time)',
  'scripture.verse': 'The Lord is close to the brokenhearted; he rescues those whose spirits are crushed.',
  'scripture.ref': 'Psalm 34:18 (NLT)',
  'resources.heading': 'How We Walk With You',
  'resources.cards': [
    { photo: `${P}/grief-groups.jpg`, title: 'Support Groups', text: 'Confidential small-group meetings where people share, receive encouragement and learn tools for grief.' },
    { photo: `${P}/grief-coach.jpg`, title: 'Individual Support', text: 'One-on-one meetings with trained ministry coaches.' },
    { photo: `${P}/grief-workshop.jpg`, title: 'Workshops & Seminars', text: 'Sessions on grief, healthy coping and faith-based hope.' },
  ],
  'panel.heading': 'Requesting Support',
  'panel.text': 'Complete the request form, or email the ministry with any questions.',
  'panel.points': [{ point: 'The death of a spouse, parent, child or friend' }, { point: 'Holidays and anniversaries that reopen the hurt' }, { point: 'Grief that returns years later' }],
  'panel.button': 'Start the Request Form',
  'faq.items': [
    { q: 'Who is Grief & Recovery for?', a: 'Anyone who is grieving, and the people who love them. You do not need to be a member.' },
    { q: 'Is it confidential?', a: 'Yes. What you share stays with the ministry team.' },
  ],
  'contact.heading': 'Questions?',
  'contact.text': 'Email the ministry and someone from the team will write back to you.',
  'contact.button': 'Email the Ministry',
}

const youthValues: PageValues = {
  'top.name': 'ELEVATE',
  'top.photo': `${P}/youth-serve.jpg`,
  'intro.media': `${P}/youth-worship.jpg`,
  'intro.bold': 'Grow in Faith.',
  'intro.italic': 'Find Your People.',
  'intro.accent': 'Sundays at Teen Church',
  'intro.text': "ELEVATE is SBC's youth ministry. Worship with your friends at Teen Church every Sunday, then use your gifts on a team that fits you.",
  'intro.primary': 'Join ELEVATE',
  'intro.secondary': 'Parents Start Here',
  'options.heading': 'Find Your Lane',
  'options.sub': "Dance, sing, run cameras or help lead the service. There's a team for you.",
  'options.cards': [
    { photo: `${P}/youth-step.jpg`, title: 'Dance & Step', text: 'Praise dance and step teams.' },
    { photo: `${P}/youth-praise.jpg`, title: 'Music & Praise', text: 'Youth praise team and Youth Orchestra.' },
    { photo: `${P}/youth-av.jpg`, title: 'AV & Media', text: 'Cameras, sound and the Sunday livestream.' },
    { photo: `${P}/ushers.jpg`, title: 'Ushers & Scripture', text: 'Greeting people and reading scripture.' },
  ],
  'join.heading': 'Join ELEVATE',
  'join.text': 'Ages 13 to 18. Tell us your grade and a parent will get a text with what to expect.',
  'join.button': 'Sign Me Up',
  'faq.items': [{ q: 'When does it meet?', a: 'Teen Church meets on Sundays. Special events are posted here.' }],
}

const musicLive: PageValues = {
  'top.name': 'Music Ministry',
  'top.photo': `${P}/choir.jpg`,
  'intro.media': `${P}/concert.jpg`,
  'intro.bold': 'Make a Joyful',
  'intro.italic': 'Noise.',
  'intro.accent': 'Rehearsals every week',
  'intro.text': 'Choirs, praise teams and musicians who lead the church in worship every Sunday.',
  'intro.primary': 'Join a Choir',
  'intro.secondary': 'Watch the Concert',
  'options.heading': 'Find Your Choir',
  'options.sub': 'Every voice is welcome. Pick the group that fits you.',
  'options.cards': [
    { photo: `${P}/choir.jpg`, title: 'Choral Ensemble', text: 'Anthems and hymns for Sunday worship.' },
    { photo: `${P}/youth-praise.jpg`, title: 'Praise Team', text: 'Leads the opening praise and worship.' },
    { photo: `${P}/concert.jpg`, title: 'Male Chorus', text: 'The men of SBC in song.' },
  ],
  'join.heading': 'Come Sing With Us',
  'join.text': 'No audition for most groups. Come to a rehearsal and meet the director.',
  'join.button': 'Join a Choir',
  'faq.items': [{ q: 'Do I need to read music?', a: 'No. Many members learn by ear.' }],
}

const musicProposed: PageValues = {
  ...musicLive,
  'intro.accent': 'Christmas rehearsals start December 1',
  'intro.text': 'Choirs, praise teams and musicians who lead the church in worship every Sunday. Christmas music rehearsals start December 1.',
  'options.cards': [
    ...(musicLive['options.cards'] as Record<string, string>[]),
    { photo: `${P}/youth-worship.jpg`, title: 'Youth Choir', text: 'Teens leading worship once a month.' },
  ],
}

const concertValues: PageValues = {
  'card.photo': `${P}/concert.jpg`,
  'card.label': '2026 Choir Concert',
  'card.bold': 'Thank You',
  'card.italic': 'for Everything',
  'card.text': 'Our choirs and musicians filled the sanctuary with praise. Watch the highlights.',
  'card.date': 'November 8',
  'card.button': 'Watch the Highlights',
  'card.from': '2026-11-09',
  'card.until': '2026-12-06',
  'details.text': 'Highlights from the Music Ministry concert on Sunday, November 8.',
  'signup.button': 'Watch the Highlights',
}

const breakfastValues: PageValues = {
  'card.photo': `${P}/mens-breakfast.jpg`,
  'card.label': 'Brotherhood',
  'card.bold': "Men's",
  'card.italic': 'Breakfast',
  'card.text': 'Coffee, a hot breakfast and a word for the week. Bring a friend.',
  'card.date': 'Saturday, December 12',
  'card.button': 'Save My Seat',
  'card.from': '2026-11-23',
  'card.until': '2026-12-12',
  'when.date': 'Saturday, December 12',
  'when.time': '9:00 to 10:30 AM',
  'when.place': 'Fellowship Hall, 1280 Summit St',
  'details.text': 'All men of SBC and their guests are welcome. Breakfast is served at 9:00, followed by a short message and prayer.',
  'schedule.rows': [
    { time: '9:00 AM', what: 'Breakfast' },
    { time: '9:40 AM', what: 'A word for the week' },
    { time: '10:15 AM', what: 'Prayer and fellowship' },
  ],
  'signup.button': 'Save My Seat',
}

const healthValues: PageValues = {
  'banner.photo': `${P}/health.jpg`,
  'banner.name': 'health care',
  'statement.lead': 'Caring for the whole person.',
  'statement.intro': 'Health education and care from skilled practitioners in our church family.',
  'statement.primary': 'Upcoming Screenings',
  'statement.secondary': 'Ask a Nurse',
  'welcome.heading': 'Health Fair Sundays',
  'welcome.photo': `${P}/health.jpg`,
  'welcome.place': 'Fellowship Hall',
  'welcome.time': 'Sample time',
  'resources.heading': 'How We Help',
  'resources.cards': [
    { photo: `${P}/health.jpg`, title: 'Screenings', text: 'Blood pressure checks and health fairs.' },
    { photo: `${P}/greeters.jpg`, title: 'Education', text: 'Classes on the health issues our community faces.' },
    { photo: `${P}/grief-coach.jpg`, title: 'Care Visits', text: 'Checking in on members who are ill.' },
  ],
  'contact.heading': 'Questions?',
  'contact.text': 'Email the Health Care Ministry.',
  'contact.button': 'Email the Ministry',
}

export const SAMPLE_PAGES: SamplePage[] = [
  { slug: 'grief-recovery', title: 'Grief & Recovery', template: 'story', ministry: 'Grief & Recovery', status: 'Published', editedBy: 'Jordan Ellis', edited: 'Nov 16', values: griefValues },
  { slug: 'elevate', title: 'ELEVATE Youth', template: 'involved', ministry: 'ELEVATE Youth', status: 'Published', editedBy: 'Jordan Ellis', edited: 'Nov 16', values: youthValues, hidden: ['events'] },
  {
    slug: 'music-ministry',
    title: 'Music Ministry',
    template: 'involved',
    ministry: 'Music Ministry',
    status: 'In review',
    editedBy: 'Andre Lewis',
    edited: 'Nov 20',
    values: musicProposed,
    live: musicLive,
    hidden: ['events'],
    submittedBy: 'Andre Lewis (Ministry Admin, Music Ministry)',
    note: 'Added the Youth Choir and the Christmas rehearsal date.',
  },
  { slug: 'choir-concert-2026', title: '2026 Choir Concert', template: 'announcement', ministry: 'Music Ministry', status: 'Published', editedBy: 'Jordan Ellis', edited: 'Nov 17', values: concertValues, hidden: ['when', 'schedule', 'gallery'] },
  {
    slug: 'mens-breakfast',
    title: "Men's Breakfast",
    template: 'announcement',
    ministry: 'Brotherhood',
    status: 'In review',
    editedBy: 'Lena Brooks',
    edited: 'Nov 20',
    values: breakfastValues,
    hidden: ['gallery'],
    submittedBy: 'Lena Brooks (Page Editor)',
    note: 'New page for the December breakfast. Brotherhood asked for it on the home page.',
  },
  { slug: 'health-care', title: 'Health Care Ministry', template: 'story', ministry: 'Health Care', status: 'Draft', editedBy: 'Lena Brooks', edited: 'Nov 19', values: healthValues, hidden: ['scripture', 'panel', 'faq'] },
]

export function samplePage(slug: string | undefined): SamplePage | undefined {
  return SAMPLE_PAGES.find((p) => p.slug === slug)
}

/** Placeholder content for a brand-new page: each slot's label, so staff see where everything goes. */
export function starterValues(template: PageTemplate, title: string): PageValues {
  const values: PageValues = {}
  for (const section of template.sections) {
    for (const slot of section.slots) {
      const id = `${section.key}.${slot.key}`
      if (slot.type === 'list') {
        values[id] = Array.from({ length: slot.minItems ?? 1 }, () =>
          Object.fromEntries((slot.item ?? []).map((f) => [f.key, f.type === 'image' ? template.thumb : f.label]))
        )
      } else if (slot.type === 'image' || slot.type === 'video') values[id] = template.thumb
      else if (slot.type === 'linked' || slot.type === 'date') values[id] = ''
      else values[id] = slot.key === 'name' ? title : slot.label
    }
  }
  return values
}

/** Page address made from the title. */
export function slugFor(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
