-- Milestones (Section: NICU journey celebrations) — one row per baby per
-- milestone id (off-cpap, discharged, ...), upserted in place rather than
-- appended like care_events: a milestone only ever has one achieved date,
-- and re-marking it (e.g. correcting the date) should replace, not
-- duplicate. milestone_id is the client's fixed string id
-- (features/milestones/types.ts), not a UUID — kept in sync by hand on
-- both sides rather than a shared enum across two languages.
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY,
  baby_id UUID NOT NULL REFERENCES babies(id),
  milestone_id TEXT NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL,
  celebrated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (baby_id, milestone_id)
);
CREATE INDEX IF NOT EXISTS milestones_baby_idx ON milestones (baby_id);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all ON milestones;
CREATE POLICY service_role_all ON milestones FOR ALL TO service_role USING (true) WITH CHECK (true);
