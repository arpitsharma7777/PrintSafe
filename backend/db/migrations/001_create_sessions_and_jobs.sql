CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT sessions_status_check
    CHECK (status IN ('ACTIVE', 'EXPIRED', 'CLOSED'))
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  printed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT jobs_session_id_fk
    FOREIGN KEY (session_id)
    REFERENCES sessions(id)
    ON DELETE CASCADE,

  CONSTRAINT jobs_status_check
    CHECK (status IN ('PENDING', 'PRINTING', 'PRINTED', 'DELETED', 'FAILED')),

  CONSTRAINT jobs_file_size_positive_check
    CHECK (file_size_bytes > 0)
);

CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX idx_jobs_session_id ON jobs(session_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
