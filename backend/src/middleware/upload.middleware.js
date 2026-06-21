const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto");

const AppError = require("../utils/AppError");
const { isValidUuid, isPdfMimeType } = require("../utils/validators");

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const sanitizeFilename = (filename) => {
  const baseName = path.basename(filename);
  const ext = path.extname(baseName).toLowerCase();
  const nameWithoutExt = path.basename(baseName, ext);

  const safeName = nameWithoutExt
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);

  return `${safeName || "document"}.pdf`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { sessionId } = req.body;

    if (!isValidUuid(sessionId)) {
      return cb(new AppError("Invalid session ID format", 400));
    }

    const uploadDir = path.join(__dirname, "../../uploads", sessionId);

    fs.mkdirSync(uploadDir, { recursive: true });

    return cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const safeFilename = sanitizeFilename(file.originalname);
    const uniqueFilename = `${Date.now()}-${randomUUID()}-${safeFilename}`;

    return cb(null, uniqueFilename);
  },
});

const fileFilter = (req, file, cb) => {
  if (!isPdfMimeType(file.mimetype)) {
    return cb(new AppError("Invalid file type. Only PDF files are allowed.", 400));
  }

  return cb(null, true);
};

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
}).single("file");

const handlePdfUpload = (req, res, next) => {
  uploadPdf(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("File too large. Maximum PDF size is 10 MB.", 400));
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return next(new AppError("Only one PDF file can be uploaded.", 400));
      }

      return next(new AppError(error.message, 400));
    }

    return next(error);
  });
};

module.exports = {
  handlePdfUpload,
};