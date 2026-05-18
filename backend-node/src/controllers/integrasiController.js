const prisma = require("../lib/prisma");
const { success } = require("../utils/apiResponse");

async function status(_req, res) {
  const logs = await prisma.integrationSyncLog.findMany({
    orderBy: { syncedAt: "desc" },
    take: 10,
  });

  const latestByService = logs.reduce((acc, item) => {
    if (!acc[item.service]) {
      acc[item.service] = item;
    }
    return acc;
  }, {});

  return success(
    res,
    {
      services: latestByService,
      latest_logs: logs,
    },
    "Status integrasi"
  );
}

async function sync(req, res) {
  const log = await prisma.integrationSyncLog.create({
    data: {
      service: req.body.service || "pddikti",
      status: "synced",
      message: "Sinkronisasi simulasi berhasil dijalankan",
      metadata: {
        triggered_by: req.user.email,
      },
      createdById: req.user.id,
    },
  });

  return success(res, log, "Sinkronisasi berhasil dijalankan", 201);
}

module.exports = {
  status,
  sync,
};
