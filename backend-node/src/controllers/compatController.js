const {
  state,
  getCatalogSnapshot,
  getDashboardSummary,
  getHrisSummary,
  getHrisEmployeeProfile,
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
  addHrisEmployee,
  updateHrisEmployee,
  deleteHrisEmployee,
  addHrisPosition,
  updateHrisPosition,
  deleteHrisPosition,
  addHrisCompetency,
  updateHrisCompetency,
  deleteHrisCompetency,
  addHrisDocument,
  updateHrisDocument,
  deleteHrisDocument,
} = require("../services/catalogStore");
const { success, failure } = require("../utils/apiResponse");
const {
  canAccessOrgUnit,
  scopeItemForUser,
  transitionApproval,
} = require("../services/accessPolicy");

function canReadScopedItem(req, item, options = {}) {
  if (!req.user) return true;
  return canAccessOrgUnit(req.user, item.org_unit_code, options);
}

function scopedItems(req, items, options = {}) {
  return items.filter((item) => canReadScopedItem(req, item, options));
}

function prepareScopedPayload(req) {
  const payload = scopeItemForUser(req.body || {}, req.user);
  if (!canAccessOrgUnit(req.user, payload.org_unit_code)) {
    return null;
  }
  return payload;
}

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

function documents(req, res) {
  return success(res, scopedItems(req, state.documents), "Daftar dokumen");
}

