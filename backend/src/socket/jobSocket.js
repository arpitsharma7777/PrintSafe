const { getIo } = require("./socket");
const SOCKET_EVENTS = require("./socketEvents");
const logger = require("../utils/logger");

const emitJobCreated = (job) => {
  const io = getIo();

  logger.info({
    event: SOCKET_EVENTS.JOB_CREATED,
    jobId: job.id,
    sessionId: job.session_id,
  }, "Socket event emitted");

  io.emit(SOCKET_EVENTS.JOB_CREATED, {
    job,
  });
};

const emitJobPrinted = (job) => {
  const io = getIo();

  logger.info({
    event: SOCKET_EVENTS.JOB_PRINTED,
    jobId: job.id,
    sessionId: job.session_id,
  }, "Socket event emitted");

  io.emit(SOCKET_EVENTS.JOB_PRINTED, {
    job,
  });
};

const emitJobDeleted = (job) => {
  const io = getIo();

  logger.info({
    event: SOCKET_EVENTS.JOB_DELETED,
    jobId: job.id,
    sessionId: job.session_id,
  }, "Socket event emitted");

  io.emit(SOCKET_EVENTS.JOB_DELETED, {
    job,
  });
};

module.exports = {
  emitJobCreated,
  emitJobPrinted,
  emitJobDeleted,
};
