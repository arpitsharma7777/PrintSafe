const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to socket server:", socket.id);
});

socket.on("job:created", (payload) => {
  console.log("Job created event received:", payload);
});

socket.on("job:printed", (payload) => {
  console.log("Job printed event received:", payload);
});

socket.on("job:deleted", (payload) => {
  console.log("Job deleted event received:", payload);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection failed:", error.message);
});
