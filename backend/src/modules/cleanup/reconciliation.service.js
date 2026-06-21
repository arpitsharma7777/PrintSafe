const fs = require("fs/promises");
const path = require("path");
const pool = require("../../config/db");
const { isValidUuid } = require("../../utils/validators");
const logger = require("../../utils/logger");

/**
 * Scans local storage, compares with DB metadata, and deletes orphaned files.
 * @param {Object} options
 * @param {number} options.minAgeMs - Minimum age in ms of files to be cleaned (to avoid race conditions with active uploads). Defaults to 5 minutes (300000ms).
 */
const reconcileOrphanFiles = async (options = {}) => {
  const minAgeMs = options.minAgeMs !== undefined ? options.minAgeMs : 5 * 60 * 1000;
  const uploadsDir = path.join(__dirname, "../../../uploads");

  logger.info({ uploadsDir, minAgeMs }, "Reconciliation scan started");

  let sessionDirs;
  try {
    sessionDirs = await fs.readdir(uploadsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      logger.info("Uploads directory does not exist. No files to reconcile.");
      return;
    }
    throw error;
  }

  const discoveredFiles = [];
  const discoveredSessionIds = new Set();

  for (const dirEntry of sessionDirs) {
    const dirPath = path.join(uploadsDir, dirEntry.name);

    if (!dirEntry.isDirectory()) {
      // If there is a stray file directly in the uploads/ root, delete it if older than minAgeMs
      try {
        const stats = await fs.stat(dirPath);
        if (Date.now() - stats.mtimeMs >= minAgeMs) {
          await fs.unlink(dirPath);
          logger.info({ filePath: dirPath }, "Removed stray file in uploads root");
        }
      } catch (err) {
        logger.error(err, "Failed to handle stray file", { filePath: dirPath });
      }
      continue;
    }

    const sessionId = dirEntry.name;

    // Validate if the folder name is a valid session UUID
    if (!isValidUuid(sessionId)) {
      try {
        const stats = await fs.stat(dirPath);
        if (Date.now() - stats.mtimeMs >= minAgeMs) {
          await fs.rm(dirPath, { recursive: true, force: true });
          logger.info({ dirPath }, "Removed invalid directory (non-UUID)");
        }
      } catch (err) {
        logger.error(err, "Failed to remove invalid directory", { dirPath });
      }
      continue;
    }

    // Read files within this valid session folder
    let files;
    try {
      files = await fs.readdir(dirPath, { withFileTypes: true });
    } catch (err) {
      logger.error(err, "Failed to read session directory", { dirPath });
      continue;
    }

    discoveredSessionIds.add(sessionId);

    for (const fileEntry of files) {
      const filePath = path.join(dirPath, fileEntry.name);

      if (fileEntry.isDirectory()) {
        // Nested directories are not supported, delete them
        try {
          await fs.rm(filePath, { recursive: true, force: true });
          logger.info({ filePath }, "Removed unsupported nested directory");
        } catch (err) {
          logger.error(err, "Failed to remove nested directory", { filePath });
        }
        continue;
      }

      try {
        const stats = await fs.stat(filePath);
        const age = Date.now() - stats.mtimeMs;

        if (age < minAgeMs) {
          // Skip recently modified files to prevent deleting active uploads
          continue;
        }

        discoveredFiles.push({
          sessionId,
          filename: fileEntry.name,
          filePath,
          storageKey: `sessions/${sessionId}/${fileEntry.name}`,
        });
      } catch (err) {
        logger.error(err, "Failed to get file stats", { filePath });
      }
    }
  }

  if (discoveredFiles.length === 0 && discoveredSessionIds.size === 0) {
    logger.info("No files or folders to reconcile");
    return;
  }

  // Bulk query database for sessions
  const sessionIdsArray = Array.from(discoveredSessionIds);
  let dbSessions = {};
  if (sessionIdsArray.length > 0) {
    const sessionQuery = `
      SELECT id, status
      FROM sessions
      WHERE id = ANY($1::uuid[]);
    `;
    const sessionResult = await pool.query(sessionQuery, [sessionIdsArray]);
    dbSessions = sessionResult.rows.reduce((acc, row) => {
      acc[row.id] = row.status;
      return acc;
    }, {});
  }

  // Bulk query database for jobs
  const storageKeysArray = discoveredFiles.map((f) => f.storageKey);
  let dbJobs = {};
  if (storageKeysArray.length > 0) {
    const jobsQuery = `
      SELECT id, storage_key, status
      FROM jobs
      WHERE storage_key = ANY($1::text[]);
    `;
    const jobsResult = await pool.query(jobsQuery, [storageKeysArray]);
    dbJobs = jobsResult.rows.reduce((acc, row) => {
      acc[row.storage_key] = row.status;
      return acc;
    }, {});
  }

  // Determine which files are orphans and delete them
  for (const file of discoveredFiles) {
    const sessionStatus = dbSessions[file.sessionId];
    const jobStatus = dbJobs[file.storageKey];
    let isOrphan = false;
    let reason = "";

    if (!sessionStatus) {
      isOrphan = true;
      reason = "Session ID not found in database";
    } else if (sessionStatus === "EXPIRED" || sessionStatus === "CLOSED") {
      isOrphan = true;
      reason = `Session is ${sessionStatus}`;
    } else if (!jobStatus) {
      isOrphan = true;
      reason = "Job not found in database for this file";
    } else if (jobStatus === "DELETED" || jobStatus === "FAILED") {
      isOrphan = true;
      reason = `Job status is ${jobStatus}`;
    }

    if (isOrphan) {
      try {
        await fs.unlink(file.filePath);
        logger.info({ filePath: file.filePath, reason }, "Deleted orphaned file");
      } catch (err) {
        if (err.code !== "ENOENT") {
          logger.error(err, "Failed to delete orphaned file", { filePath: file.filePath });
        }
      }
    }
  }

  // Clean up empty session folders
  for (const sessionId of sessionIdsArray) {
    const dirPath = path.join(uploadsDir, sessionId);
    try {
      const files = await fs.readdir(dirPath);
      if (files.length === 0) {
        await fs.rm(dirPath, { recursive: true, force: true });
        logger.info({ dirPath }, "Removed empty session directory");
      }
    } catch (err) {
      if (err.code !== "ENOENT") {
        logger.error(err, "Failed to check/remove empty folder", { dirPath });
      }
    }
  }

  logger.info("Reconciliation scan completed");
};

module.exports = {
  reconcileOrphanFiles,
};
