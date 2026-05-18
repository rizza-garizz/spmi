const prisma = require("../lib/prisma");
const { success } = require("../utils/apiResponse");

async function summary(_req, res) {
  const [standarAktif, dokumenAktif, rtlBerjalan, temuanAudit] = await Promise.all([
    prisma.mutuStandard.count({
      where: {
        deletedAt: null,
        status: "aktif",
      },
    }),
    prisma.spmiDocument.count({
      where: { deletedAt: null },
    }),
    prisma.amiFinding.count({
      where: {
        deletedAt: null,
        rtlStatus: {
          in: ["draft", "berjalan"],
        },
      },
    }),
    prisma.amiFinding.count({
      where: { deletedAt: null },
    }),
  ]);

  return success(
    res,
    {
      standar_aktif: standarAktif,
      dokumen_aktif: dokumenAktif,
      rtl_berjalan: rtlBerjalan,
      temuan_audit: temuanAudit,
    },
    "Ringkasan dashboard"
  );
}

module.exports = {
  summary,
};
