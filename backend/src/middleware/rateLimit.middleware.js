const rateLimit = require("express-rate-limit");
const env = require("../config/env");

/**
 * Rate limiter for session creation endpoint (POST /api/sessions)
 */
const sessionRateLimiter = rateLimit({
  windowMs: env.sessionRateLimitWindowMs,
  max: env.sessionRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json({
      success: false,
      message: "Too many sessions created from this IP. Please try again later.",
    });
  },
});

/**
 * Rate limiter for job/upload creation endpoint (POST /api/jobs)
 */
const jobRateLimiter = rateLimit({
  windowMs: env.jobRateLimitWindowMs,
  max: env.jobRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json({
      success: false,
      message: "Too many upload attempts from this IP. Please try again later.",
    });
  },
});

module.exports = {
  sessionRateLimiter,
  jobRateLimiter,
};
