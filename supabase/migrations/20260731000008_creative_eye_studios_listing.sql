-- Give Creative Eye Studios a partner listing, not a vendor credit.
--
-- The seed in 20260731000007 described them as a "creative studio that built
-- and maintains the Wizards website", which reads as a build credit rather
-- than a partner entry -- every other platinum partner gets its trade and
-- what the business actually does, and this was the only listing defined
-- solely by its relationship to the club.
--
-- Written in the third person like every other entry on the wall. First
-- person would misread badly here: this is the club's own partner page, so
-- "we build websites" reads as the Wizards saying it about themselves.
--
-- Separate migration rather than an edit to 20260731000007, so a database
-- that already ran that seed picks this up too; on a fresh database it
-- simply overwrites the value 7 just set. Re-running it is harmless.

UPDATE public.sponsors
SET industry = 'Websites & Digital Platforms',
    description = 'Builds fast, durable websites and platforms — like this one — for businesses and brands that want to be taken seriously.'
WHERE name = 'Creative Eye Studios';
