const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/apiResponse");
const { isValidUuid } = require("../../utils/validators");
const { printJob, deleteJob } = require("./jobs.service");

const printJobController = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidUuid(jobId)) {
      throw new AppError("Invalid job ID format", 400);
    }

    const job = await printJob(jobId);

    return sendSuccess(res, 200, "Job marked as printed successfully", {
      job,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteJobController = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidUuid(jobId)) {
      throw new AppError("Invalid job ID format", 400);
    }

    const job = await deleteJob(jobId);

    return sendSuccess(res, 200, "Job marked as deleted successfully", {
      job,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  printJobController,
  deleteJobController,
};
