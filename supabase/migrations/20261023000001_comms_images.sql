-- Pictures in Communications emails (Tyler, Oct 22: paste a flyer into the
-- message). Email apps load a picture from a web address, so the bucket is
-- public to read. Each file sits at a random path, so nobody can list or
-- guess them, and only the site's server can add one (a signed upload URL,
-- handed out to admins and staff by prepareCommsImageUpload). No storage
-- policies are added on purpose: signed-in users and the public cannot
-- list, write or delete here.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comms-images',
  'comms-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
