const { findExpiredActiveSessions, markSessionExpired } = require("../session/session.repository");
const { findNonDeletedJobsBySessionId } = require("../jobs/jobs.repository");
const { deleteJob } = require("../jobs/jobs.service");

/**
 * Periodically processes expired active sessions, unlinks their uploaded PDF files,
 * updates the database entries, emits Socket.IO events, and marks the sessions as EXPIRED.
 */
const runSessionCleanup = async () => {
  const expiredSessions = await findExpiredActiveSessions();

  if (expiredSessions.length > 0) {
    console.log(`[Cleanup Worker] Found ${expiredSessions.length} expired active sessions to clean up.`);
  }

  for (const session of expiredSessions) {
    try {
      console.log(`[Cleanup Worker] Starting cleanup for session: ${session.id}`);

      // 1. Find all active/non-deleted jobs belonging to this expired session
      const jobs = await findNonDeletedJobsBySessionId(session.id);

      // 2. Delete each job's file, update status to DELETED, and emit socket event
      for (const job of jobs) {
        try {
          console.log(`[Cleanup Worker] Cleaning up job file and status for jobId: ${job.id}`);
          // This calls deleteJob from jobs.service which unlinks the file and updates job status to DELETED
          await deleteJob(job.id);
        } catch (jobError) {
          console.error(`[Cleanup Worker] Error deleting job ${job.id} during session cleanup:`, jobError.message);
        }
      }

      // 3. Mark the session as EXPIRED in the database
      // This is done last so if the process crashes mid-way, the session is not marked EXPIRED
      // and will be picked up on the next worker run to clean up any remaining files.
      await markSessionExpired(session.id);
      console.log(`[Cleanup Worker] Successfully marked session ${session.id} as EXPIRED.`);
    } catch (sessionError) {
      console.error(`[Cleanup Worker] Error cleaning up expired session ${session.id}:`, sessionError.message);
    }
  }
};

module.exports = {
  runSessionCleanup,
};
