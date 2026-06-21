require("dotenv").config();

const http = require("http");

const app = require("./app");
const env = require("./config/env");
const { initSocket } = require("./socket/socket");
const { startCleanupWorker } = require("./modules/cleanup/cleanup.worker");
const { reconcileOrphanFiles } = require("./modules/cleanup/reconciliation.service");
const logger = require("./utils/logger");

const httpServer = http.createServer(app);

initSocket(httpServer);

// Start background cleanup worker (checks every minute)
startCleanupWorker();

const startServer = async () => {
  try {
    await reconcileOrphanFiles();
  } catch (error) {
    logger.error(error, "Startup reconciliation failed");
  }

  httpServer.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
};

startServer();
