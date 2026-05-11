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

module.exports = {
  createJob,
};
