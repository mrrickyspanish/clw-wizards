// Homefield demo build step, part 2 (RJ, Nov 15). Runs before `next build`
// right after demo-assets.mjs, and does nothing unless NEXT_PUBLIC_DEMO_MODE=1.
// In a demo build it rewrites the build's own copy of the source so every real
// club detail reads as the invented Mohegan Valley Wrestling Club: the club
// name, town, gym address, the coaches' and board members' names and phone
// numbers, and the "W" monogram. The live club never runs this, and the repo's
// files are never changed: on Vercel each build starts from a fresh checkout.
//
// Locally it refuses to touch your checkout. Point it at a copy instead:
//   NEXT_PUBLIC_DEMO_MODE=1 node scripts/demo-copy.mjs --root /path/to/copy
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

if (process.env.NEXT_PUBLIC_DEMO_MODE !== '1') process.exit(0)

const rootArg = process.argv.indexOf('--root')
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const root = rootArg > -1 ? path.resolve(process.argv[rootArg + 1]) : repo
if (rootArg === -1 && process.env.VERCEL !== '1') {
  console.error('Homefield demo copy: not on Vercel, so this checkout was left alone. Use --root <copy>.')
  process.exit(0)
}

// Files that must keep the real names: both club configs live in one file, and
// the demo's own code already speaks Mohegan Valley.
const SKIP = new Set(['src/config/org.config.ts', 'src/lib/demo.ts', 'src/lib/demo-seed.ts'])

// Longest and most specific first: each rule sees the text the rules above it
// left behind.
const RULES = [
  // People (Nov 15 club roster) → the invented staff the demo seed creates.
  ['Anthony Fontanetta', 'Pat Ferris'],
  ['Tony Fontanetta', 'Pat Ferris'],
  ['Coach Tony', 'Coach Ferris'],
  [/\bTony(?=[’']s\b)/g, 'Coach Ferris'],
  [/\bTony\b/g, 'Coach Ferris'],
  ['Sabrina Jimenez', 'Casey Brooks'],
  ['Julie Swierk', 'Morgan Hale'],
  ['Steve Swierk', 'Lee Ostrander'],
  ['Jeramy Carbone', 'Robin Kade'],
  ['Tyler Simmons', 'Jordan Avery'],
  ['Alex Flores', 'Sam Rowe'],
  ['Ryan Schweikhofer', 'Drew Patel'],
  ['Matt Fiodirosa', 'Quinn Mercer'],
  ["initials: 'TF'", "initials: 'PF'"],
  ["initials: 'SJ'", "initials: 'CB'"],
  ["initials: 'SS'", "initials: 'LO'"],
  ['312-656-7335', '555-0101'],
  ['815-482-4464', '555-0102'],
  ['630-886-1769', '555-0103'],

  // The link preview's alt text (its photo is swapped for a stock one).
  ['a young wrestler in a Wizard Wrestling jacket at a tournament', 'a young wrestler at a tournament'],

  // The gym.
  ['975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014', '100+Riverside+Drive+Mohegan+Valley'],
  ['975 Nimco Drive, Unit L in Crystal Lake', '100 Riverside Drive in Mohegan Valley'],
  ['975 Nimco Drive, Unit L', '100 Riverside Drive'],
  ['975 Nimco Dr, Unit L', '100 Riverside Drive'],

  // The club.
  ['Located in Crystal Lake, Illinois, Wizards Wrestling Club', 'Located in Mohegan Valley, our club'],
  [/\b([Tt]he) Wizards (?=booster|community|season|wrestling room|golf outing|practice room)/g, '$1 Mohegan Valley '],
  ['Crystal Lake Wizards Wrestling Club', 'Mohegan Valley Wrestling Club'],
  [/(?:the )?Crystal Lake Wizards'(?= [a-z])/g, "Mohegan Valley's"],
  ['Crystal Lake Wizards', 'Mohegan Valley Wrestling'],
  ['crystal lake wizard', 'mohegan valley'],
  ['The Wizards Wrestling Club', 'Mohegan Valley Wrestling Club'],
  ['Wizards Wrestling Club', 'Mohegan Valley Wrestling Club'],
  ['Wizards Wrestling', 'Mohegan Valley Wrestling'],
  ['Interested%20in%20Wizards%20Wrestling', 'Interested%20in%20Mohegan%20Valley'],
  ['Supporting%20the%20Wizards', 'Supporting%20Mohegan%20Valley'],
  ['CLW Wizards', 'MVW'],
  ['Wizards Facility', 'Club Facility'],
  ['Wizards for Life', 'Valley for Life'],
  ['Wizards registered', 'wrestlers registered'],
  ['next generation of Wizards', 'next generation of Mohegan Valley wrestlers'],
  ['The Wizards are', 'Mohegan Valley is'],
  ['The Wizards train', 'Our wrestlers train'],
  ['the Wizards', 'Mohegan Valley'],
  ['The Wizards', 'Mohegan Valley'],
  [/\bWizards\b/g, 'Mohegan Valley'],
  ['Wizard for Life', 'Valley for Life'],
  [/\bWizard\b/g, 'Valley'],
  [/\bCLW\b/g, 'MVW'],

  // The town and county.
  ['Crystal Lake and McHenry County, IL', 'Mohegan Valley'],
  ['Crystal Lake and McHenry County', 'Mohegan Valley'],
  ['Crystal Lake Park District', 'Mohegan Valley Parks & Recreation'],
  ['Crystal Lake, IL 60014', 'Mohegan Valley'],
  ['Crystal Lake, Illinois', 'Mohegan Valley'],
  ['Crystal Lake, IL', 'Mohegan Valley'],
  ['Crystal Lake', 'Mohegan Valley'],
  ['McHenry County, IL', 'the Mohegan Valley area'],
  ['McHenry County', 'Mohegan Valley'],

  // Hard-coded club colours (SVG edges, calendar dots, the error page): navy and orange.
  [/#F0C020/gi, '#F28C28'],
  [/rgba\(240,\s*192,\s*32/g, 'rgba(242,140,40'],
  [/#080808/gi, '#0E1A33'],
  [/#f5ce50/gi, '#F7A85C'],

  // The "W" monogram in the header, the big background letters and the tab icon.
  [/(font-display[^"]*">)W(<\/(?:span|div)>)/g, '$1M$2'],
  [/(\n\s*)W(\n\s*<\/div>)/g, '$1M$2'],
]

async function* sourceFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* sourceFiles(file)
    else if (/\.(tsx?|mjs|txt)$|\.module\.css$/.test(entry.name)) yield file
  }
}

let changed = 0
for await (const file of sourceFiles(path.join(root, 'src'))) {
  const rel = path.relative(root, file).split(path.sep).join('/')
  if (SKIP.has(rel)) continue
  const before = await readFile(file, 'utf8')
  let text = before
  for (const [from, to] of RULES) text = typeof from === 'string' ? text.split(from).join(to) : text.replace(from, to)
  if (text !== before) {
    await writeFile(file, text)
    changed++
  }
}
console.log(`Homefield demo: rewrote the club's details in ${changed} files.`)
