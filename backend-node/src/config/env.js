const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const rootDir = path.resolve(__dirname, "..", "..");
const nodeEnv = process.env.NODE_ENV || "development";
const appMode = process.env.APP_MODE || "local_mock";
const jwtSecret = process.env.JWT_SECRET || "change-me";
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const apiDocsEnabled = process.env.ENABLE_API_DOCS === "true" || nodeEnv !== "production";
const passwordMinLength = Number(process.env.PASSWORD_MIN_LENGTH || 8);
const authRateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX || 20);
const mutationRateLimitMax = Number(process.env.MUTATION_RATE_LIMIT_MAX || 120);

if (nodeEnv === "production") {
  if (appMode !== "database") {
    throw new Error("APP_MODE=database wajib untuk production.");
  }

  if (!jwtSecret || jwtSecret === "change-me" || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET production wajib diisi minimal 32 karakter.");
  }

  if (corsOrigins.length === 0) {
    throw new Error("CORS_ORIGINS wajib diisi untuk production.");
  }
}

module.exports = {
  rootDir,
  port: Number(process.env.PORT || 4000),
  nodeEnv,
  appMode,
  appUrl: process.env.APP_URL || "http://localhost:4000",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  sessionTimeoutSeconds: Number(process.env.SESSION_TIMEOUT_SECONDS || 24 * 60 * 60),
  databaseUrl: process.env.DATABASE_URL || "",
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || "uploads"),
  corsOrigins,
  apiDocsEnabled,
  passwordMinLength,
  authRateLimitMax,
  mutationRateLimitMax,
};
