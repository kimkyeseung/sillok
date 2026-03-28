-- Add ARTICLE to view_logs target_type CHECK constraint
ALTER TABLE view_logs DROP CONSTRAINT IF EXISTS view_logs_target_type_check;
ALTER TABLE view_logs ADD CONSTRAINT view_logs_target_type_check
  CHECK (target_type IN ('PERSON', 'NODE', 'THREAD', 'ARTICLE'));
