-- Add Creative Eye Studios as a platinum partner.
--
-- Creative Eye Studios built this site (see the footer credit, which links
-- to creativeeyestudios.com) and has never had a real row in sponsors. The
-- only place it ever appeared was a hardcoded fallback string in the header
-- ticker, shown only when the sponsors table had zero platinum rows -- true
-- until 20260731000002 inserted 25 real ones, at which point that fallback
-- stopped rendering and Creative Eye disappeared from the site entirely
-- without anyone changing anything about Creative Eye itself.
--
-- Listed in-kind: no dollar amount, since this is the site's developer
-- credited as a partner rather than a cash sponsorship like the other 25.
--
-- Guarded by NOT EXISTS on name, matching the pattern in 20260731000002.

INSERT INTO public.sponsors (name, tier, website_url, active, notes)
SELECT 'Creative Eye Studios', 'platinum'::public.sponsor_tier, 'https://creativeeyestudios.com', true,
       'In-kind platinum listing -- built and maintains the site, not a cash sponsorship'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sponsors WHERE name = 'Creative Eye Studios'
);
