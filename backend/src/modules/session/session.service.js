const { createSession: dbCreateSession, findSessionById: dbFindSessionById } = require("./session.model");
const { markSessionExpired: dbMarkSessionExpired } = require("./session.repository");
const { isRedisActive, getRedisClient } = require("../../config/redis");
const logger = require("../../utils/logger");

const getCacheKey = (sessionId) => `printsafe:v1:session:${sessionId}`;

/**
 * Retrieves a session by ID using the Cache-Aside pattern.
 * Gracefully falls back to PostgreSQL on any Redis connection or query errors.
 * Logs structured cache metrics.
 * @param {string} sessionId
 * @returns {Promise<Object|null>}
 */
const getSessionById = async (sessionId) => {
  const cacheKey = getCacheKey(sessionId);

  if (isRedisActive()) {
    try {
      const redisClient = getRedisClient();
      const cachedSession = await redisClient.get(cacheKey);

      if (cachedSession) {
        const session = JSON.parse(cachedSession);
        
        // Defensive check: verify session has not expired logically based on clock time
        if (session.expires_at && new Date(session.expires_at) > Date.now()) {
          logger.info({ event: "cache_hit", sessionId }, "Session cache hit");
          return session;
        }

        logger.warn({ sessionId, expiresAt: session.expires_at }, "Cached session has expired logically. Evicting and treating as cache miss.");
        try {
          await redisClient.del(cacheKey);
        } catch (err) {
          logger.warn(err, "Failed to delete expired cached session key", { sessionId });
        }
      }

      logger.info({ event: "cache_miss", sessionId }, "Session cache miss");
    } catch (error) {
      logger.warn(error, "Redis error during session read. Falling back to DB.", { sessionId });
    }
  } else {
    logger.debug({ sessionId }, "Redis is disconnected. Querying PostgreSQL directly.");
  }

  // Fallback / Cache Miss: Query PostgreSQL
  const session = await dbFindSessionById(sessionId);

  // Cache only active and non-expired sessions
  if (session && session.status === "ACTIVE" && isRedisActive()) {
    const expiresAt = new Date(session.expires_at);
    const ttlSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

    if (ttlSeconds > 0) {
      try {
        const redisClient = getRedisClient();
        await redisClient.set(cacheKey, JSON.stringify(session), {
          EX: ttlSeconds,
        });
        logger.info({ event: "cache_write", sessionId, ttlSeconds }, "Session cache write");
      } catch (error) {
        logger.warn(error, "Redis error during session write. Proceeding without caching.", { sessionId });
      }
    }
  }

  return session;
};

/**
 * Creates a session in PostgreSQL database.
 * Cache is not prepopulated (lazy loading is used via cache-aside).
 * @returns {Promise<Object>}
 */
const createSession = async () => {
  return await dbCreateSession();
};

/**
 * Marks a session as EXPIRED in PostgreSQL database and invalidates its Redis cache key.
 * Gracefully ignores Redis errors to avoid breaking the core deletion workflow.
 * @param {string} sessionId
 * @returns {Promise<Object|null>}
 */
const expireSession = async (sessionId) => {
  const session = await dbMarkSessionExpired(sessionId);
  const cacheKey = getCacheKey(sessionId);

  if (isRedisActive()) {
    try {
      const redisClient = getRedisClient();
      await redisClient.del(cacheKey);
      logger.info({ event: "cache_invalidation", sessionId }, "Session cache invalidated");
    } catch (error) {
      logger.warn(error, "Redis error during session cache invalidation. Session was still marked expired in DB.", { sessionId });
    }
  }

  return session;
};

module.exports = {
  getSessionById,
  createSession,
  expireSession,
};
