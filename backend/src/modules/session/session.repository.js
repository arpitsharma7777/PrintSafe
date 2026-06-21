const pool = require("../../config/db");

/**
 * Finds all active sessions that have expired based on their expires_at timestamp.
 * @returns {Promise<Array<{ id: string }>>}
 */
const findExpiredActiveSessions = async () => {
  const query = `
    SELECT id
    FROM sessions
    WHERE status = 'ACTIVE'
      AND expires_at < NOW();
  `;
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Updates a session's status to EXPIRED.
 * @param {string} sessionId
 * @returns {Promise<Object|null>}
 */
const markSessionExpired = async (sessionId) => {
  const query = `
    UPDATE sessions
    SET
      status = 'EXPIRED',
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, status, expires_at, updated_at;
  `;
  const result = await pool.query(query, [sessionId]);
  return result.rows[0] || null;
};

module.exports = {
  findExpiredActiveSessions,
  markSessionExpired,
};
