const express = require("express");

const { sendSuccess } = require("../../utils/apiResponse");

const router = express.Router();

router.get("/", (req, res) => {
  return sendSuccess(res, 200, "PrintSafe Backend Running");
});

module.exports = router;
