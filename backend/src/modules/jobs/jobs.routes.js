const express = require("express");
const { handlePdfUpload } = require("../../middleware/upload.middleware");
const { sendSuccess } = require("../../utils/apiResponse");
const AppError = require("../../utils/AppError");
const { isValidUuid } = require("../../utils/validators");
const {
  getActiveQueueJobs,
} = require("./jobs.model");

const { printJobController, deleteJobController } = require("./jobs.controller");
const { createPrintJob } = require("./jobs.service");
const { jobRateLimiter } = require("../../middleware/rateLimit.middleware");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const jobs = await getActiveQueueJobs();

    return sendSuccess(res, 200, "Queue fetched successfully", {
      jobs,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", jobRateLimiter, handlePdfUpload, async (req, res, next) => {
  try {
    const { sessionId } = req.body || {};
    const uploadedFile = req.file;

    if (sessionId === undefined) {
      throw new AppError("Missing required session ID", 400);
    }

    if (!isValidUuid(sessionId)) {
      throw new AppError("Invalid session ID format", 400);
    }

    if (!uploadedFile) {
      throw new AppError("PDF file is required", 400);
    }

    const job = await createPrintJob({
      sessionId,
      uploadedFile,
    });

    return sendSuccess(res, 201, "Job created successfully", {
      job,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:jobId/print", printJobController);

router.patch("/:jobId/delete", deleteJobController);

module.exports = router;
