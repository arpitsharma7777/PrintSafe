const { runSessionCleanup } = require("./cleanup.service");

let isRunning = false;

/**
 * Starts the background session cleanup worker.
 * @param {number} intervalMs - Execution period in milliseconds. Defaults to 60,000 (1 minute).
 */
const startCleanupWorker = (intervalMs = 60000) => {
  console.log(`[Cleanup Worker] Initialized background worker. Running every ${intervalMs}ms.`);

  setInterval(async () => {
    if (isRunning) {
      console.log("[Cleanup Worker] Previous execution still in progress. Skipping run.");
      return;
    }

    isRunning = true;
    try {
      await runSessionCleanup();
    } catch (error) {
      console.error("[Cleanup Worker] Error in background worker run:", error.message);
    } finally {
      isRunning = false;
    }
  }, intervalMs);
};

module.exports = {
  startCleanupWorker,
};
