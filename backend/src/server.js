require("dotenv").config();

const http = require("http");

const app = require("./app");
const env = require("./config/env");
const { initSocket } = require("./socket/socket");

const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
