-- Tracks whether a user has seen the first-time dashboard tour, once per
-- surface (a parent and an admin account see different tours). NULL = tour
-- not yet shown/dismissed for that surface. Timestamp rather than boolean to
-- match the onboarding_completed_at convention.
ALTER TABLE public.profiles ADD COLUMN parent_tour_seen_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN admin_tour_seen_at TIMESTAMPTZ;
