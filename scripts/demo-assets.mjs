// Homefield demo build step (RJ, Nov 14). Runs before `next build` and does
// nothing unless NEXT_PUBLIC_DEMO_MODE=1. In a demo build it overwrites, in the
// build's own copy of the files only, every real club photo, sponsor logo and
// the link preview image with neutral stand-ins, so no real person, child or
// business can appear anywhere in the demo. The live club never runs this.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

if (process.env.NEXT_PUBLIC_DEMO_MODE !== '1') process.exit(0)

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const placeholders = path.join(root, 'public/images/placeholders')
const stock = (await readdir(placeholders)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()
// Decorative tape and star graphics carry no people or club marks.
const keep = (file) => /^clw_(tape|star)_/.test(file)

async function replaceWithStock(file, i, from = stock, dir = placeholders) {
  const meta = await sharp(file).metadata()
  const source = path.join(dir, from[i % from.length])
  const out = sharp(await readFile(source)).resize(meta.width ?? 1600, meta.height ?? 1000, { fit: 'cover' })
  const ext = path.extname(file).toLowerCase()
  const buf = ext === '.png' ? await out.png().toBuffer() : ext === '.webp' ? await out.webp().toBuffer() : await out.jpeg({ quality: 80 }).toBuffer()
  await writeFile(file, buf)
}

// The home page hero gets its own made-up team photo (generated for the demo,
// Nov 15): kids of different backgrounds walking out together, lit for the
// headline on the left. Kept outside public/ so the live site never serves it.
const HERO = {
  'clw_wizards_hero_landscape.png': 'demo-hero-landscape.jpg',
  'clw-wizards-hero-mobile.jpg': 'demo-hero-mobile.jpg',
}
const heroDir = path.join(root, 'scripts/demo-media')

let replaced = 0
const real = path.join(root, 'public/images/real')
for (const [i, f] of (await readdir(real)).sort().entries()) {
  if (keep(f) || !/\.(jpe?g|png|webp)$/i.test(f)) continue
  if (HERO[f]) await replaceWithStock(path.join(real, f), 0, [HERO[f]], heroDir)
  else await replaceWithStock(path.join(real, f), i)
  replaced++
}

// Sponsor logos: a plain grey tile with no business name.
const sponsors = path.join(root, 'public/images/sponsors')
for (const f of await readdir(sponsors)) {
  if (!/\.(png|jpe?g|webp|svg)$/i.test(f)) continue
  const file = path.join(sponsors, f)
  if (f.endsWith('.svg')) {
    await writeFile(file, '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" rx="16" fill="#e5e7eb"/></svg>')
  } else {
    const meta = await sharp(file).metadata()
    await writeFile(file, await sharp({ create: { width: meta.width ?? 400, height: meta.height ?? 200, channels: 4, background: '#e5e7eb' } }).png().toBuffer())
  }
  replaced++
}

// The shared-link preview image (a real wrestler).
const og = path.join(root, 'src/app/opengraph-image.jpg')
await replaceWithStock(og, 0)
replaced++

console.log(`Homefield demo: replaced ${replaced} real images with stand-ins.`)
