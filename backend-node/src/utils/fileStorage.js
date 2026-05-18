const fs = require("fs");
const path = require("path");
const multer = require("multer");
const env = require("../config/env");
const AppError = require("./appError");

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, env.uploadDir),
  filename: (_, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  },
});

const allowedDocumentTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

const fileFilter = (_, file, cb) => {
  if (!allowedDocumentTypes.has(file.mimetype)) {
    return cb(new AppError("Format file tidak didukung", 400));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter,
});

function resolveUploadedFile(storedName) {
  return path.join(env.uploadDir, storedName);
}

module.exports = {
  upload,
  resolveUploadedFile,
};
