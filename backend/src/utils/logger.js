const pino = require("pino");
const env = require("../config/env");

const logger = pino({
  level: env.nodeEnv === "test" ? "silent" : process.env.LOG_LEVEL || "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.headers[\"set-cookie\"]",
  ],
  transport: env.nodeEnv === "development"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

module.exports = logger;
