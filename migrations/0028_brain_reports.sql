-- Sellisy Brain (Phase 6): weekly AI report storage.
-- Apply manually BEFORE deploying Phase 6 code (Node-pg method, idempotent).

CREATE TABLE IF NOT EXISTS brain_reports (
  id varchar(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id varchar(64) NOT NULL,
  period_start timestamp NOT NULL,
  period_end timestamp NOT NULL,
  summary text NOT NULL,
  actions_json text NOT NULL DEFAULT '[]',
  metrics_json text NOT NULL DEFAULT '{}',
  emailed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brain_reports_store_created_idx ON brain_reports (store_id, created_at);
