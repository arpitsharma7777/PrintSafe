const { createClient } = require("redis");
const env = require("./env");
const logger = require("../utils/logger");

let client = null;
let isConnected = false;
let hasConnectedOnce = false;

/**
 * Initializes and connects to the Redis client.
 * Catches startup errors safely.
 */
const connectRedis = async () => {
  client = createClient({
    url: env.redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        // If we haven't connected successfully once, fail fast on startup connection
        if (!hasConnectedOnce) {
          isConnected = false;
          return new Error("Initial Redis connection failed");
        }
        // Retry connection every 5 seconds, max 10 retries per disconnect
        if (retries > 10) {
          logger.error("Redis reconnection strategy exhausted. Remaining disconnected.");
          isConnected = false;
          return new Error("Redis reconnection failed");
        }
        logger.warn({ retries }, "Redis client attempting reconnection...");
        return 5000;
      }
    }
  });

  client.on("connect", () => {
    logger.info("Redis client connecting...");
  });

  client.on("ready", () => {
    isConnected = true;
    hasConnectedOnce = true;
    logger.info("Redis client connected and ready.");
  });

  client.on("error", (error) => {
    // Flag as disconnected on connection drop
    isConnected = false;
    logger.error(error, "Redis client error occurred");
  });

  client.on("end", () => {
    isConnected = false;
    logger.warn("Redis client connection ended.");
  });

  try {
    await client.connect();
  } catch (error) {
    logger.error(error, "Failed to connect to Redis during startup. Continuing in PostgreSQL-only mode.");
    isConnected = false;
  }

  return client;
};

/**
 * Returns the active Redis client.
 * Throws an error if client is not initialized.
 */
const getRedisClient = () => {
  if (!client) {
    throw new Error("Redis client has not been initialized");
  }
  return client;
};

/**
 * Checks if the Redis connection is active and ready.
 */
const isRedisActive = () => {
  return client !== null && isConnected;
};

/**
 * Gracefully disconnects the Redis client.
 */
const disconnectRedis = async () => {
  if (client) {
    try {
      if (isConnected) {
        await client.quit();
        logger.info("Redis client disconnected gracefully.");
      } else {
        await client.disconnect();
        logger.info("Redis client disconnected (already offline).");
      }
    } catch (error) {
      if (error.name === "ClientClosedError" || error.message.includes("closed")) {
        logger.debug("Redis client was already closed during disconnect.");
      } else {
        logger.error(error, "Error disconnecting Redis client");
      }
    }
  }
};

const checkRedisHealth = async () => {
  if (!client || !isConnected) {
    return { status: "DOWN", error: "Redis client is disconnected or uninitialized" };
  }
  let timeoutId;
  try {
    const start = Date.now();
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Redis ping timeout")), 2000);
    });

    await Promise.race([client.ping(), timeoutPromise]);
    
    const latency = Date.now() - start;
    return { status: "UP", latencyMs: latency };
  } catch (error) {
    return { status: "DOWN", error: error.message };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisActive,
  disconnectRedis,
  checkRedisHealth,
};
