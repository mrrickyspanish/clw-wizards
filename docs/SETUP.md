# CLW Platform — Setup & Hookup Guide

A step-by-step for standing up the database, wiring the API keys, and deploying
to Vercel. Do the steps in order — each one produces values the next step needs.

---

## Step 1 — Create the Supabase project & load the schema

1. Go to **supabase.com → New project**. Pick a name (e.g. `clw-platform`),
   a strong database password (save it), and a region close to Illinois
   (e.g. `us-east-1` / East US).
2. Wait for it to finish provisioning (~2 min).
3. In the left sidebar open **SQL Editor → New query**.
4. Open `supabase/schema.sql` from this repo, copy the **entire** file, paste it
   into the editor, and click **Run**.
   - You should see "Success. No rows returned."
   - This creates all 9 tables, the row-level-security policies, the signup
     trigger, and the private `athlete-documents` storage bucket — in one shot.
   - ⚠️ Use `supabase/schema.sql`, **not** the files in `supabase/migrations/`.
     The migration files are for the command-line tool and must run one at a
     time; the single `schema.sql` is the one made for the dashboard.
5. Verify: **Table Editor** should now list `profiles`, `athletes`,
   `tournaments`, etc. **Storage** should show an `athlete-documents` bucket.

## Step 2 — Confirm Auth settings

1. **Authentication → Providers → Email**: make sure Email is enabled.
2. **Authentication → URL Configuration**: set the **Site URL** to your
   production domain (e.g. `https://crystallakewizards.com`). You can add
   `http://localhost:3000` as an additional redirect URL for local testing.

## Step 3 — Grab the Supabase keys

In **Project Settings → API**, copy these three values:

| Value in Supabase | Goes into env var |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

> The `service_role` key bypasses all security rules. It is server-only — never
> commit it, never expose it to the browser. (The app already keeps it
> server-side; just keep it out of any `NEXT_PUBLIC_*` var.)

## Step 4 — Make yourself an admin

New signups default to the `parent` role. To get an admin account:

1. Run the app (Step 7) or use your deployed site to **sign up** with your
   email. This creates your `profiles` row.
2. Back in Supabase **SQL Editor**, promote yourself:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Log out and back in — you'll land on `/admin`.

---

## Step 5 — Collect the rest of the API keys

You don't need every integration working on day one. Here's what each key powers
and where to get it. **Bold** ones are needed for core MVP 1; the rest can wait.

| Env var | Where to get it | Needed for |
|---|---|---|
| **`NEXT_PUBLIC_SITE_URL`** | Your production URL | links in emails, redirects |
| **`STRIPE_SECRET_KEY`** | Stripe Dashboard → Developers → API keys | dues/donation payments |
| **`STRIPE_WEBHOOK_SECRET`** | Created in Step 8 | confirming payments |
| **`RESEND_API_KEY`** | resend.com → API Keys | all outgoing email |
| `RESEND_FROM_EMAIL` | A verified sender on your domain | email "from" address |
| `ALERT_EMAIL` | Your club admin inbox | internal alerts |
| `QSTASH_TOKEN` + signing keys | Upstash → QStash | email blasts, cron fan-out |
| `CRON_SECRET` | Make up a long random string | protects the cron endpoints |
| `TWILIO_*` | Twilio Console | **SMS — fast-follow, skip for now** |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile | bot protection on public forms |

> For SMS (Twilio): leave these blank for the MVP 1 launch. SMS is a deliberate
> fast-follow because carrier (A2P 10DLC) approval takes 1–3 weeks. The app's
> comms run on email until SMS is turned on.

## Step 6 — Set up email sending (Resend)

1. Create a Resend account, add and **verify your domain**
   (`crystallakewizards.com`) by adding the DNS records they give you.
2. Create an API key → `RESEND_API_KEY`.
3. Set `RESEND_FROM_EMAIL` to something on that verified domain, e.g.
   `"Crystal Lake Wizards <noreply@crystallakewizards.com>"`.

---

## Step 7 — Run it locally (optional but recommended)

```bash
cp .env.example .env.local      # then paste your real values into .env.local
npm install
npm run dev                      # http://localhost:3000
```

`.env.local` is gitignored — your keys never get committed.

## Step 8 — Deploy to Vercel

1. In Vercel, **Add New → Project** and import this GitHub repo.
2. Framework preset auto-detects **Next.js**. Leave build settings default.
3. **Environment Variables**: add every var from your `.env.local`
   (Steps 3 & 5). Set `NEXT_PUBLIC_SITE_URL` to the production URL.
4. Deploy.
5. **Stripe webhook**: in Stripe → Developers → Webhooks → Add endpoint, point
   it at `https://YOUR-DOMAIN/api/webhooks/stripe`, subscribe to
   `checkout.session.completed` (and `invoice.paid` if using subscriptions),
   then copy the **Signing secret** into Vercel as `STRIPE_WEBHOOK_SECRET` and
   redeploy.
6. **Cron jobs** are already declared in `vercel.json`; Vercel wires them up on
   deploy and injects `CRON_SECRET` automatically once you've set it as an env
   var.

---

## Quick reference: the absolute minimum to see it working

If you just want the site up and logging people in:

1. Supabase project + run `schema.sql` (Steps 1–3)
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`
3. Deploy to Vercel
4. Sign up, then promote yourself to admin (Step 4)

Payments, email, and blasts switch on as you add their keys — nothing breaks if
they're blank, those features just stay dormant until configured.
