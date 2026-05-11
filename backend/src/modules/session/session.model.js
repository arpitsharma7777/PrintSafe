const pool = require("../../config/db");
const env = require("../../config/env");

const createSession = async () => {
  const query = `
    INSERT INTO sessions (expires_at)
    VALUES (NOW() + ($1::int * INTERVAL '1 minute'))
    RETURNING id, status, expires_at, created_at;
  `;

  const values = [env.sessionTtlMinutes];

  const result = await pool.query(query, values);

  return result.rows[0];
};

const findSessionById = async (sessionId) => {
  const query = `
    SELECT id, status, expires_at, closed_at, created_at, updated_at
    FROM sessions
    WHERE id = $1;
  `;

  const values = [sessionId];

  const result = await pool.query(query, values);

  return result.rows[0] || null;
};

module.exports = {
  createSession,
  findSessionById,
};

