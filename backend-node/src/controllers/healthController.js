const { success } = require("../utils/apiResponse");
const fs = require("fs/promises");
const path = require("path");
const env = require("../config/env");
const prisma = require("../lib/prisma");

function health(_req, res) {
  return success(
    res,
    {
      status: "ok",
      service: "SPMI Command Center API",
    },
    "Layanan aktif"
  );
}

function live(_req, res) {
  return success(res, { status: "live" }, "Service live");
}

async function checkDatabase() {
  if (env.appMode !== "database") {
    return {
      status: "skipped",
      mode: env.appMode,
      message: "Database check dilewati pada mode non-database.",
    };
  }

  await prisma.$queryRaw`SELECT 1`;
  return {
    status: "ok",
    mode: env.appMode,
  };
}

async function checkStorage() {
  await fs.mkdir(env.uploadDir, { recursive: true });
  await fs.access(env.uploadDir);

  return {
    status: "ok",
    path: path.relative(env.rootDir, env.uploadDir) || ".",
  };
}

async function ready(_req, res) {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    env: {
      status: "ok",
      app_mode: env.appMode,
      docs_enabled: env.apiDocsEnabled,
      cors_configured: env.nodeEnv === "production" ? env.corsOrigins.length > 0 : true,
    },
  };

  const readyStatus = Object.values(checks).every((item) => item.status === "ok" || item.status === "skipped") ? "ready" : "degraded";

  return success(res, { status: readyStatus, checks }, "Readiness check");
}

module.exports = {
  health,
  live,
  ready,
};
