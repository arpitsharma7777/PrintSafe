const { findExpiredActiveSessions, markSessionExpired } = require("../session/session.repository");
const { findNonDeletedJobsBySessionId } = require("../jobs/jobs.repository");
const { deleteJob } = require("../jobs/jobs.service");
const logger = require("../../utils/logger");

/**
 * Periodically processes expired active sessions, unlinks their uploaded PDF files,
 * updates the database entries, emits Socket.IO events, and marks the sessions as EXPIRED.
 */
const runSessionCleanup = async () => {
  const expiredSessions = await findExpiredActiveSessions();

  if (expiredSessions.length > 0) {
    logger.info({ count: expiredSessions.length }, "Found expired active sessions to clean up");
  }

  for (const session of expiredSessions) {
    try {
      logger.info({ sessionId: session.id }, "Starting cleanup for expired session");

      // 1. Find all active/non-deleted jobs belonging to this expired session
      const jobs = await findNonDeletedJobsBySessionId(session.id);

      // 2. Delete each job's file, update status to DELETED, and emit socket event
      for (const job of jobs) {
        try {
          logger.info({ sessionId: session.id, jobId: job.id }, "Cleaning up job file and status");
          // This calls deleteJob from jobs.service which unlinks the file and updates job status to DELETED
          await deleteJob(job.id);
        } catch (jobError) {
          logger.error(jobError, "Error deleting job during session cleanup", { sessionId: session.id, jobId: job.id });
        }
      }

      // 3. Mark the session as EXPIRED in the database
      // This is done last so if the process crashes mid-way, the session is not marked EXPIRED
      // and will be picked up on the next worker run to clean up any remaining files.
      await markSessionExpired(session.id);
      logger.info({ sessionId: session.id }, "Successfully marked session as EXPIRED");
    } catch (sessionError) {
      logger.error(sessionError, "Error cleaning up expired session", { sessionId: session.id });
    }
  }
};

module.exports = {
  runSessionCleanup,
};
