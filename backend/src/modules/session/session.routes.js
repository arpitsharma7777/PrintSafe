const express = require("express");

const { sendSuccess } = require("../../utils/apiResponse");
const AppError = require("../../utils/AppError");
const { isValidUuid } = require("../../utils/validators");
const { createSession, getSessionById } = require("./session.service");
const { sessionRateLimiter } = require("../../middleware/rateLimit.middleware");

const router = express.Router();

router.post("/", sessionRateLimiter, async (req, res, next) => {
  try {
    const session = await createSession();

    return sendSuccess(res, 201, "Session created successfully", {
      session,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!isValidUuid(sessionId)) {
      throw new AppError("Invalid session ID format", 400);
    }

    const session = await getSessionById(sessionId);

    if (!session) {
      throw new AppError("Session not found", 404);
    }

    if (new Date(session.expires_at) < new Date()) {
      throw new AppError("Session has expired", 410);
    }

    return sendSuccess(res, 200, "Session fetched successfully", {
      session,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
