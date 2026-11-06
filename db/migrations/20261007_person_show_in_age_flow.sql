-- ============================================================
-- persons.show_in_age_flow — whether a figure appears on the age-flow timeline
--
-- FALSE only removes the figure from the scrolling timeline. Year pages, share
-- cards and the sitemap still use every figure, and ?focus= still shows them.
-- Default TRUE: nothing changes until figures are classified. Idempotent.
-- ============================================================

ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS show_in_age_flow BOOLEAN NOT NULL DEFAULT TRUE;
