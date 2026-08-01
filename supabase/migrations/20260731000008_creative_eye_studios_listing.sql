-- Give Creative Eye Studios a listing that matches the rest of the wall.
--
-- The seed in 20260731000007 described them as a "creative studio that built
-- and maintains the Wizards website", which reads as a vendor credit rather
-- than a partner listing -- every other platinum partner gets its trade and
-- what the business actually does. This uses the studio's own positioning
-- (brand infrastructure, with strategy, design, content, video, and code
-- produced in-house) and keeps the Wizards work as the closing clause
-- instead of the whole entry.
--
-- Separate migration rather than an edit to 20260731000007, so a database
-- that already ran that seed picks this up too; on a fresh database it
-- simply overwrites the value 7 just set.

UPDATE public.sponsors
SET industry = 'Brand Strategy & Digital Infrastructure',
    description = 'Consulting-led studio building brand infrastructure for market leaders, with strategy, design, content, video, and code produced in-house. Architect of the Wizards digital platform.'
WHERE name = 'Creative Eye Studios';
