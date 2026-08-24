#!/usr/bin/env node
/**
 * Import the club's Google Form registration export into the platform.
 *
 * Reads the "Form Responses" CSV, groups the wrestler rows into families, and
 * creates the parent login, the wrestlers, their guardian contact records, and
 * this season's enrollment for each one.
 *
 *   node scripts/import-registrants.mjs <csv-path>            # dry run, writes nothing
 *   node scripts/import-registrants.mjs <csv-path> --commit   # actually writes
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment. Dry run is the default on purpose: it prints exactly what a real
 * run would do, so the plan can be read before anything is created.
 *
 * Safe to run more than once. Every write is keyed on something stable (the
 * parent's email, the wrestler's name + date of birth, the enrollment's
 * season + athlete), so a second run reports "exists" instead of duplicating.
 * That matters because a partial failure halfway through 100 families should be
 * fixable by fixing the cause and running it again.
 *
 * Accounts are created WITHOUT a password and with the email marked confirmed,
 * so nothing is emailed to anyone. A family claims their account through
 * "forgot password" whenever the club chooses to announce the portal.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// --- CSV columns, by position in the club's export -------------------------
const COL = {
  timestamp: 0,
  accountEmail: 1,
  firstName: 2,
  lastName: 3,
  familyPhone: 4,
  street: 5,
  city: 6,
  dob: 7,
  grade: 9,
  school: 10,
  weight: 11,
  shirtSize: 12,
  yearsExperience: 13,
  commitment: 14,
  referral: 15,
  g1Name: 16,
  g1Relationship: 17,
  g1Phone: 18,
  g1Email: 19,
  g1Coach: 20,
  g2Name: 21,
  g2Relationship: 22,
  g2Phone: 23,
  g2Email: 24,
  g2Coach: 25,
}

// --- CSV parsing -----------------------------------------------------------
// Hand-rolled because the export contains the full waiver text in quoted
// fields, complete with embedded commas, newlines, and doubled quotes.
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\r') {
      // handled by the \n that follows
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }

  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim()))
}

// --- Normalisers -----------------------------------------------------------
const clean = (v) => (v ?? '').trim().replace(/\s+/g, ' ')
const lower = (v) => clean(v).toLowerCase()

/** M/D/YYYY, the only format the export uses, to the DATE column's YYYY-MM-DD. */
function toIsoDate(value) {
  const m = clean(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const [, mm, dd, yyyy] = m
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

/** "Y- M" and "A- S" to the platform's own list (see config/registration-options). */
function toShirtSize(value) {
  const v = clean(value).toUpperCase().replace(/\s|-/g, '')
  const tier = v.startsWith('Y') ? 'Youth' : v.startsWith('A') ? 'Adult' : null
  if (!tier) return clean(value) || null
  const size = v.slice(1)
  const known = { XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL', '2XL': '2XL', XXL: '2XL' }
  return known[size] ? `${tier} ${known[size]}` : clean(value)
}

/**
 * Families wrote the same handful of relationships a dozen ways ("Dad", "dad",
 * "Father", "father"). Only the unambiguous casing/synonym cases are folded;
 * anything else is kept verbatim rather than guessed at, since the column is
 * free text in the schema and a wrong guess is worse than an odd-looking one.
 */
function toRelationship(value) {
  const v = lower(value)
  if (!v || v === 'n/a' || v === 'na') return null
  if (['dad', 'father', 'da'].includes(v)) return 'Father'
  if (['mom', 'mother', 'mama', 'mum'].includes(v)) return 'Mother'
  if (v === 'parent') return 'Parent'
  if (v === 'stepdad' || v === 'stepfather') return 'Stepfather'
  if (v === 'stepmom' || v === 'stepmother') return 'Stepmother'
  return clean(value)
}

function toCoachInterest(value) {
  const v = lower(value)
  if (v === 'yes') return 'Yes'
  if (v === 'no') return 'No'
  return null
}

function toEmail(value) {
  const v = lower(value)
  if (!v || v === 'n/a' || v === 'na' || v === 'none') return null
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? v : null
}

function toWeight(value) {
  const n = Number.parseFloat(clean(value).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

// --- Main ------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2)
  const csvPath = args.find((a) => !a.startsWith('--'))
  const commit = args.includes('--commit')
  const seasonIdArg = args.find((a) => a.startsWith('--season-id='))?.split('=')[1]

  if (!csvPath) {
    console.error('Usage: node scripts/import-registrants.mjs <csv-path> [--commit] [--season-id=<uuid>]')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.')
    process.exit(1)
  }

  const db = createClient(url, key, { auth: { persistSession: false } })

  const rows = parseCsv(readFileSync(csvPath, 'utf8')).slice(1)
  console.log(`Parsed ${rows.length} registration rows from ${csvPath}`)
  console.log(commit ? '\n*** COMMIT MODE: this will write to the database ***\n' : '\nDRY RUN: nothing will be written. Re-run with --commit to apply.\n')

  // --- Which season these enrollments belong to ---------------------------
  const { data: seasons, error: seasonError } = await db
    .from('season_registrations')
    .select('id, season_label, dues_amount_cents, dues_due_date')
    .order('registration_open_date', { ascending: false })

  if (seasonError) {
    console.error('Could not read season_registrations:', seasonError.message)
    process.exit(1)
  }

  let season = null
  if (seasonIdArg) season = (seasons ?? []).find((s) => s.id === seasonIdArg) ?? null
  else if ((seasons ?? []).length === 1) season = seasons[0]

  if (!season) {
    if (!seasons?.length) {
      console.error(
        'No season registration event exists yet. Create one in /admin/practices (event type\n' +
          '"season_registration") and re-run, or the wrestlers will import with no enrollment.'
      )
    } else {
      console.error('More than one season exists. Re-run with one of:')
      for (const s of seasons) console.error(`  --season-id=${s.id}   (${s.season_label})`)
    }
    process.exit(1)
  }
  console.log(`Season: ${season.season_label} (dues ${(season.dues_amount_cents / 100).toFixed(2)})\n`)

  // --- Group rows into families by the Google account that submitted -------
  // That column is verified by Google and is the address the club can actually
  // reach; the typed guardian email carries the form's typos.
  const families = new Map()
  const skipped = []

  for (const [i, r] of rows.entries()) {
    const email = toEmail(r[COL.accountEmail])
    const first = clean(r[COL.firstName])
    const last = clean(r[COL.lastName])
    const dob = toIsoDate(r[COL.dob])

    if (!email || !first || !last || !dob) {
      skipped.push({ line: i + 2, name: `${first} ${last}`.trim() || '(no name)', email: clean(r[COL.accountEmail]), dob: clean(r[COL.dob]) })
      continue
    }

    if (!families.has(email)) {
      families.set(email, {
        email,
        parentName: clean(r[COL.g1Name]) || `${first} ${last} family`,
        phone: clean(r[COL.g1Phone]) || clean(r[COL.familyPhone]) || null,
        street: clean(r[COL.street]) || null,
        city: clean(r[COL.city]) || null,
        wrestlers: [],
      })
    }

    families.get(email).wrestlers.push({
      first,
      last,
      dob,
      referral: clean(r[COL.referral]) || null,
      grade: clean(r[COL.grade]) || null,
      school: clean(r[COL.school]) || null,
      weight: toWeight(r[COL.weight]),
      shirtSize: toShirtSize(r[COL.shirtSize]),
      yearsExperience: clean(r[COL.yearsExperience]) || null,
      commitment: clean(r[COL.commitment]) || null,
      submittedAt: clean(r[COL.timestamp]) || null,
      guardians: [
        {
          ordinal: 1,
          name: clean(r[COL.g1Name]),
          relationship: toRelationship(r[COL.g1Relationship]),
          phone: clean(r[COL.g1Phone]) || null,
          email: toEmail(r[COL.g1Email]),
          coach: toCoachInterest(r[COL.g1Coach]),
        },
        {
          ordinal: 2,
          name: clean(r[COL.g2Name]),
          relationship: toRelationship(r[COL.g2Relationship]),
          phone: clean(r[COL.g2Phone]) || null,
          email: toEmail(r[COL.g2Email]),
          coach: toCoachInterest(r[COL.g2Coach]),
        },
      ].filter((g) => g.name && !['n/a', 'na', 'none'].includes(g.name.toLowerCase())),
    })
  }

  console.log(`${families.size} families, ${rows.length - skipped.length} wrestlers`)
  if (skipped.length) {
    console.log(`\n${skipped.length} row(s) skipped for missing name, date of birth, or email:`)
    for (const s of skipped) console.log(`  line ${s.line}: ${s.name} | email=${s.email || '(blank)'} | dob=${s.dob || '(blank)'}`)
  }
  console.log('')

  const stats = { parentsCreated: 0, parentsExisting: 0, athletesCreated: 0, athletesExisting: 0, guardians: 0, enrollments: 0, errors: [] }

  for (const family of families.values()) {
    try {
      // --- Parent login + profile -----------------------------------------
      let parentId = null
      const { data: existingProfile } = await db
        .from('profiles')
        .select('id')
        .eq('email', family.email)
        .maybeSingle()

      if (existingProfile) {
        parentId = existingProfile.id
        stats.parentsExisting += 1
      } else if (commit) {
        // No password: the account cannot be signed into until the family runs
        // a password reset. email_confirm skips the confirmation mail, so this
        // creates the record without contacting anyone.
        const { data: created, error: createError } = await db.auth.admin.createUser({
          email: family.email,
          email_confirm: true,
          user_metadata: { full_name: family.parentName },
        })
        if (createError || !created?.user) throw new Error(`createUser: ${createError?.message ?? 'unknown'}`)
        parentId = created.user.id
        stats.parentsCreated += 1
      } else {
        stats.parentsCreated += 1
      }

      if (commit && parentId) {
        // handle_new_user already inserted the row as role 'parent'; fill in
        // the details the trigger cannot know.
        const { error: profileError } = await db
          .from('profiles')
          .update({
            full_name: family.parentName,
            email: family.email,
            phone: family.phone,
            street_address: family.street,
            city: family.city,
            state: 'IL',
            is_active: true,
          })
          .eq('id', parentId)
        if (profileError) throw new Error(`profile: ${profileError.message}`)
      }

      // --- Wrestlers -------------------------------------------------------
      for (const w of family.wrestlers) {
        let athleteId = null

        if (parentId) {
          const { data: existingAthlete } = await db
            .from('athletes')
            .select('id')
            .eq('parent_id', parentId)
            .eq('first_name', w.first)
            .eq('last_name', w.last)
            .eq('date_of_birth', w.dob)
            .maybeSingle()

          if (existingAthlete) {
            athleteId = existingAthlete.id
            stats.athletesExisting += 1
          }
        }

        if (!athleteId) {
          if (commit && parentId) {
            const { data: created, error: athleteError } = await db
              .from('athletes')
              // practice_group is deliberately absent: staff assign it, the
              // form never asks, and the column is nullable as of
              // 20260824000001.
              .insert({
                parent_id: parentId,
                first_name: w.first,
                last_name: w.last,
                date_of_birth: w.dob,
                referral_source: w.referral,
                active: true,
              })
              .select('id')
              .single()
            if (athleteError) throw new Error(`athlete ${w.first} ${w.last}: ${athleteError.message}`)
            athleteId = created.id
          }
          stats.athletesCreated += 1
        }

        if (!commit || !athleteId) continue

        // --- Guardian contact records --------------------------------------
        for (const g of w.guardians) {
          const { error: guardianError } = await db
            .from('athlete_guardians')
            .upsert(
              {
                athlete_id: athleteId,
                ordinal: g.ordinal,
                name: g.name,
                relationship: g.relationship,
                phone: g.phone,
                email: g.email,
                coach_interest: g.coach,
              },
              { onConflict: 'athlete_id,ordinal' }
            )
          if (guardianError) throw new Error(`guardian ${g.name}: ${guardianError.message}`)
          stats.guardians += 1
        }

        // --- This season's enrollment --------------------------------------
        const { data: existingEnrollment } = await db
          .from('season_enrollments')
          .select('id')
          .eq('season_registration_id', season.id)
          .eq('athlete_id', athleteId)
          .maybeSingle()

        if (existingEnrollment) continue

        // Mirrors what submit_season_enrollment() creates for a family filing
        // through the portal, so an imported wrestler and a self-registered one
        // look identical on the admin review screen. Status stays 'submitted'
        // and dues stay 'pending' for the club to decide per family.
        const { data: dues, error: duesError } = await db
          .from('dues_payments')
          .insert({
            parent_id: parentId,
            athlete_id: athleteId,
            amount_cents: season.dues_amount_cents,
            amount_paid_cents: 0,
            season: season.season_label,
            status: season.dues_amount_cents === 0 ? 'paid' : 'pending',
            due_date: season.dues_due_date,
          })
          .select('id')
          .single()
        if (duesError) throw new Error(`dues ${w.first} ${w.last}: ${duesError.message}`)

        const { error: enrollError } = await db.from('season_enrollments').insert({
          season_registration_id: season.id,
          athlete_id: athleteId,
          parent_id: parentId,
          dues_payment_id: dues.id,
          status: 'submitted',
          grade: w.grade,
          school: w.school,
          weight_lbs: w.weight,
          shirt_size: w.shirtSize,
          years_experience: w.yearsExperience,
          season_commitment: w.commitment,
        })
        if (enrollError) throw new Error(`enrollment ${w.first} ${w.last}: ${enrollError.message}`)
        stats.enrollments += 1
      }
    } catch (err) {
      stats.errors.push(`${family.email}: ${err.message}`)
      console.error(`  ERROR ${family.email}: ${err.message}`)
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Parents  : ${stats.parentsCreated} ${commit ? 'created' : 'would be created'}, ${stats.parentsExisting} already existed`)
  console.log(`Wrestlers: ${stats.athletesCreated} ${commit ? 'created' : 'would be created'}, ${stats.athletesExisting} already existed`)
  if (commit) {
    console.log(`Guardians: ${stats.guardians} contact records written`)
    console.log(`Enrollments: ${stats.enrollments} created for ${season.season_label}`)
  }
  if (stats.errors.length) {
    console.log(`\n${stats.errors.length} error(s):`)
    for (const e of stats.errors) console.log(`  ${e}`)
    process.exitCode = 1
  } else {
    console.log('\nNo errors.')
  }
  if (!commit) console.log('\nNothing was written. Re-run with --commit to apply.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
