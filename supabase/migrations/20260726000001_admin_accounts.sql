-- Two-tier admin accounts + a gated way to create them.
--
-- Both tiers are role = 'admin', so every existing admin RLS policy and the
-- whole /admin dashboard already apply to both. The ONLY capability difference
-- is editing public website content (copy, photos, FAQ) — reserved for FULL
-- admins via admin_scope = 'full'. Limited admins (admin_scope = 'limited') do
-- everything else operational: families, tournaments, practices/events, dues,
-- sponsors, communications.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_scope TEXT
  CHECK (admin_scope IN ('full', 'limited'));

-- True only for a full-access admin. SECURITY DEFINER to bypass RLS on profiles
-- (same pattern as has_role) so policies calling it don't recurse.
CREATE OR REPLACE FUNCTION public.is_full_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'admin' AND admin_scope = 'full'
  );
$$;

-- Website content editing moves from "any admin" to "full admin only".
DROP POLICY IF EXISTS "admin_write_page_content" ON public.page_content;
CREATE POLICY "full_admin_write_page_content" ON public.page_content
  FOR ALL USING (public.is_full_admin(auth.uid()))
  WITH CHECK (public.is_full_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_write_faq" ON public.faq_items;
CREATE POLICY "full_admin_write_faq" ON public.faq_items
  FOR ALL USING (public.is_full_admin(auth.uid()))
  WITH CHECK (public.is_full_admin(auth.uid()));

-- ...and the site-content image bucket writes (hero/section photos) follow the
-- same rule — a limited admin can't swap public site imagery.
DROP POLICY IF EXISTS "admin_insert_site_content" ON storage.objects;
CREATE POLICY "full_admin_insert_site_content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-content' AND public.is_full_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_update_site_content" ON storage.objects;
CREATE POLICY "full_admin_update_site_content" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-content' AND public.is_full_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_delete_site_content" ON storage.objects;
CREATE POLICY "full_admin_delete_site_content" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-content' AND public.is_full_admin(auth.uid()));

-- Single-use invite codes a FULL admin generates to create another admin at a
-- chosen tier. Redemption happens server-side with the service role once the
-- account is created, so no broad table grants are needed here.
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL CHECK (scope IN ('full', 'limited')),
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Only full admins see/create/revoke admin invites through the app client.
CREATE POLICY "full_admin_manage_admin_invites" ON public.admin_invites
  FOR ALL USING (public.is_full_admin(auth.uid()))
  WITH CHECK (public.is_full_admin(auth.uid()));
