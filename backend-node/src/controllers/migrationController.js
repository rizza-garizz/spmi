const { success } = require("../utils/apiResponse");
const { parseAoaMigration, commitAoaMigration } = require("../services/migrationService");

async function previewAoa(req, res) {
  const preview = await parseAoaMigration(req.file, req.body?.entity || "standards");
  return success(res, preview, "Preview migrasi AOA berhasil dibuat.");
}

async function commitAoa(req, res) {
  const result = await commitAoaMigration(req.file, req.user, {
    entity: req.body?.entity || "standards",
    strategy: req.body?.strategy || "skip_duplicates",
  });

  return success(res, result, "Migrasi AOA berhasil dijalankan.", 201);
}

module.exports = {
  previewAoa,
  commitAoa,
};
