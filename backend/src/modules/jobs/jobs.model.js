const pool = require("../../config/db");

const createJob = async ({
  sessionId,
  originalFilename,
  storageKey,
  mimeType,
  fileSizeBytes,
}) => {
  const query = `
    INSERT INTO jobs (
      session_id,
      original_filename,
      storage_key,
      mime_type,
      file_size_bytes
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      session_id,
      original_filename,
      storage_key,
      mime_type,
      file_size_bytes,
      status,
      created_at;
  `;

  const values = [
    sessionId,
    originalFilename,
    storageKey,
    mimeType,
    fileSizeBytes,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

const getActiveQueueJobs = async () => {
  const query = `
    SELECT
      jobs.id,
      jobs.session_id,
      jobs.original_filename,
      jobs.storage_key,
      jobs.mime_type,
      jobs.file_size_bytes,
      jobs.status,
      jobs.created_at,
      sessions.expires_at AS session_expires_at
    FROM jobs
    INNER JOIN sessions
      ON jobs.session_id = sessions.id
    WHERE jobs.status IN ('PENDING', 'PRINTING')
      AND sessions.expires_at > NOW()
    ORDER BY jobs.created_at ASC;
  `;

  const result = await pool.query(query);

  return result.rows;
};

module.exports = {
  createJob,
  getActiveQueueJobs,
};
