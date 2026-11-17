// Church reskin build step (Creative Eye proposal for Second Baptist Church of
// Elgin, Nov 16). Runs before `next build`, after demo-copy.mjs, and does
// nothing unless NEXT_PUBLIC_DEMO_MODE=1 and NEXT_PUBLIC_DEMO_FLAVOR=church.
//
// It relabels the platform's everyday words for a church office: parents
// become members, wrestlers become participants, practice groups become
// ministries, coaches become group leaders, dues become giving. Cosmetic only.
//
// Unlike demo-copy.mjs it reads each file with the TypeScript parser and
// changes ONLY text a person sees: string literals, template text and JSX
// text. Code names, database table and column names (the arguments of
// .from(), .select(), .eq() and so on), comparisons, object keys, links,
// class names and types are left alone, so the app works exactly as before.
// Lower-case words are only changed inside text with a space in it, so a lone
// value like 'parent' (a role) or 'athletes' (a table) is never touched.
//
// Locally it refuses to touch your checkout. Point it at a copy instead:
//   NEXT_PUBLIC_DEMO_MODE=1 NEXT_PUBLIC_DEMO_FLAVOR=church node scripts/demo-church.mjs --root /path/to/copy
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

if (process.env.NEXT_PUBLIC_DEMO_MODE !== '1' || process.env.NEXT_PUBLIC_DEMO_FLAVOR !== 'church') process.exit(0)

const require = createRequire(import.meta.url)
const ts = require('typescript')

const rootArg = process.argv.indexOf('--root')
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const root = rootArg > -1 ? path.resolve(process.argv[rootArg + 1]) : repo
if (rootArg === -1 && process.env.VERCEL !== '1') {
  console.error('Church demo labels: not on Vercel, so this checkout was left alone. Use --root <copy>.')
  process.exit(0)
}

const SKIP = new Set(['src/config/org.config.ts', 'src/lib/demo.ts', 'src/lib/demo-seed.ts', 'src/lib/demo-seed-church.ts'])

// Any text: phrases and capitalised words. Order matters: longer phrases first,
// and "Group" becomes "Ministry" before "Coach" becomes "Group Leader".
const ANY = [
  ['Parent Portal', 'Member Portal'],
  ['Parent view', 'Member view'],
  ['Parent / Staff Login', 'Member / Staff Login'],
  ['Season Registrations', 'Ministry Sign-ups'],
  ['Season registrations', 'Ministry sign-ups'],
  ['Season Registration', 'Ministry Sign-up'],
  ['Season registration', 'Ministry sign-up'],
  ['Registrations', 'Sign-ups'],
  ['Registration', 'Sign-up'],
  ['Weight class', 'Serving role'],
  ['USA Wrestling cards', 'Background checks'],
  ['USA Wrestling card', 'Background check'],
  ['USA Wrestling', 'background check'],
  ['USA cards', 'Background checks'],
  ['USA card', 'Background check'],
  ['Birth certificates', 'Volunteer forms'],
  ['Birth certificate', 'Volunteer form'],
  ['Outstanding dues', 'Open pledges'],
  ['Outstanding balance', 'Open pledges'],
  ['Practices & Events', 'Meetings & Events'],
  ['Practice groups', 'Ministries'],
  ['Practice group', 'Ministry'],
  ['Practice schedule', 'Meeting schedule'],
  ['Practices', 'Meetings'],
  ['Practice', 'Meeting'],
  ['Groups', 'Ministries'],
  ['Group', 'Ministry'],
  ['Coaches', 'Group Leaders'],
  ['Coach', 'Group Leader'],
  ['Families', 'Members'],
  ['Family', 'Household'],
  ['Parents', 'Members'],
  ['Parent', 'Member'],
  ['Wrestlers', 'Participants'],
  ['Wrestler', 'Participant'],
  ['Athletes', 'Participants'],
  ['Athlete', 'Participant'],
  ['Tournaments', 'Retreats & Trips'],
  ['Tournament', 'Retreat'],
  ['Dues', 'Giving'],
  ['Sponsors', 'Community Partners'],
  ['Sponsor', 'Community Partner'],
  ['Weigh-in', 'Check-in'],
  ['TrackWrestling', 'the sign-up site'],
  ['Wrestling', 'Ministry'],
  ['Club', 'Church'],
]

// Lower-case words, only inside text that has a space in it.
const SENTENCE = [
  ['wrestling cards', 'background checks'],
  ['wrestling card', 'background check'],
  ['season registration', 'ministry sign-up'],
  ['registrations', 'sign-ups'],
  ['registration', 'sign-up'],
  ['practice groups', 'ministries'],
  ['practice group', 'ministry'],
  ['practices', 'meetings'],
  ['practice', 'meeting'],
  ['groups', 'ministries'],
  ['coaches', 'group leaders'],
  ['coach', 'group leader'],
  ['families', 'members'],
  ['family', 'household'],
  ['parents', 'members'],
  ['parent', 'member'],
  ['wrestlers', 'participants'],
  ['wrestler', 'participant'],
  ['athletes', 'participants'],
  ['athlete', 'participant'],
  ['tournaments', 'retreats'],
  ['tournament', 'retreat'],
  ['dues', 'giving'],
  ['sponsors', 'community partners'],
  ['sponsor', 'community partner'],
  ['weigh-in', 'check-in'],
  ['wrestling', 'ministry'],
  ['club', 'church'],
]

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const compile = (rules) => rules.map(([from, to]) => [new RegExp(`(?<![A-Za-z0-9_])${esc(from)}(?![A-Za-z0-9_])`, 'g'), to])
const ANY_RX = compile(ANY)
const SENTENCE_RX = compile(SENTENCE)

