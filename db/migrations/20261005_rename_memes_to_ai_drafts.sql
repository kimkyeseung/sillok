-- ============================================================
-- memes → ai_drafts
-- The table is the admin-only workspace for AI-generated drafts (wojak memes,
-- translated memes, short stories). Users only ever see the threads they become.
-- The 'memes' storage bucket (uploaded source images) keeps its name.
-- Idempotent. Run BEFORE deploying the matching code.
-- ============================================================

ALTER TABLE IF EXISTS memes RENAME TO ai_drafts;

ALTER INDEX IF EXISTS memes_pkey RENAME TO ai_drafts_pkey;
ALTER INDEX IF EXISTS memes_admin_list_idx RENAME TO ai_drafts_admin_list_idx;
ALTER INDEX IF EXISTS memes_person_ids_idx RENAME TO ai_drafts_person_ids_idx;

DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'ai_drafts'::regclass AND conname LIKE 'memes\_%'
  LOOP
    EXECUTE format('ALTER TABLE ai_drafts RENAME CONSTRAINT %I TO %I', c.conname, 'ai_drafts_' || substr(c.conname, 7));
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS memes_updated_at ON ai_drafts;
DROP TRIGGER IF EXISTS ai_drafts_updated_at ON ai_drafts;
CREATE TRIGGER ai_drafts_updated_at
  BEFORE UPDATE ON ai_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
