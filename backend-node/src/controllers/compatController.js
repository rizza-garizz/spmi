const {
  state,
  getCatalogSnapshot,
  getDashboardSummary,
  addStandard,
  addDocument,
  addFinding,
  addMeeting,
  updateMeetingAction,
  addPpeppCycle,
  addAmiAudit,
  addIndicator,
  addIndicatorValue,
  addSurvey,
  addImport,
} = require("../services/catalogStore");
const { success, failure } = require("../utils/apiResponse");

function dashboardSummary(_req, res) {
  return success(res, getDashboardSummary(), "Ringkasan dashboard");
}

function catalog(_req, res) {
  return success(res, getCatalogSnapshot(), "Snapshot katalog");
}

function standards(_req, res) {
  return success(res, state.standards, "Daftar standar mutu");
}

function createStandard(req, res) {
  return success(res, addStandard(req.body || {}), "Standar berhasil dibuat di mode lokal.", 201);
}

function documents(_req, res) {
  return success(res, state.documents, "Daftar dokumen");
}

function createDocument(req, res) {
  const fileName = req.file?.originalname || req.body?.file_name || "mock-file.pdf";
  return res.status(201).json({
    success: true,
    data: addDocument({ ...(req.body || {}), file_name: fileName }),
    message: "Dokumen berhasil disimpan di mode lokal.",
  });
}

function documentVersion(req, res) {
  return success(
    res,
    {
      download_url: `http://127.0.0.1:4000/mock-downloads/${req.params.versionId}`,
    },
    "URL unduhan versi dokumen"
  );
}

function ppeppCycles(_req, res) {
  return success(res, getCatalogSnapshot().ppeppCycles, "Daftar siklus PPEPP");
}

function createPpeppCycle(req, res) {
  return res.status(201).json({
    success: true,
    data: addPpeppCycle(req.body || {}),
    message: "Siklus PPEPP berhasil dibuat di mode lokal.",
  });
}

function amiAudits(_req, res) {
  return success(res, state.audits, "Daftar audit mutu internal");
}

function createAmiAudit(req, res) {
  return res.status(201).json({
    success: true,
    data: addAmiAudit(req.body || {}),
    message: "AMI audit berhasil dibuat di mode lokal.",
  });
}

function createFinding(req, res) {
  return res.status(201).json({
    success: true,
    data: addFinding(req.params.id, req.body || {}),
    message: "Temuan berhasil ditambahkan di mode lokal.",
  });
}

function rtmMeetings(_req, res) {
  return success(res, state.meetings, "Daftar rapat tinjauan manajemen");
}

function createMeeting(req, res) {
  return res.status(201).json({
    success: true,
    data: addMeeting(req.body || {}),
    message: "Rapat RTM berhasil dibuat di mode lokal.",
  });
}

function updateMeetingActionProgress(req, res) {
  const action = updateMeetingAction(req.params.meetingId, req.params.actionId, req.body || {});
  if (!action) {
    return failure(res, "Action RTL tidak ditemukan.", 404);
  }

  return success(res, action, "Progres RTL berhasil diperbarui di mode lokal.");
}

function indicators(_req, res) {
  return success(res, state.indicators, "Daftar indikator mutu");
}

function createIndicator(req, res) {
  return res.status(201).json({
    success: true,
    data: addIndicator(req.body || {}),
    message: "Indikator berhasil dibuat di mode lokal.",
  });
}

function createIndicatorValue(req, res) {
  const value = addIndicatorValue(req.params.id, req.body || {});
  if (!value) {
    return failure(res, "Indikator tidak ditemukan.", 404);
  }

  return success(res, value, "Capaian indikator berhasil disimpan di mode lokal.", 201);
}

function orgUnits(_req, res) {
  const orgUnits = getCatalogSnapshot().orgUnits;
  const idByCode = new Map(orgUnits.map((item, index) => [item.code, index + 1]));

  return success(
    res,
    orgUnits.map((item, index) => ({
      id: index + 1,
      parent_id: item.parent_code ? idByCode.get(item.parent_code) || null : null,
      code: item.code,
      siakad_code: null,
      name: item.name,
      type: item.type,
    })),
    "Daftar unit kerja"
  );
}

function integrations(_req, res) {
  return success(res, getCatalogSnapshot().integrations, "Daftar integrasi");
}

function imports(_req, res) {
  return success(res, getCatalogSnapshot().imports, "Riwayat import");
}

function surveys(_req, res) {
  return success(res, getCatalogSnapshot().surveys, "Daftar survei");
}

function createSurvey(req, res) {
  return res.status(201).json({
    success: true,
    data: addSurvey(req.body || {}),
    message: "Survei berhasil dibuat di mode lokal.",
  });
}

function createImport(req, res) {
  const fileName = req.file?.originalname || req.body?.file_name || "mock-import.xlsx";
  return res.status(201).json({
    success: true,
    data: addImport({ ...(req.body || {}), file_name: fileName }),
    message: "Import berhasil dibuat di mode lokal.",
  });
}

module.exports = {
  dashboardSummary,
  catalog,
  standards,
  createStandard,
  documents,
  createDocument,
  documentVersion,
  ppeppCycles,
  createPpeppCycle,
  amiAudits,
  createAmiAudit,
  createFinding,
  rtmMeetings,
  createMeeting,
  updateMeetingActionProgress,
  indicators,
  createIndicator,
  createIndicatorValue,
  orgUnits,
  integrations,
  imports,
  surveys,
  createSurvey,
  createImport,
};
