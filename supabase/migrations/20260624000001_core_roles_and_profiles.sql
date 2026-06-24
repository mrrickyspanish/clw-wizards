-- Corrected against the actual driver-hub schema, not the brief's draft:
--   - the enum is `app_role`, not `user_role`
--   - it currently has only ('admin', 'driver') — no separate `staff` ever existed
--   - `profiles.id` IS `auth.users.id` directly; there is no `profiles.user_id` column
--
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction as a query that
-- references the new value, so 'staff' is only added here — RLS policies that check
-- for it live in later migration files (separate transactions).

ALTER TYPE public.app_role RENAME VALUE 'driver' TO 'parent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS practice_group TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_opt_in_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consent_text TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();

-- Backfill email for any rows that predate this column (none expected pre-launch,
-- but cheap insurance since auth.users already has it).
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
