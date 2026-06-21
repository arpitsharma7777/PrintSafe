const pool = require("../../config/db");

const findJobById = async (jobId) => {
  const query = `
    SELECT
      id,
      session_id,
      original_filename,
      storage_key,
      mime_type,
      file_size_bytes,
      status,
      printed_at,
      deleted_at,
      failed_at,
      failure_reason,
      created_at,
      updated_at
    FROM jobs
    WHERE id = $1;
  `;

  const result = await pool.query(query, [jobId]);

  return result.rows[0] || null;
};

const markPendingJobPrinted = async (jobId) => {
  const query = `
    UPDATE jobs
    SET
      status = 'PRINTED',
      printed_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
      AND status = 'PENDING'
    RETURNING
      id,
      session_id,
      original_filename,
      storage_key,
      mime_type,
      file_size_bytes,
      status,
      printed_at,
      created_at,
      updated_at;
  `;

  const result = await pool.query(query, [jobId]);

  return result.rows[0] || null;
};

const findNonDeletedJobsBySessionId = async (sessionId) => {
  const query = `
    SELECT
      id,
      session_id,
      original_filename,
      storage_key,
      mime_type,
      file_size_bytes,
      status,
      created_at
    FROM jobs
    WHERE session_id = $1
      AND status IN ('PENDING', 'PRINTING', 'PRINTED');
  `;

  const result = await pool.query(query, [sessionId]);

  return result.rows;
};

module.exports = {
  findJobById,
  markPendingJobPrinted,
  findNonDeletedJobsBySessionId,
};
