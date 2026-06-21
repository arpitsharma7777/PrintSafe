const express = require("express");
const pool = require("../../config/db");
const { checkRedisHealth } = require("../../config/redis");

const router = express.Router();

router.get("/", async (req, res) => {
  let dbStatus = "DOWN";
  let dbLatency = null;
  let dbError = null;

  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    dbLatency = Date.now() - start;
    dbStatus = "UP";
  } catch (error) {
    dbError = error.message;
  }

  const redisHealth = await checkRedisHealth();

  const isHealthy = dbStatus === "UP" && redisHealth.status === "UP";
  const overallStatus = isHealthy ? "UP" : (dbStatus === "UP" ? "DEGRADED" : "DOWN");

  return res.status(overallStatus === "DOWN" ? 503 : 200).json({
    success: overallStatus !== "DOWN",
    message: overallStatus === "UP" ? "PrintSafe is healthy" : `PrintSafe is ${overallStatus.toLowerCase()}`,
    data: {
      status: overallStatus,
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        ...(dbError && { error: dbError }),
      },
      redis: redisHealth,
    },
  });
});

module.exports = router;
