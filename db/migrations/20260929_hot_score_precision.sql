-- ============================================================
-- hot_score precision fix
-- PostgREST serializes float8 with 15 significant digits, so a full-precision
-- hot_score doesn't survive the round trip through the feed cursor and the
-- boundary row shows up again on the next page. Rounding to 12 decimals keeps
-- every score (all <= 0.36) exactly representable in 15 digits.
-- ============================================================

CREATE OR REPLACE FUNCTION thread_hot_score(likes INTEGER, replies INTEGER, created TIMESTAMPTZ)
RETURNS DOUBLE PRECISION AS $$
  SELECT round((
    (1 + COALESCE(replies, 0) * 0.5 + COALESCE(likes, 0))
    / power(GREATEST(EXTRACT(EPOCH FROM (NOW() - created)) / 86400.0, 0) + 2, 1.5)
  )::numeric, 12)::double precision
$$ LANGUAGE sql STABLE;

SELECT refresh_thread_hot_scores();
