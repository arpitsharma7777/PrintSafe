require("dotenv").config();

const http = require("http");

const app = require("./app");
const env = require("./config/env");
const { initSocket } = require("./socket/socket");
const { startCleanupWorker } = require("./modules/cleanup/cleanup.worker");
const { reconcileOrphanFiles } = require("./modules/cleanup/reconciliation.service");
const { connectRedis, disconnectRedis } = require("./config/redis");
const pool = require("./config/db");
const logger = require("./utils/logger");

const httpServer = http.createServer(app);

initSocket(httpServer);

// Start background cleanup worker (checks every minute)
startCleanupWorker();

const startServer = async () => {
  // Connect to Redis (fails gracefully, won't crash process if down)
  await connectRedis();

  try {
    await reconcileOrphanFiles();
  } catch (error) {
    logger.error(error, "Startup reconciliation failed");
  }

  const server = httpServer.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info("HTTP server closed.");

      // Disconnect Redis
      await disconnectRedis();

      // Close PG pool
      try {
        await pool.end();
        logger.info("PostgreSQL pool ended.");
      } catch (err) {
        logger.error(err, "Error ending PostgreSQL pool");
      }

      logger.info("Graceful shutdown completed. Exiting process.");
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error("Graceful shutdown timed out. Forcing exit.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();
