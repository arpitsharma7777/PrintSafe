require("dotenv").config();

const http = require("http");

const app = require("./app");
const env = require("./config/env");
const { initSocket } = require("./socket/socket");
const { startCleanupWorker } = require("./modules/cleanup/cleanup.worker");

const httpServer = http.createServer(app);

initSocket(httpServer);

// Start background cleanup worker (checks every minute)
startCleanupWorker();

httpServer.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
