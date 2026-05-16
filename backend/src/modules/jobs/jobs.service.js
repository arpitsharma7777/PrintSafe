const AppError = require("../../utils/AppError");
const {
  findJobById,
  markPendingJobPrinted,
} = require("./jobs.repository");
const { emitJobPrinted } = require("../../socket/jobSocket");

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

module.exports = {
  printJob,
};
