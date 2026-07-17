-- Editable marketing content. A simple key/value store: each editable slot on a
-- public page (headline, quote, stat, photo URL, …) has a stable key. Defaults
-- live in code (src/lib/content/registry.ts); this table only holds OVERRIDES, so
-- an unedited site renders exactly as before and rows appear only once edited.
CREATE TABLE public.page_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Public read: these values render on public marketing pages.
CREATE POLICY "public_read_page_content" ON public.page_content
  FOR SELECT USING (true);

CREATE POLICY "admin_write_page_content" ON public.page_content
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public bucket for content images (hero/coach/section photos). Public read so
-- the images render on the site; writes are admin-only. Mirrors sponsor-logos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-content', 'site-content', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_site_content" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-content');

CREATE POLICY "admin_insert_site_content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-content' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_site_content" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-content' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_delete_site_content" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-content' AND public.has_role(auth.uid(), 'admin'));
