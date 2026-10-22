-- Follow-up to family_contacts (security advisor, Oct 22): pin the phone
-- helper's search_path, and keep the trigger function out of the public API.
ALTER FUNCTION public.contact_phone(TEXT) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.sync_family_contact_from_guardian() FROM PUBLIC, anon, authenticated;
