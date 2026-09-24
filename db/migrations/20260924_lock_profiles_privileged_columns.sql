-- ============================================================
-- Lock down profiles writes from the browser
-- - All profile writes now go through /api/profile (service role)
-- - anon / authenticated can no longer INSERT/UPDATE/DELETE profiles directly
-- - Defense in depth: role / ban columns can only change via service role
-- ============================================================

REVOKE INSERT, UPDATE, DELETE ON profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION protect_profile_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('anon', 'authenticated') AND (
    NEW.role          IS DISTINCT FROM OLD.role OR
    NEW.is_banned     IS DISTINCT FROM OLD.is_banned OR
    NEW.ban_until     IS DISTINCT FROM OLD.ban_until OR
    NEW.warning_count IS DISTINCT FROM OLD.warning_count
  ) THEN
    RAISE EXCEPTION 'Not allowed to modify privileged profile columns';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_protect_privileged ON profiles;
CREATE TRIGGER profiles_protect_privileged
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_privileged_columns();
