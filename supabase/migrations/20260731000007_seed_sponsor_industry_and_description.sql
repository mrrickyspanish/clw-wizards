-- Fill in the trade and one-line description for the sponsors whose business
-- could be positively identified.
--
-- Each one was matched using the website the sponsor themselves gave on the
-- 2026 sponsorship form (see 20260731000002), not by searching the business
-- name alone -- several of these names are generic enough to match an
-- unrelated company in another state ("Redmond", "AllianceCo", "Core
-- Floorings" all pull up look-alikes), and the domain is what disambiguates
-- them.
--
-- Five sponsors are deliberately left NULL rather than guessed at:
--   - Ham Hands            no website submitted
--   - R.L Sohol            no website, no email, nothing to identify
--   - Scott Descourouez    an individual, no business submitted
--   - Periscope Marketing  submitted website is mitchell1.com, an automotive
--                          software company, which does not match the name --
--                          most likely a form-entry error, so unresolved
--   - Pinnacle Decorating  domain did not confirm what the business does
-- They render exactly as they do now, logo/initials and name only, and
-- whoever manages sponsors can fill these in from the admin form.

WITH v(name, industry, description) AS (
  VALUES
  ('A.A.Jacobs Supply', 'Doors, Frames & Hardware',
   'Family-owned commercial supplier of doors, frames, hardware, and locks, based in Alsip.'),
  ('Action Packaging', 'Packaging Distributor & Manufacturer',
   'Woman- and family-owned packaging distributor and manufacturer in Woodstock, supplying over 30,000 products.'),
  ('All-Tech Decorating', 'Painting Contractor',
   'Union painting contractor in Romeoville handling commercial, industrial, and specialty coating work.'),
  ('AllianceCo', 'Drywall & Carpentry Contractor',
   'Commercial contractor in Hillside specializing in drywall, rough carpentry, and acoustical ceiling systems.'),
  ('Arete Advising / Christopher Klotz', 'Accounting & Tax Services',
   'Crystal Lake accounting practice providing tax preparation and planning for businesses and individuals.'),
  ('Break Thru Enterprises, Inc.', 'Demolition Contractor',
   'Lombard demolition contractor serving Chicagoland with total, interior, and selective structural demolition.'),
  ('Commercial Carpet Consultants, Inc', 'Commercial Flooring',
   'Full-service commercial flooring contractor in Elmhurst, handling carpet, tile, and stone installation.'),
  ('Core Floorings Inc', 'Concrete Flooring & Coatings',
   'Epoxy flooring, polished concrete, and floor leveling for commercial and industrial spaces.'),
  ('Creative Eye Studios', 'Web Design & Creative',
   'Creative studio that built and maintains the Wizards website.'),
  ('David Architectural Metals', 'Architectural Metal Fabrication',
   'Chicago metal fabricator since 1929, producing monumental stairs, canopies, railings, and ornamental metalwork.'),
  ('Ewing-Doherty Mechanical, Inc.', 'Mechanical & Plumbing Contractor',
   'Bensenville mechanical contractor and one of the largest plumbing firms in the Chicago metropolitan area.'),
  ('Flooring Resources Corporation', 'Commercial Flooring',
   'Elk Grove Village flooring contractor serving corporate, institutional, retail, and healthcare projects.'),
  ('Great Lakes Plumbing & Heating Company', 'Mechanical Contractor',
   'Chicago mechanical contractor since 1946, specializing in plumbing, mechanical piping, and fire protection.'),
  ('Inter Ocean Cabinet Company', 'Architectural Millwork & Cabinetry',
   'Elmhurst millwork firm building high-end architectural woodwork and custom cabinetry since 1897.'),
  ('Marvin Feig & Associates', 'Contract Window Treatments',
   'Niles firm supplying commercial window treatments, solar shading, drapery, and cubicle curtains.'),
  ('New American Funding - Brian Augustine Team', 'Mortgage Lending',
   'Residential mortgage lending through the Brian Augustine team.'),
  ('Prime Scaffold', 'Scaffolding & Shoring',
   'Bensenville supplier of scaffolding, shoring, and canopy systems for Chicago-area construction.'),
  ('Redmond', 'General Contractor',
   'Commercial general contractor handling tenant improvement and landlord redevelopment projects.'),
  ('Slate Demolition', 'Demolition Contractor',
   'Woman-owned union demolition contractor in Chicago specializing in commercial interior demolition.'),
  ('SwitchRail Safety Systems, LLC', 'Job-Site Safety Systems',
   'Modular safety rail systems for construction sites.'),
  ('Titan Electric', 'Electrical Contractor',
   'Full-service commercial electrical contractor based in Itasca, serving the Chicago area since 2006.')
)
UPDATE public.sponsors AS s
SET industry = v.industry,
    description = v.description
FROM v
WHERE s.name = v.name;
