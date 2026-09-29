-- ============================================================
-- thread_images.alt — text description of an image
-- Used as <img alt> and ImageObject.caption on the thread page, so the
-- words inside an image (memes, screenshots, documents) are searchable.
-- Filled automatically for memes posted from /admin/memes. Idempotent.
-- Run BEFORE deploying the matching code.
-- ============================================================

ALTER TABLE thread_images ADD COLUMN IF NOT EXISTS alt TEXT;
