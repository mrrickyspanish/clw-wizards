-- Import the 2026 sponsorship signup form as platinum-tier sponsors.
--
-- 25 businesses paid and completed the form. Every row is inserted as
-- platinum for now, at the club's request, rather than graded by the fee
-- actually paid -- amount_cents keeps the real fee on file so tiers can be
-- reassigned correctly once that's done. logo_url is left NULL; a sponsor
-- with no logo still renders publicly, with an initials badge in place of
-- the logo (see PartnerCard in PartnersShowcase.tsx), so these go live on
-- /partners and start rotating through the header ticker as soon as this
-- runs, not once logos are added.
--
-- Two rows needed a human call the form data couldn't settle on its own:
--   - "Ham Hands" put "Fuck off" in the website field. Left NULL rather than
--     publish it or guess at a real one.
--   - "A.A.Jacobs Supply" and "Ewing-Doherty Mechanical" put an email address
--     in the website field. Read as contact info instead of a broken link.
-- One row, "R.L Sohol", has no usable email in the whole submission -- no
-- website, no business inquiry email, no sponsorship contact email. Inserted
-- with contact_email NULL; whoever manages sponsors will need to follow up
-- directly for that one.
--
-- 9 of these 25 businesses already exist in sponsors, seeded by
-- 20260624000013_seed_legacy_sponsors.sql as tier 'black' with the note
-- "Migrated from legacy site; tier unconfirmed" and no contact info at all.
-- A plain guarded INSERT would have skipped every one of them as "already
-- present" and left that stale, unconfirmed row in place -- so this upserts
-- instead: existing rows are updated to platinum with the current contact
-- info and fee, and only genuinely new names get inserted. Run as UPDATE
-- then INSERT ... WHERE NOT EXISTS in one transaction, so the INSERT only
-- ever sees names the UPDATE didn't just claim.

