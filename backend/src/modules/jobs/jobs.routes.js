const express = require("express");

const { sendSuccess } = require("../../utils/apiResponse");
const AppError = require("../../utils/AppError");
const {
  isValidUuid,
  isPdfMimeType,
  isPositiveInteger,
} = require("../../utils/validators");
const { findSessionById } = require("../session/session.model");
const {
  createJob,
  getActiveQueueJobs,
  markJobPrinted,
  markJobDeleted,
} = require("./jobs.model");

const {
  emitJobCreated,
  emitJobPrinted,
  emitJobDeleted,
} = require("../../socket/jobSocket");

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

router.post("/", async (req, res, next) => {
  try {
    const { sessionId, originalFilename, mimeType, fileSizeBytes } = req.body || {};

    if (
      sessionId === undefined ||
      originalFilename === undefined ||
      mimeType === undefined ||
      fileSizeBytes === undefined
    ) {
      throw new AppError("Missing required job fields", 400);
    }

    if (!isValidUuid(sessionId)) {
      throw new AppError("Invalid session ID format", 400);
    }

    if (!isPdfMimeType(mimeType)) {
      throw new AppError("Invalid file type. Only PDF files are allowed.", 400);
    }

    if (!isPositiveInteger(fileSizeBytes)) {
      throw new AppError("Invalid file size. Please upload a valid file.", 400);
    }

    const session = await findSessionById(sessionId);

    if (!session) {
      throw new AppError("Session not found", 404);
    }

    if (new Date(session.expires_at) < new Date()) {
      throw new AppError("Session has expired", 410);
    }

    const storageKey = `sessions/${sessionId}/${Date.now()}-${originalFilename}`;

    const job = await createJob({
      sessionId,
      originalFilename,
      storageKey,
      mimeType,
      fileSizeBytes,
    });

    emitJobCreated(job);

    return sendSuccess(res, 201, "Job created successfully", {
      job,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:jobId/print", async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidUuid(jobId)) {
      throw new AppError("Invalid job ID format", 400);
    }

    const job = await markJobPrinted(jobId);

    if (!job) {
      throw new AppError("Job not found or cannot be marked as printed", 404);
    }

    emitJobPrinted(job);

    return sendSuccess(res, 200, "Job marked as printed successfully", {
      job,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:jobId/delete", async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidUuid(jobId)) {
      throw new AppError("Invalid job ID format", 400);
    }

    const job = await markJobDeleted(jobId);

    if (!job) {
      throw new AppError("Job not found or cannot be marked as deleted", 404);
    }

    emitJobDeleted(job);

    return sendSuccess(res, 200, "Job marked as deleted successfully", {
      job,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
