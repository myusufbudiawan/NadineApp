-- public.users mirrors auth.users (Supabase Auth owns credentials/sessions;
-- this table only holds the profile fields our domains join against).
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keeps public.users in sync with auth.users automatically on signup, so the
-- API never has to (and never gets a chance to forget to) create the profile
-- row itself.
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- user_id is intentionally not FK-constrained to public.users: that table is
-- only populated by the auth.users signup trigger above, and gating baby
-- creation on that trigger having already fired would be a fragile race.
-- The real authorization boundary is the verified Supabase JWT (userId),
-- not a join through public.users.
CREATE TABLE IF NOT EXISTS babies (id UUID PRIMARY KEY, user_id UUID NOT NULL, name TEXT NOT NULL, sex TEXT NOT NULL DEFAULT 'girl', date_of_birth TIMESTAMPTZ NOT NULL, gestational_weeks SMALLINT NOT NULL, gestational_days SMALLINT NOT NULL, birth_weight_kg NUMERIC NOT NULL, birth_length_cm NUMERIC, birth_head_circumference_cm NUMERIC, full_term_reference_weeks SMALLINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE babies ADD COLUMN IF NOT EXISTS sex TEXT NOT NULL DEFAULT 'girl';
ALTER TABLE babies DROP CONSTRAINT IF EXISTS babies_user_id_fkey;

-- baby_id is not FK-constrained: account-level audit entries (export,
-- deletion requests) reuse this column to carry the acting user's id rather
-- than a real baby, matching StoredAuditEvent's existing shape.
CREATE TABLE IF NOT EXISTS audit_events (id UUID PRIMARY KEY, actor_id UUID NOT NULL, baby_id UUID NOT NULL, entity_type TEXT NOT NULL, entity_id UUID NOT NULL, action TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS audit_events_baby_idx ON audit_events (baby_id);

CREATE TABLE IF NOT EXISTS care_events (id UUID PRIMARY KEY, baby_id UUID NOT NULL REFERENCES babies(id), type TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL, data JSONB NOT NULL, notes TEXT, idempotency_key UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ, UNIQUE (baby_id, idempotency_key));
CREATE INDEX IF NOT EXISTS care_events_baby_type_idx ON care_events (baby_id, type, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS growth_measurements (id UUID PRIMARY KEY, baby_id UUID NOT NULL REFERENCES babies(id), metric TEXT NOT NULL, value NUMERIC NOT NULL, unit TEXT NOT NULL, measured_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS growth_measurements_baby_metric_idx ON growth_measurements (baby_id, metric, measured_at);
-- Nullable + partial unique index (not NOT NULL like care_events.idempotency_key)
-- since this was bolted on after the table already existed: lets a mobile
-- client's local measurement id round-trip through create -> cross-device
-- pull without creating a second copy of the same measurement.
ALTER TABLE growth_measurements ADD COLUMN IF NOT EXISTS idempotency_key UUID;
CREATE UNIQUE INDEX IF NOT EXISTS growth_measurements_baby_idempotency_idx
  ON growth_measurements (baby_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS tip_content (id UUID PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL, min_corrected_age_days INTEGER, max_corrected_age_days INTEGER, source TEXT NOT NULL, review_status TEXT NOT NULL DEFAULT 'needs-clinical-review', reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS tip_content_category_status_idx ON tip_content (category, review_status);
CREATE TABLE IF NOT EXISTS reminders (id UUID PRIMARY KEY, baby_id UUID NOT NULL REFERENCES babies(id), type TEXT NOT NULL, title TEXT NOT NULL, time_of_day TEXT NOT NULL, days_of_week SMALLINT[] NOT NULL, timezone TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT true, status TEXT NOT NULL DEFAULT 'pending', snoozed_until TIMESTAMPTZ, last_completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS reminders_baby_idx ON reminders (baby_id);
CREATE TABLE IF NOT EXISTS share_grants (id UUID PRIMARY KEY, baby_id UUID NOT NULL REFERENCES babies(id), grantee_email TEXT NOT NULL, permission TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), revoked_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS share_grants_baby_idx ON share_grants (baby_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS deletion_requests (id UUID PRIMARY KEY, user_id UUID NOT NULL, reason TEXT, status TEXT NOT NULL DEFAULT 'pending', requested_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS deletion_requests_user_idx ON deletion_requests (user_id);
ALTER TABLE deletion_requests DROP CONSTRAINT IF EXISTS deletion_requests_user_id_fkey;

-- Server-side idempotency cache for /v1/sync (Postgres-backed so a retried
-- batch after a server restart still can't double-apply a mutation).
CREATE TABLE IF NOT EXISTS sync_results (
  mutation_id UUID PRIMARY KEY,
  status TEXT NOT NULL,
  event JSONB,
  server_event JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS is defense-in-depth: the API connects with the Postgres superuser role
-- from DATABASE_URL, which bypasses RLS entirely, so the actual per-user
-- authorization (ownership + share grants) lives in the Fastify layer
-- (services/api/src/common/auth/baby-access.ts). These policies only matter
-- if a connection string is ever swapped for a role that respects RLS.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users','babies','audit_events','care_events','growth_measurements','tip_content','reminders','share_grants','deletion_requests','sync_results'])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS service_role_all ON %I', t);
    EXECUTE format('CREATE POLICY service_role_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
