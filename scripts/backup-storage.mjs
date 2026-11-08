// Downloads every file in the club's storage buckets into a folder, for the
// nightly backup (.github/workflows/nightly-backup.yml). Database backups never
// include these files (birth certificates, USA cards, site photos, sponsor
// logos, flyers, message pictures), so they are copied on their own.
//
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backup-storage.mjs <out-dir>
// Plain fetch against the Storage API, so the job needs no npm install.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Only the buckets the club site uses (Nov 8). Add a new bucket here when the
// site starts using one; the job fails if a listed bucket goes missing.
export const BUCKETS = ['athlete-documents', 'site-content', 'sponsor-logos', 'tournament-flyers', 'comms-images']

const PAGE = 1000

export async function listAll(api, bucket, prefix = '') {
  const files = []
  for (let offset = 0; ; offset += PAGE) {
    const rows = await api.list(bucket, prefix, offset)
    for (const row of rows) {
      const full = prefix ? `${prefix}/${row.name}` : row.name
      // Folders come back with no id; files have one.
      if (row.id) files.push(full)
      else files.push(...(await listAll(api, bucket, full)))
    }
    if (rows.length < PAGE) return files
  }
}

export function storageApi(url, key, fetcher = fetch) {
  const headers = { Authorization: `Bearer ${key}`, apikey: key }
  return {
    async list(bucket, prefix, offset) {
      const res = await fetcher(`${url}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } }),
      })
      if (!res.ok) throw new Error(`Listing ${bucket}/${prefix} failed: ${res.status}`)
      return res.json()
    },
    async download(bucket, name) {
      const encoded = name.split('/').map(encodeURIComponent).join('/')
      const res = await fetcher(`${url}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encoded}`, { headers })
      if (!res.ok) throw new Error(`Downloading ${bucket}/${name} failed: ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    },
  }
}

export async function backupStorage(api, outDir, buckets = BUCKETS) {
  const counts = {}
  for (const bucket of buckets) {
    const files = await listAll(api, bucket)
    for (const name of files) {
      const target = path.join(outDir, bucket, name)
      // Never write outside the backup folder, whatever a file is called.
      if (!path.resolve(target).startsWith(path.resolve(outDir, bucket) + path.sep)) throw new Error(`Unsafe file name in ${bucket}`)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, await api.download(bucket, name))
    }
    counts[bucket] = files.length
  }
  return counts
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const out = process.argv[2]
  if (!url || !key || !out) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and give an output folder.')
    process.exit(1)
  }
  const counts = await backupStorage(storageApi(url, key), out)
  console.log('Files backed up:', JSON.stringify(counts))
}
