const {
  listOrgUnits,
  createOrgUnit,
  updateOrgUnit,
  deleteOrgUnit,
  previewSiakadOrgUnits,
  commitSiakadOrgUnits,
  listSiakadSyncBatches,
} = require("../services/orgUnitService");
const { checkConnection } = require("../services/siakadConnector");
const { recordAuditEvent } = require("../services/auditService");
const { success } = require("../utils/apiResponse");

function actor(req) {
  return {
    actor_id: req.user?.id || null,
    actor_email: req.user?.email || req.user?.username || "system",
    role: req.user?.role || req.user?.roles?.[0] || null,
  };
}

async function index(_req, res) {
  return success(res, await listOrgUnits(), "Daftar unit kerja");
}

async function store(req, res) {
  const unit = await createOrgUnit(req.body || {});
  await recordAuditEvent({
    ...actor(req),
    action: "org_unit.create",
    entity: "org_unit",
    entity_id: unit.id,
    after: unit,
    method: req.method,
    path: req.originalUrl,
    status_code: 201,
  });
  return success(res, unit, "Unit organisasi berhasil dibuat.", 201);
}

async function update(req, res) {
  const result = await updateOrgUnit(req.params.id, req.body || {});
  await recordAuditEvent({
    ...actor(req),
    action: "org_unit.update",
    entity: "org_unit",
    entity_id: result.after.id,
    before: result.before,
    after: result.after,
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
  });
  return success(res, result.after, "Unit organisasi berhasil diperbarui.");
}

async function destroy(req, res) {
  const result = await deleteOrgUnit(req.params.id);
  await recordAuditEvent({
    ...actor(req),
    action: "org_unit.deactivate",
    entity: "org_unit",
    entity_id: result.after.id,
    before: result.before,
    after: result.after,
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
  });
  return success(res, result.after, "Unit organisasi berhasil dinonaktifkan.");
}

async function siakadPreview(req, res) {
  const payload = await previewSiakadOrgUnits(req.body?.units, { actorEmail: actor(req).actor_email });
  return success(res, payload, "Preview sinkronisasi SIAKAD");
}

async function siakadCheck(_req, res) {
  return success(res, await checkConnection(), "Status koneksi SIAKAD");
}

async function siakadBatches(req, res) {
  return success(res, await listSiakadSyncBatches(req.query?.limit), "Riwayat batch sinkronisasi SIAKAD");
}

async function siakadCommit(req, res) {
  const payload = await commitSiakadOrgUnits(req.body?.units);
  await recordAuditEvent({
    ...actor(req),
    action: "org_unit.siakad_sync",
    entity: "org_unit",
    after: payload,
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
  });
  return success(res, payload, "Sinkronisasi SIAKAD berhasil diterapkan.");
}

module.exports = {
  index,
  store,
  update,
  destroy,
  siakadCheck,
  siakadBatches,
  siakadPreview,
  siakadCommit,
};
