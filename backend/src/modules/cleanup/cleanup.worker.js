const { runSessionCleanup } = require("./cleanup.service");
const logger = require("../../utils/logger");

let isRunning = false;

/**
 * Starts the background session cleanup worker.
 * @param {number} intervalMs - Execution period in milliseconds. Defaults to 60,000 (1 minute).
 */
const startCleanupWorker = (intervalMs = 60000) => {
  logger.info({ intervalMs }, "Initialized background cleanup worker");

  setInterval(async () => {
    if (isRunning) {
      logger.warn("Previous cleanup execution still in progress, skipping run");
      return;
    }

    isRunning = true;
    try {
      await runSessionCleanup();
    } catch (error) {
      logger.error(error, "Error in background cleanup worker run");
    } finally {
      isRunning = false;
    }
  }, intervalMs);
};

module.exports = {
  startCleanupWorker,
};
