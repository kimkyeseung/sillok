-- Pre-generated WebP thumbnails (lib/thumbnails.ts). Public, written by the service role only.
-- `npm run thumbs` creates the bucket too if it is missing, so this is safe to run before or after.
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('thumbs', 'thumbs', TRUE, ARRAY['image/webp'])
ON CONFLICT (id) DO NOTHING;
