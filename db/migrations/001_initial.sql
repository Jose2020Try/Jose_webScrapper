CREATE TABLE crawl_snapshots (
  id UUID PRIMARY KEY,
  captured_at TIMESTAMPTZ NOT NULL,
  entries JSONB NOT NULL,

  CONSTRAINT entries_must_be_array
    CHECK (jsonb_typeof(entries) = 'array'),

  CONSTRAINT snapshot_must_have_30_entries
    CHECK (jsonb_array_length(entries) = 30)
);

CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_at TIMESTAMPTZ NOT NULL,
  operation TEXT NOT NULL,
  applied_filter TEXT,
  snapshot_id UUID REFERENCES crawl_snapshots(id),
  result_count INTEGER,
  duration_ms INTEGER NOT NULL,
  status TEXT NOT NULL,

  CONSTRAINT valid_operation
    CHECK (operation IN ('crawl', 'filter')),

  CONSTRAINT valid_filter
    CHECK (
      applied_filter IS NULL
      OR applied_filter IN ('all', 'long-title', 'short-title')
    ),

  CONSTRAINT filter_operation_requires_filter
    CHECK (operation <> 'filter' OR applied_filter IS NOT NULL),

  CONSTRAINT nonnegative_result_count
    CHECK (result_count IS NULL OR result_count >= 0),

  CONSTRAINT nonnegative_duration
    CHECK (duration_ms >= 0),

  CONSTRAINT valid_status
    CHECK (status IN ('success', 'error'))
);