function relabel(text) {
  let out = text
  for (const [rx, to] of ANY_RX) out = out.replace(rx, to)
  if (/\s/.test(out)) for (const [rx, to] of SENTENCE_RX) out = out.replace(rx, to)
  return out
}

// Calls whose string arguments are data, not words on screen.
const DATA_CALLS = new Set([
  'from', 'select', 'eq', 'neq', 'in', 'is', 'not', 'or', 'and', 'filter', 'match', 'order', 'ilike', 'like',
  'contains', 'containedBy', 'overlaps', 'gt', 'gte', 'lt', 'lte', 'range', 'rpc', 'upsert', 'onConflict',
  'getPublicUrl', 'upload', 'remove', 'list', 'createSignedUrl', 'download',
  'revalidatePath', 'revalidateTag', 'redirect', 'push', 'replace', 'prefetch', 'get', 'getAll', 'has', 'set',
  'append', 'delete', 'cookies', 'headers', 'fetch', 'require', 'import', 'getSiteContent', 'useSearchParams',
  'querySelector', 'querySelectorAll', 'getElementById', 'addEventListener', 'removeEventListener', 'cn', 'clsx', 'cva',
])
const DATA_ATTRS = new Set([
  'className', 'href', 'src', 'id', 'htmlFor', 'name', 'type', 'key', 'role', 'variant', 'size', 'autoComplete',
  'inputMode', 'target', 'rel', 'method', 'action', 'value', 'defaultValue', 'pattern', 'accept', 'as', 'srcSet',
  'sizes', 'media', 'form', 'data-state', 'side', 'align',
])

function isDataContext(node) {
  for (let n = node.parent, child = node; n; child = n, n = n.parent) {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n) || ts.isImportTypeNode?.(n)) return true
    if (ts.isLiteralTypeNode(n) || ts.isTypeNode(n)) return true
    if (ts.isPropertyAssignment(n) && n.name === child) return true
    if (ts.isElementAccessExpression(n) && n.argumentExpression === child) return true
    if (ts.isCaseClause(n) && n.expression === child) return true
    if (ts.isBinaryExpression(n) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(n.operatorToken.kind)) return true
    if (ts.isJsxAttribute(n)) return DATA_ATTRS.has(n.name.getText())
    // Only what is passed INTO a data call is data; the thing it is called on
    // (['Wrestlers', ...].filter(...)) is still words on screen.
    if ((ts.isCallExpression(n) || ts.isNewExpression(n)) && (n.arguments ?? []).includes(child)) {
      const callee = n.expression
      const name = ts.isPropertyAccessExpression(callee) ? callee.name.text : ts.isIdentifier(callee) ? callee.text : ''
      if (DATA_CALLS.has(name)) return true
      if (name === 'includes' || name === 'startsWith' || name === 'endsWith' || name === 'indexOf') return true
    }
    // Stop at the nearest statement or JSX element: beyond it, context no longer applies.
    if (ts.isStatement(n) || ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) return false
  }
  return false
}

function rewrite(file, source) {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind)
  const edits = []
  const visit = (node) => {
    let start, end, raw
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      start = node.getStart(sf) + 1
      end = node.getEnd() - 1
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      start = node.getStart(sf) + 1
      end = node.getEnd() - (ts.isTemplateTail(node) ? 1 : 2)
    } else if (ts.isJsxText(node)) {
      // Full start, so " wrestler" keeps its space and reads as a sentence.
      start = node.pos
      end = node.getEnd()
    }
    if (start !== undefined && end >= start) {
      raw = source.slice(start, end)
      if (raw.trim() && !isDataContext(ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) ? node.parent.parent ?? node.parent : node)) {
        const next = relabel(raw)
        if (next !== raw) edits.push([start, end, next])
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  if (!edits.length) return source
  edits.sort((a, b) => b[0] - a[0])
  let out = source
  for (const [s, e, text] of edits) out = out.slice(0, s) + text + out.slice(e)
  return out
}

async function* sourceFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* sourceFiles(file)
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) yield file
  }
}

let changed = 0
for await (const file of sourceFiles(path.join(root, 'src'))) {
  const rel = path.relative(root, file).split(path.sep).join('/')
  if (SKIP.has(rel) || rel.startsWith('src/app/api/')) continue
  const before = await readFile(file, 'utf8')
  const after = rewrite(file, before)
  if (after !== before) {
    await writeFile(file, after)
    changed++
  }
}
console.log(`Church demo: relabeled on-screen words in ${changed} files.`)