WITH v(name, website_url, contact_name, contact_email, amount_cents, notes) AS (
  VALUES
  ('Break Thru Enterprises, Inc.', 'https://www.breakthrudemo.com', NULL, 'tjlisy@breakthrudemo.com', 150000, 'Imported from 2026 sponsorship form, order #43100775'),
  ('Prime Scaffold', 'https://www.primescaffold.com', 'Eric Ringstad', 'eringstad@primescaffold.com', 25000, 'Imported from 2026 sponsorship form, order #43104871'),
  ('Ham Hands', NULL, NULL, 'justin@browngrp.com', 50000, 'Imported from 2026 sponsorship form, order #43107332'),
  ('Commercial Carpet Consultants, Inc', 'https://www.commcpt.com', 'Jon Chandler', 'jchandler@commcpt.com', 50000, 'Imported from 2026 sponsorship form, order #43117420'),
  ('Titan Electric', 'https://www.titan-elec.com', 'Robert S. Karlow', 'rsk@titan-elec.com', 100000, 'Imported from 2026 sponsorship form, order #43121257'),
  ('Action Packaging', 'https://www.actionpkg.com', NULL, 'info@actionpkg.com', 100000, 'Imported from 2026 sponsorship form, order #43141545'),
  ('Arete Advising / Christopher Klotz', 'https://www.areteadvising.com', 'Christopher Klotz', 'chris@areteadvising.com', 25000, 'Imported from 2026 sponsorship form, order #43143486'),
  ('AllianceCo', 'https://alliancecousa.com', 'Nathalie Fisher', 'nfisher@alliancecousa.com', 50000, 'Imported from 2026 sponsorship form, order #43159725'),
  ('Flooring Resources Corporation', 'https://flooringresources.com/', 'Michele Slowen', 'mslowen@frcmail.com', 150000, 'Imported from 2026 sponsorship form, order #43214191'),
  ('Core Floorings Inc', 'https://Www.corefloorings.com', 'Jason Jansma', 'Jjansma@corefloorings.com', 150000, 'Imported from 2026 sponsorship form, order #43220667'),
  ('All-Tech Decorating', 'https://www.alltechdecorating.com', 'Tim Stark', 'dgabry@alltechdecorating.com', 10000, 'Imported from 2026 sponsorship form, order #43417351'),
  ('Inter Ocean Cabinet Company', 'https://www.interoceancabinet.com', 'Chris Farrell', 'chrisf@interoceancabinet.com', 15000, 'Imported from 2026 sponsorship form, order #43419042'),
  ('Great Lakes Plumbing & Heating Company', 'https://glph.com/', NULL, 'mptasnik@glph.com', 150000, 'Imported from 2026 sponsorship form, order #43429867'),
  ('David Architectural Metals', 'https://Www.davidarchitecturalmetals.com', 'Ryan Schneider', 'RyanSchneider@davidarchitecturalmetals.com', 25000, 'Imported from 2026 sponsorship form, order #43628091'),
  ('Redmond', 'https://www.redmondconstruction.com', 'Bradley Malouf', 'brad@redmondconstruction.com', 25000, 'Imported from 2026 sponsorship form, order #43771294'),
  ('Slate Demolition', 'https://Www.slatedemollc.com', 'Kathy Dziedzic', 'kdziedzic@slatedemollc.com', 100000, 'Imported from 2026 sponsorship form, order #44125446'),
  ('A.A.Jacobs Supply', NULL, 'Alfonso Perez Jr.', 'tito@aajacobssupply.com', 150000, 'Imported from 2026 sponsorship form, order #44426189'),
  ('Ewing-Doherty Mechanical, Inc.', NULL, 'Tony Albergo', 'talbergo@ewing-doherty.com', 150000, 'Imported from 2026 sponsorship form, order #44508130'),
  ('Periscope Marketing', 'https://Www.mitchell1.com', 'Frank Backus', 'Frankybackus@yahoo.com', 25000, 'Imported from 2026 sponsorship form, order #44708066'),
  ('Scott Descourouez', NULL, 'Scott Descourouez', 'houseofd@comcast.net', 10000, 'Imported from 2026 sponsorship form, order #44727104'),
  ('SwitchRail Safety Systems, LLC', 'https://www.switchrail.com', 'Steve Stawychny', 'Steve@switchrail.com', 50000, 'Imported from 2026 sponsorship form, order #44729130'),
  ('Marvin Feig & Associates', 'https://www.marvinfeig.com', 'Amish Thakker', 'Amish@MarvinFeig.com', 100000, 'Imported from 2026 sponsorship form, order #44732463'),
  ('New American Funding - Brian Augustine Team', 'https://www.nafinc.com/brian-augustine', 'Brian Augustine', 'brian.augustine@nafinc.com', 25000, 'Imported from 2026 sponsorship form, order #44799449'),
  ('Pinnacle Decorating, Inc.', 'https://www.pinnacledec.com', 'Gary Kunish', 'kunish@xnet.com', 50000, 'Imported from 2026 sponsorship form, order #44818329'),
  ('R.L Sohol', NULL, NULL, NULL, 50000, 'Imported from 2026 sponsorship form, order #44927364')
),
updated AS (
  UPDATE public.sponsors s
  SET
    tier = 'platinum'::public.sponsor_tier,
    website_url = COALESCE(v.website_url, s.website_url),
    contact_name = COALESCE(v.contact_name, s.contact_name),
    contact_email = COALESCE(v.contact_email, s.contact_email),
    amount_cents = COALESCE(v.amount_cents, s.amount_cents),
    notes = v.notes
  FROM v
  WHERE s.name = v.name
  RETURNING s.name
)
INSERT INTO public.sponsors (name, tier, website_url, contact_name, contact_email, amount_cents, active, notes)
SELECT v.name, 'platinum'::public.sponsor_tier, v.website_url, v.contact_name, v.contact_email, v.amount_cents, true, v.notes
FROM v
WHERE NOT EXISTS (SELECT 1 FROM updated u WHERE u.name = v.name);