function createDocument(req, res) {
  const fileName = req.file?.originalname || req.body?.file_name || "mock-file.pdf";
  const payload = prepareScopedPayload(req);
  if (!payload) return failure(res, "Anda tidak dapat membuat data di luar scope unit kerja.", 403);

  return res.status(201).json({
    success: true,
    data: addDocument({ ...payload, file_name: fileName }, req.user),
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

function ppeppCycles(req, res) {
  return success(res, scopedItems(req, getCatalogSnapshot().ppeppCycles), "Daftar siklus PPEPP");
}

function createPpeppCycle(req, res) {
  const payload = prepareScopedPayload(req);
  if (!payload) return failure(res, "Anda tidak dapat membuat data di luar scope unit kerja.", 403);

  return res.status(201).json({
    success: true,
    data: addPpeppCycle(payload, req.user),
    message: "Siklus PPEPP berhasil dibuat di mode lokal.",
  });
}

function amiAudits(req, res) {
  return success(res, scopedItems(req, state.audits, { allowAuditor: true }), "Daftar audit mutu internal");
}

function createAmiAudit(req, res) {
  const payload = prepareScopedPayload(req);
  if (!payload) return failure(res, "Anda tidak dapat membuat data di luar scope unit kerja.", 403);

  return res.status(201).json({
    success: true,
    data: addAmiAudit(payload, req.user),
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

function rtmMeetings(req, res) {
  const meetings = state.meetings
    .map((meeting) => ({
      ...meeting,
      actions: scopedItems(req, meeting.actions || []),
    }))
    .filter((meeting) => canReadScopedItem(req, meeting) || meeting.actions.length > 0);

  return success(res, meetings, "Daftar rapat tinjauan manajemen");
}

function createMeeting(req, res) {
  const payload = prepareScopedPayload(req);
  if (!payload) return failure(res, "Anda tidak dapat membuat data di luar scope unit kerja.", 403);

  return res.status(201).json({
    success: true,
    data: addMeeting(payload, req.user),
    message: "Rapat RTM berhasil dibuat di mode lokal.",
  });
}

function updateMeetingActionProgress(req, res) {
  const meeting = state.meetings.find((item) => String(item.id) === String(req.params.meetingId));
  const action = meeting?.actions?.find((item) => String(item.id) === String(req.params.actionId));
  if (!action) return failure(res, "Action RTL tidak ditemukan.", 404);
  if (!canAccessOrgUnit(req.user, action.org_unit_code)) {
    return failure(res, "Anda tidak dapat memperbarui RTL di luar scope unit kerja.", 403);
  }

  const updatedAction = updateMeetingAction(req.params.meetingId, req.params.actionId, req.body || {});
  if (!updatedAction) {
    return failure(res, "Action RTL tidak ditemukan.", 404);
  }

  return success(res, updatedAction, "Progres RTL berhasil diperbarui di mode lokal.");
}

function indicators(req, res) {
  return success(res, scopedItems(req, state.indicators), "Daftar indikator mutu");
}

function createIndicator(req, res) {
  const payload = prepareScopedPayload(req);
  if (!payload) return failure(res, "Anda tidak dapat membuat data di luar scope unit kerja.", 403);

  return res.status(201).json({
    success: true,
    data: addIndicator(payload, req.user),
    message: "Indikator berhasil dibuat di mode lokal.",
  });
}

function createIndicatorValue(req, res) {
  const indicator = state.indicators.find((item) => String(item.id) === String(req.params.id));
  if (!indicator) return failure(res, "Indikator tidak ditemukan.", 404);
  if (!canAccessOrgUnit(req.user, indicator.org_unit_code)) {
    return failure(res, "Anda tidak dapat mengisi capaian di luar scope unit kerja.", 403);
  }

  const value = addIndicatorValue(req.params.id, req.body || {});
  if (!value) {
    return failure(res, "Indikator tidak ditemukan.", 404);
  }

  return success(res, value, "Capaian indikator berhasil disimpan di mode lokal.", 201);
}

function resolveGovernanceCollection(entity) {
  if (entity === "documents") return state.documents;
  if (entity === "ppepp") return state.ppeppCycles;
  if (entity === "indicators") return state.indicators;
  if (entity === "ami") return state.audits;
  if (entity === "rtl") return state.meetings.flatMap((meeting) => meeting.actions || []);
  return null;
}

function updateApproval(req, res) {
  const collection = resolveGovernanceCollection(req.params.entity);
  if (!collection) return failure(res, "Entitas approval tidak dikenal.", 404);

  const item = collection.find((entry) => String(entry.id) === String(req.params.id));
  if (!item) return failure(res, "Data approval tidak ditemukan.", 404);
  if (!canAccessOrgUnit(req.user, item.org_unit_code, { allowAuditor: req.params.entity === "ami" })) {
    return failure(res, "Anda tidak dapat mengakses approval di luar scope unit kerja.", 403);
  }

  const nextApproval = transitionApproval(item, req.user, req.body?.action, req.body?.note || "");
  if (!nextApproval) return failure(res, "Role Anda tidak berwenang menjalankan tahap approval ini.", 403);

  item.approval = nextApproval;
  item.status = nextApproval.status === "approved" ? "approved" : item.status;

  return success(res, item, "Status approval berhasil diperbarui di mode lokal.");
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

function hris(_req, res) {
  return success(res, getHrisSummary(), "Ringkasan HRIS");
}

function hrisEmployees(_req, res) {
  return success(res, getHrisSummary().employees, "Daftar pegawai HRIS");
}

function hrisEmployeeProfile(req, res) {
  const profile = getHrisEmployeeProfile(req.params.id);
  if (!profile) {
    return failure(res, "Pegawai HRIS tidak ditemukan.", 404);
  }

  return success(res, profile, "Profil pegawai HRIS");
}

function createHrisEmployee(req, res) {
  return success(res, addHrisEmployee(req.body || {}), "Pegawai HRIS berhasil dibuat di mode lokal.", 201);
}

function updateHrisEmployeeRecord(req, res) {
  const employee = updateHrisEmployee(req.params.id, req.body || {});
  if (!employee) {
    return failure(res, "Pegawai HRIS tidak ditemukan.", 404);
  }

  return success(res, employee, "Pegawai HRIS berhasil diperbarui di mode lokal.");
}

function deleteHrisEmployeeRecord(req, res) {
  const employee = deleteHrisEmployee(req.params.id);
  if (!employee) {
    return failure(res, "Pegawai HRIS tidak ditemukan.", 404);
  }

  return success(res, employee, "Pegawai HRIS berhasil dihapus di mode lokal.");
}

function hrisPositions(_req, res) {
  return success(res, getHrisSummary().positions, "Daftar jabatan HRIS");
}

function createHrisPosition(req, res) {
  return success(res, addHrisPosition(req.body || {}), "Jabatan HRIS berhasil dibuat di mode lokal.", 201);
}

function updateHrisPositionRecord(req, res) {
  const position = updateHrisPosition(req.params.id, req.body || {});
  if (!position) {
    return failure(res, "Jabatan HRIS tidak ditemukan.", 404);
  }

  return success(res, position, "Jabatan HRIS berhasil diperbarui di mode lokal.");
}

function deleteHrisPositionRecord(req, res) {
  const position = deleteHrisPosition(req.params.id);
  if (!position) {
    return failure(res, "Jabatan HRIS tidak ditemukan.", 404);
  }

  return success(res, position, "Jabatan HRIS berhasil dihapus di mode lokal.");
}

function hrisCompetencies(_req, res) {
  return success(res, getHrisSummary().competencies, "Daftar kompetensi HRIS");
}

function createHrisCompetency(req, res) {
  return success(res, addHrisCompetency(req.body || {}), "Kompetensi HRIS berhasil dibuat di mode lokal.", 201);
}

function updateHrisCompetencyRecord(req, res) {
  const competency = updateHrisCompetency(req.params.id, req.body || {});
  if (!competency) {
    return failure(res, "Kompetensi HRIS tidak ditemukan.", 404);
  }

  return success(res, competency, "Kompetensi HRIS berhasil diperbarui di mode lokal.");
}

function deleteHrisCompetencyRecord(req, res) {
  const competency = deleteHrisCompetency(req.params.id);
  if (!competency) {
    return failure(res, "Kompetensi HRIS tidak ditemukan.", 404);
  }

  return success(res, competency, "Kompetensi HRIS berhasil dihapus di mode lokal.");
}

function hrisDocuments(_req, res) {
  return success(res, getHrisSummary().documents, "Daftar dokumen HRIS");
}

function buildHrisDocumentPayload(req) {
  return {
    ...(req.body || {}),
    fileName: req.file?.originalname || req.body?.fileName || req.body?.file_name || null,
    filePath: req.file?.path || req.body?.filePath || req.body?.file_path || null,
    fileSize: req.file?.size || req.body?.fileSize || req.body?.file_size || 0,
  };
}

function createHrisDocument(req, res) {
  return success(res, addHrisDocument(buildHrisDocumentPayload(req)), "Dokumen HRIS berhasil dibuat di mode lokal.", 201);
}

function updateHrisDocumentRecord(req, res) {
  const document = updateHrisDocument(req.params.id, buildHrisDocumentPayload(req));
  if (!document) {
    return failure(res, "Dokumen HRIS tidak ditemukan.", 404);
  }

  return success(res, document, "Dokumen HRIS berhasil diperbarui di mode lokal.");
}

function deleteHrisDocumentRecord(req, res) {
  const document = deleteHrisDocument(req.params.id);
  if (!document) {
    return failure(res, "Dokumen HRIS tidak ditemukan.", 404);
  }

  return success(res, document, "Dokumen HRIS berhasil dihapus di mode lokal.");
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
  updateApproval,
  orgUnits,
  integrations,
  imports,
  hris,
  hrisEmployees,
  hrisEmployeeProfile,
  createHrisEmployee,
  updateHrisEmployeeRecord,
  deleteHrisEmployeeRecord,
  hrisPositions,
  createHrisPosition,
  updateHrisPositionRecord,
  deleteHrisPositionRecord,
  hrisCompetencies,
  createHrisCompetency,
  updateHrisCompetencyRecord,
  deleteHrisCompetencyRecord,
  hrisDocuments,
  createHrisDocument,
  updateHrisDocumentRecord,
  deleteHrisDocumentRecord,
  surveys,
  createSurvey,
  createImport,
};
