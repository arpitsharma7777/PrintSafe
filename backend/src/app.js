const express = require("express");
const cors = require("cors");
const pinoHttp = require("pino-http");
const crypto = require("crypto");
const logger = require("./utils/logger");

const healthRoutes = require("./modules/health/health.routes");
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/errorHandler.middleware");
const sessionRoutes = require("./modules/session/session.routes");
const jobRoutes = require("./modules/jobs/jobs.routes");


const app = express();

app.use(pinoHttp({
  logger,
  genReqId: (req) => {
    return req.headers["x-request-id"] || req.headers["x-correlation-id"] || crypto.randomUUID();
  }
}));
app.use(cors());
app.use(express.json());

app.use("/api/sessions", sessionRoutes);

app.use("/api/jobs", jobRoutes);

app.use("/api/health", healthRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;