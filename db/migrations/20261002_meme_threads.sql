-- ============================================================
-- Memes are published as threads
--
-- Publishing a meme renders it to PNG, stores it in the 'threads' bucket and
-- creates a regular thread (admin author, figures via thread_persons, image via
-- thread_images). memes.thread_id links the two so edits/unpublish stay in sync.
-- Idempotent. Run BEFORE deploying the matching code.
-- ============================================================

ALTER TABLE memes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE memes ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES threads(id) ON DELETE SET NULL;
