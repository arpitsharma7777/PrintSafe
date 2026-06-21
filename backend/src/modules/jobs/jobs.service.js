const fs = require("fs/promises");
const path = require("path");

const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { emitJobCreated, emitJobPrinted, emitJobDeleted } = require("../../socket/jobSocket");
const { findSessionById } = require("../session/session.model");
const { createJob, markJobDeleted } = require("./jobs.model");
const {
  findJobById,
  markPendingJobPrinted,
} = require("./jobs.repository");

const validatePdfSignature = async (filePath) => {
  const fileHandle = await fs.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(5);
    await fileHandle.read(buffer, 0, 5, 0);

    if (buffer.toString() !== "%PDF-") {
      throw new AppError("Invalid PDF file content", 400);
    }
  } finally {
    await fileHandle.close();
  }
};

const removeUploadedFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      const relativePath = path.relative(path.join(__dirname, "../../../"), filePath);
      logger.error(error, "Failed to remove uploaded file", { relativePath });
    }
  }
};

const createPrintJob = async ({ sessionId, uploadedFile }) => {
  let job;

  try {
    await validatePdfSignature(uploadedFile.path);

    const session = await findSessionById(sessionId);

    if (!session) {
      throw new AppError("Session not found", 404);
    }

    if (new Date(session.expires_at) < new Date()) {
      throw new AppError("Session has expired", 410);
    }

    const originalFilename = uploadedFile.originalname;
    const storageKey = `sessions/${sessionId}/${uploadedFile.filename}`;
    const mimeType = uploadedFile.mimetype;
    const fileSizeBytes = uploadedFile.size;

    job = await createJob({
      sessionId,
      originalFilename,
      storageKey,
      mimeType,
      fileSizeBytes,
    });
  } catch (error) {
    await removeUploadedFile(uploadedFile.path);
    throw error;
  }

  emitJobCreated(job);

  return job;
};

const printJob = async (jobId) => {
  const existingJob = await findJobById(jobId);

  if (!existingJob) {
    throw new AppError("Job not found", 404);
  }

  if (existingJob.status !== "PENDING") {
    throw new AppError("Only pending jobs can be printed", 409);
  }

  const printedJob = await markPendingJobPrinted(jobId);

  if (!printedJob) {
    throw new AppError("Job could not be printed", 409);
  }

  emitJobPrinted(printedJob);

  return printedJob;
};

const deleteJob = async (jobId) => {
  const existingJob = await findJobById(jobId);

  if (!existingJob) {
    throw new AppError("Job not found", 404);
  }

  if (!["PENDING", "PRINTING", "PRINTED"].includes(existingJob.status)) {
    throw new AppError("Job status does not allow deletion", 409);
  }

  const filename = path.basename(existingJob.storage_key);
  const filePath = path.join(__dirname, "../../../uploads", existingJob.session_id, filename);
  await removeUploadedFile(filePath);

  const deletedJob = await markJobDeleted(jobId);

  if (!deletedJob) {
    throw new AppError("Job could not be deleted", 409);
  }

  emitJobDeleted(deletedJob);

  return deletedJob;
};

module.exports = {
  createPrintJob,
  printJob,
  deleteJob,
};
