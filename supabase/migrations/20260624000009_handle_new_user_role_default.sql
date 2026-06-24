-- driver-hub already has an on_auth_user_created trigger calling
-- public.handle_new_user() (see 20251219171637 + 20251219171638). It currently
-- hardcodes role = 'driver'; update it in place to default new signups to
-- 'parent' and to populate the new email column. No new trigger needed —
-- the brief's Migration 9 assumed this trigger didn't exist yet, but it does.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'parent', true);
  RETURN NEW;
END;
$$;

-- The insert-policy from 20251219171638 force-checked role = 'driver' on
-- self-signup; update it to match the renamed value.
DROP POLICY IF EXISTS "Users can insert own profile (driver only)" ON public.profiles;
CREATE POLICY "Users can insert own profile (parent only)"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
  AND role = 'parent'
  AND is_active = true
);
