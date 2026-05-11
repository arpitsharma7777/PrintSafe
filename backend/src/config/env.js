const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:Death_Note2050@localhost:5432/printsafe_dev",
};

module.exports = env;
