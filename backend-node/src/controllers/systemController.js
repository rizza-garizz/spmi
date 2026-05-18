const prisma = require("../lib/prisma");
const env = require("../config/env");
const { success } = require("../utils/apiResponse");

async function status(_req, res) {
  let databaseConnected = false;
  let databaseError = null;

  if (env.appMode === "database") {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch (error) {
      databaseError = error.message;
    }
  }

  return success(
    res,
    {
      app_mode: env.appMode,
      node_env: env.nodeEnv,
      app_url: env.appUrl,
      database_connected: databaseConnected,
      database_error: databaseError,
      seed_mode_active: env.appMode === "local_mock",
      api_version: "1.0.0",
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    "Status sistem backend"
  );
}

module.exports = {
  status,
};
