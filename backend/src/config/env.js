const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  sessionTtlMinutes: Number(process.env.SESSION_TTL_MINUTES) || 15,
};

module.exports = env;
