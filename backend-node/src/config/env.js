const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const rootDir = path.resolve(__dirname, "..", "..");

module.exports = {
  rootDir,
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  appMode: process.env.APP_MODE || "local_mock",
  appUrl: process.env.APP_URL || "http://localhost:4000",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  sessionTimeoutSeconds: Number(process.env.SESSION_TIMEOUT_SECONDS || 24 * 60 * 60),
  databaseUrl: process.env.DATABASE_URL || "",
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || "uploads"),
};
