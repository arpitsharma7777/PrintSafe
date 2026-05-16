const { getIo } = require("./socket");
const SOCKET_EVENTS = require("./socketEvents");

const emitJobCreated = (job) => {
  const io = getIo();

  io.emit(SOCKET_EVENTS.JOB_CREATED, {
    job,
  });
};

const emitJobPrinted = (job) => {
  const io = getIo();

  io.emit(SOCKET_EVENTS.JOB_PRINTED, {
    job,
  });
};

const emitJobDeleted = (job) => {
  const io = getIo();

  io.emit(SOCKET_EVENTS.JOB_DELETED, {
    job,
  });
};

module.exports = {
  emitJobCreated,
  emitJobPrinted,
  emitJobDeleted,
};
