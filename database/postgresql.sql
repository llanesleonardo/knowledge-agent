CREATE TABLE IF NOT EXISTS knowledge_records (
  id text PRIMARY KEY,
  kind text NOT NULL,
  data text NOT NULL
);
CREATE INDEX IF NOT EXISTS knowledge_records_kind_idx ON knowledge_records(kind);
