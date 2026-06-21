const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { MemoryStore } = require("express-rate-limit");
const env = require("../config/env");
const { isRedisActive, getRedisClient } = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Resilient rate-limit store that dynamically routes commands to RedisStore if Redis is connected,
 * or gracefully falls back to local MemoryStore during outages.
 */
class ResilientRedisStore {
  constructor(options = {}) {
    this.memoryStore = new MemoryStore();
    this.redisStore = new RedisStore({
      sendCommand: async (...args) => {
        if (!isRedisActive()) {
          throw new Error("Redis connection is inactive");
        }
        return await getRedisClient().sendCommand(args);
      },
      prefix: options.prefix || "printsafe:v1:rl:",
    });
  }

  init(options) {
    this.memoryStore.init(options);
    Promise.resolve(this.redisStore.init(options)).catch((error) => {
      logger.warn(error, "Redis rate limit store failed to initialize scripts. Will retry/fallback when active.");
    });
  }

  async increment(key) {
    if (isRedisActive()) {
      try {
        return await this.redisStore.increment(key);
      } catch (error) {
        logger.error(error, "Redis rate limit increment failed. Falling back to MemoryStore.", { key });
      }
    }
    return await this.memoryStore.increment(key);
  }

  async decrement(key) {
    if (isRedisActive()) {
      try {
        await this.redisStore.decrement(key);
        return;
      } catch (error) {
        logger.error(error, "Redis rate limit decrement failed. Falling back to MemoryStore.", { key });
      }
    }
    await this.memoryStore.decrement(key);
  }

  async resetKey(key) {
    if (isRedisActive()) {
      try {
        await this.redisStore.resetKey(key);
        return;
      } catch (error) {
        logger.error(error, "Redis rate limit resetKey failed. Falling back to MemoryStore.", { key });
      }
    }
    await this.memoryStore.resetKey(key);
  }
}

/**
 * Rate limiter for session creation endpoint (POST /api/sessions)
 */
const sessionRateLimiter = rateLimit({
  windowMs: env.sessionRateLimitWindowMs,
  max: env.sessionRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRedisStore({
    prefix: "printsafe:v1:rl:session:",
  }),
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json({
      success: false,
      message: "Too many sessions created from this IP. Please try again later.",
    });
  },
});

/**
 * Rate limiter for job/upload creation endpoint (POST /api/jobs)
 */
const jobRateLimiter = rateLimit({
  windowMs: env.jobRateLimitWindowMs,
  max: env.jobRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRedisStore({
    prefix: "printsafe:v1:rl:job:",
  }),
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json({
      success: false,
      message: "Too many upload attempts from this IP. Please try again later.",
    });
  },
});

module.exports = {
  sessionRateLimiter,
  jobRateLimiter,
  ResilientRedisStore,
};
