-- Tracks whether a parent has been through the post-confirmation onboarding
-- step (contact info + first athlete). NULL = not yet onboarded. A separate
-- flag rather than checking "phone IS NULL" because phone is optional
-- forever — we don't want to re-prompt someone who deliberately skipped it.
ALTER TABLE public.profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
