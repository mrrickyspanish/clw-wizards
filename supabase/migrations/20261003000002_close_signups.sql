-- Close new sign-ups, at the database. The pages and the admin action check the
-- 'signups.*' switches, but the sign-up service can be called directly with the
-- public key, so this refuses the insert itself. A new account can be created
-- only while a switch in Admin -> Content -> Sign-ups is on. Reopening is that
-- switch; nothing here needs to change.
--
-- Existing accounts are untouched: this fires only when a row is INSERTED into
-- auth.users, never on sign-in or password reset.

INSERT INTO public.page_content (key, value, updated_at) VALUES
  ('signups.parents_open', 'off', NOW()),
  ('signups.admins_open', 'off', NOW())
ON CONFLICT (key) DO UPDATE SET value = 'off', updated_at = NOW();

CREATE OR REPLACE FUNCTION public.block_signups_when_closed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.page_content
    WHERE key IN ('signups.parents_open', 'signups.admins_open') AND value = 'on'
  ) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Sign-ups are closed' USING ERRCODE = 'P0001';
END;
$$;

DROP TRIGGER IF EXISTS block_signups_when_closed ON auth.users;
CREATE TRIGGER block_signups_when_closed
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.block_signups_when_closed();
