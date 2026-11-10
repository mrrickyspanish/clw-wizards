# Backups

The Supabase project is on the free plan, which keeps **no backups**. The
`Nightly backup` GitHub Action makes our own:

| What | When | Kept |
| --- | --- | --- |
| Database: every table, logins, waivers, dues, payments (`clw-db-<date>`) | every night, about 2:17 AM | 30 days |
| Uploaded files: birth certificates, USA cards, site photos, sponsor logos, flyers, message pictures (`clw-files-<date>`) | Sundays, and any hand-started run | 15 days |

Both are encrypted with `BACKUP_PASSPHRASE`. Without that phrase a backup
cannot be opened, so keep it in a password manager, not only in GitHub.

Find them under the repository's **Actions** tab > **Nightly backup** > a run >
**Artifacts**. A failed run emails the repository owner.

## Setup (once)

Repository **Settings > Secrets and variables > Actions > New repository secret**:

1. `SUPABASE_DB_URL`: in Supabase, open the **CLW Wizards** project (not The
   Daily Dribble; the run refuses any other project), tap **Connect** at the
   top, choose **Session pooler**, copy the connection string and put the
   database password in place of `[YOUR-PASSWORD]`. (GitHub can't reach the
   direct connection, which is IPv6 only.) Forgot the password? Reset it in the
   project's Database settings; the site itself does not use it.
2. `SUPABASE_SERVICE_ROLE_KEY`: the CLW Wizards project's service role key (the same value as in Vercel).
3. `BACKUP_PASSPHRASE`: a long random phrase from a password manager.

Then **Actions > Nightly backup > Run workflow** once to check it.

## Restore

1. Download the artifact and decrypt it:
   `gpg -d clw-db-<date>.tar.gz.gpg | tar -xzf -` (asks for the passphrase)
2. Restore into a **new** Supabase project first, never straight over the live
   one, then compare before switching anything:
   ```
   psql "<new project's session pooler string>" \
     --single-transaction --variable ON_ERROR_STOP=1 \
     --file db/roles.sql --file db/schema.sql \
     --command 'SET session_replication_role = replica' --file db/data.sql
   ```
   (Supabase's guide: "Backup and restore using the CLI".)
3. Files: `gpg -d clw-files-<date>.tar.gpg | tar -xf -` gives one folder per
   bucket; upload each folder to the same bucket in the project.

To bring back a single record (one family, one payment), restore into the new
project and copy just that row across.

**Last tested Nov 10, 2026:** the Nov 9 copy decrypted with the passphrase and
loaded into a scratch database. All 35 club tables restored with no errors, and
every row count matched the live site except rows created after the backup ran.
150 logins were in the copy. (Supabase's own login and storage tables only load
into a real Supabase project, which is expected.)

## Website text, coaches and FAQs

Every change is also kept in the `content_history` table (who, when, before
and after), so a single wiped headline or deleted FAQ can be put back without
a restore.
