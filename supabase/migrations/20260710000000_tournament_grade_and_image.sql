-- Tournament "competition level" grade + flyer/preview image.
-- competition_level: free text (a difficulty grade the club can rename freely,
--   e.g. "Beginner-friendly", "Competitive", "Elite / Invite-only") so parents
--   can judge whether a wrestler is ready — every eligible group can still sign up.
-- image_url: the tournament flyer/photo shown as the homepage event preview.
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS competition_level TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;
