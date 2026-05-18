const prisma = require("../lib/prisma");
const { success } = require("../utils/apiResponse");

async function getSettings(req, res) {
  const settings = await prisma.systemSetting.findUnique({
    where: { institutionId: req.user.institutionId },
  });

  return success(res, settings, "Pengaturan sistem");
}

async function updateSettings(req, res) {
  const settings = await prisma.systemSetting.upsert({
    where: { institutionId: req.user.institutionId },
    update: {
      institutionName: req.body.institution_name,
      academicYear: req.body.academic_year,
      systemName: req.body.system_name,
      configuration: req.body.configuration || {},
    },
    create: {
      institutionId: req.user.institutionId,
      institutionName: req.body.institution_name,
      academicYear: req.body.academic_year,
      systemName: req.body.system_name,
      configuration: req.body.configuration || {},
    },
  });

  return success(res, settings, "Pengaturan berhasil diperbarui");
}

module.exports = {
  getSettings,
  updateSettings,
};
