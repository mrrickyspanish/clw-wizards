-- Attach logos to the sponsors imported from the 2026 sponsorship form.
--
-- Files are committed under public/images/sponsors/ rather than uploaded to
-- the sponsor-logos Storage bucket, matching how the rest of this batch's
-- data (photos, seed data) already ships through the repo. logo_url stores
-- the site-relative path; the admin form's validation was updated in the
-- same change to accept that alongside a full URL, and the Storage upload
-- flow in the admin sponsor dialog still works normally for anything added
-- after this.
--
-- 21 of the 26 platinum sponsors have a logo in this batch. The other 5
-- (Ham Hands, Periscope Marketing, Scott Descourouez, Pinnacle Decorating,
-- R.L Sohol) keep the initials badge until a logo is provided.

ALTER TABLE public.sponsors
  ADD COLUMN logo_dark_backdrop BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.sponsors.logo_dark_backdrop IS
  'True when the logo (white or light-colored ink on a transparent field) needs a dark backdrop to read against the card''s light background.';

-- Every logo in this batch was visually checked composited against both the
-- card's actual background color and a dark one -- not guessed from the
-- source file's average brightness, which doesn't distinguish a genuinely
-- light logo mark from a logo that simply has a light background shape
-- baked into the file (several of these do, and are fine as-is on light).

UPDATE public.sponsors SET logo_url = '/images/sponsors/aa-jacobs-supply.png' WHERE name = 'A.A.Jacobs Supply';
UPDATE public.sponsors SET logo_url = '/images/sponsors/action-packaging.png' WHERE name = 'Action Packaging';
UPDATE public.sponsors SET logo_url = '/images/sponsors/all-tech-decorating.png' WHERE name = 'All-Tech Decorating';
UPDATE public.sponsors SET logo_url = '/images/sponsors/allianceco.png' WHERE name = 'AllianceCo';
UPDATE public.sponsors SET logo_url = '/images/sponsors/arete-advising.png' WHERE name = 'Arete Advising / Christopher Klotz';
UPDATE public.sponsors SET logo_url = '/images/sponsors/break-thru-enterprises.png' WHERE name = 'Break Thru Enterprises, Inc.';
UPDATE public.sponsors SET logo_url = '/images/sponsors/commercial-carpet-consultants.png' WHERE name = 'Commercial Carpet Consultants, Inc';
UPDATE public.sponsors SET logo_url = '/images/sponsors/core-floorings.png' WHERE name = 'Core Floorings Inc';
UPDATE public.sponsors SET logo_url = '/images/sponsors/david-architectural-metals.png' WHERE name = 'David Architectural Metals';
UPDATE public.sponsors SET logo_url = '/images/sponsors/ewing-doherty-mechanical.png' WHERE name = 'Ewing-Doherty Mechanical, Inc.';
UPDATE public.sponsors SET logo_url = '/images/sponsors/flooring-resources.png' WHERE name = 'Flooring Resources Corporation';
UPDATE public.sponsors SET logo_url = '/images/sponsors/great-lakes-plumbing.png' WHERE name = 'Great Lakes Plumbing & Heating Company';
UPDATE public.sponsors SET logo_url = '/images/sponsors/inter-ocean-cabinet.png' WHERE name = 'Inter Ocean Cabinet Company';
UPDATE public.sponsors SET logo_url = '/images/sponsors/new-american-funding.png' WHERE name = 'New American Funding - Brian Augustine Team';
UPDATE public.sponsors SET logo_url = '/images/sponsors/prime-scaffold.png' WHERE name = 'Prime Scaffold';
UPDATE public.sponsors SET logo_url = '/images/sponsors/redmond.png' WHERE name = 'Redmond';

-- The five below have a white or light-colored wordmark on a transparent
-- field that is invisible against the card's light background -- confirmed
-- by compositing each one against the actual card color, not inferred.
-- Titan Electric specifically: the word "Electric" itself doesn't render on
-- the light card at all, only the "T" mark and "Titan" survive.

UPDATE public.sponsors SET logo_url = '/images/sponsors/creative-eye-studios.png', logo_dark_backdrop = true WHERE name = 'Creative Eye Studios';
UPDATE public.sponsors SET logo_url = '/images/sponsors/marvin-feig-associates.png', logo_dark_backdrop = true WHERE name = 'Marvin Feig & Associates';
UPDATE public.sponsors SET logo_url = '/images/sponsors/slate-demolition.png', logo_dark_backdrop = true WHERE name = 'Slate Demolition';
UPDATE public.sponsors SET logo_url = '/images/sponsors/switchrail.png', logo_dark_backdrop = true WHERE name = 'SwitchRail Safety Systems, LLC';
UPDATE public.sponsors SET logo_url = '/images/sponsors/titan-electric.png', logo_dark_backdrop = true WHERE name = 'Titan Electric';
