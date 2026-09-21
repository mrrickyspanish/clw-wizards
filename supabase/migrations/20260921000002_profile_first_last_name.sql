-- profiles.full_name has always been a single free-text field. Sorting the
-- admin Families list by last name needs a real last_name column -- the same
-- shape athletes already have (see athletes.first_name / athletes.last_name)
-- -- not a runtime guess parsed out of full_name on every page load.
--
-- full_name stays the source of truth everywhere the app already writes it
-- (signup, admin edit dialogs, the bootstrap admin-signup code, the CSV
-- import script): none of those call sites change. A trigger derives
-- first_name/last_name from full_name on every insert or update instead, so
-- the two can never drift out of sync and no write path had to be found and
-- edited by hand.
ALTER TABLE public.profiles
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT;

CREATE OR REPLACE FUNCTION public.split_profile_full_name()
RETURNS TRIGGER AS $$
DECLARE
  trimmed TEXT := btrim(NEW.full_name);
BEGIN
  IF trimmed IS NULL OR trimmed = '' THEN
    NEW.first_name := NULL;
    NEW.last_name := NULL;
    RETURN NEW;
  END IF;

  IF position(' ' IN trimmed) = 0 THEN
    -- A single word (mononym, or a placeholder like "Family"): put it in
    -- last_name so it still sorts and displays sensibly rather than
    -- vanishing into a blank last-name group.
    NEW.first_name := NULL;
    NEW.last_name := trimmed;
  ELSE
    -- Greedy .* eats everything up to the LAST space, leaving just the final
    -- token -- simplest correct way to get "everything after the last space"
    -- without hand-rolling string-reverse tricks.
    NEW.last_name := regexp_replace(trimmed, '^.*\s', '');
    NEW.first_name := btrim(left(trimmed, length(trimmed) - length(NEW.last_name)));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_split_profile_full_name
  BEFORE INSERT OR UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.split_profile_full_name();

-- Backfill every existing row using the identical rule the trigger applies
-- going forward, so historical and future data are split the same way.
UPDATE public.profiles
SET
  last_name = CASE
    WHEN btrim(full_name) IS NULL OR btrim(full_name) = '' THEN NULL
    WHEN position(' ' IN btrim(full_name)) = 0 THEN btrim(full_name)
    ELSE regexp_replace(btrim(full_name), '^.*\s', '')
  END,
  first_name = CASE
    WHEN btrim(full_name) IS NULL OR btrim(full_name) = '' THEN NULL
    WHEN position(' ' IN btrim(full_name)) = 0 THEN NULL
    ELSE btrim(left(btrim(full_name), length(btrim(full_name)) - length(regexp_replace(btrim(full_name), '^.*\s', ''))))
  END;

-- Case-insensitive so "de la Cruz" and "De La Cruz" land together.
CREATE INDEX idx_profiles_last_first_name ON public.profiles (lower(last_name), lower(first_name));

COMMENT ON COLUMN public.profiles.first_name IS
  'Derived from full_name by trg_split_profile_full_name -- do not write directly, it will be overwritten on the next full_name update.';
COMMENT ON COLUMN public.profiles.last_name IS
  'Derived from full_name by trg_split_profile_full_name -- do not write directly, it will be overwritten on the next full_name update.';
