const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  sessionTtlMinutes: Number(process.env.SESSION_TTL_MINUTES) || 15,
  sessionRateLimitWindowMs: Number(process.env.SESSION_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  sessionRateLimitMax: Number(process.env.SESSION_RATE_LIMIT_MAX) || 20,
  jobRateLimitWindowMs: Number(process.env.JOB_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  jobRateLimitMax: Number(process.env.JOB_RATE_LIMIT_MAX) || 10,
};

module.exports = env;
