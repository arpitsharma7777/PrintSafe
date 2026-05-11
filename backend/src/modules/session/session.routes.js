const express = require("express");

const { sendSuccess } = require("../../utils/apiResponse");
const { createSession } = require("./session.model");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const session = await createSession();

    return sendSuccess(res, 201, "Session created successfully", {
      session,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
