-- Give each sponsor a trade and a one-line description.
--
-- The partner cards were a logo and a business name and nothing else, which
-- is thin for a page whose whole job is recognising these businesses. Two
-- short text fields make each card a real citation -- name, trade, what they
-- do, linked to their site -- which is the part search engines can actually
-- use to connect the page to the business. It also drives the ItemList /
-- Organization JSON-LD on /partners.
--
-- Both are nullable and render conditionally: a sponsor with neither set
-- looks exactly as it does today, so nothing has to be backfilled before
-- this ships, and new sponsors added through the admin form can fill them
-- in whenever.

ALTER TABLE public.sponsors
  ADD COLUMN industry TEXT,
  ADD COLUMN description TEXT;

COMMENT ON COLUMN public.sponsors.industry IS
  'Short trade or category shown as a label on the partner card, e.g. "Electrical Contractor". Keep it a label, not a sentence.';

COMMENT ON COLUMN public.sponsors.description IS
  'One line on what the business does, shown under the sponsor name on /partners and used as the Organization description in structured data.';

-- Length caps rather than free text: these render inside a fixed card, and a
-- paragraph pasted into either one would blow out the grid. Trimmed-empty is
-- rejected too, so a blank field is stored as NULL and hits the same
-- "unset" rendering path instead of reserving empty space on the card.
ALTER TABLE public.sponsors
  ADD CONSTRAINT sponsor_industry_is_a_label
    CHECK (industry IS NULL OR (length(btrim(industry)) BETWEEN 1 AND 60)),
  ADD CONSTRAINT sponsor_description_is_one_line
    CHECK (description IS NULL OR (length(btrim(description)) BETWEEN 1 AND 200));
