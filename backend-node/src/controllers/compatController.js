const {
  state,
  getCatalogSnapshot,
  getDashboardSummary,
  getDashboardExport,
  getDocumentsPage,
  getPerformanceReport,
  getDataSyncMap,
  getHrisSummary,
  getHrisEmployeeProfile,
  getIntegrations,
  getIntegrationReadiness,
  getIntegrationLogs,
  checkIntegration,
  syncIntegration,
  addStandard,
  getActiveStandards,
  getStandardRevisions,
  updateStandard,
  deleteStandard,
  addDocument,
  addDocumentVersion,
  findDocument,
  findDocumentVersion,
  findDuplicateDocument,
  hasDuplicateFile,
  addFinding,
  addMeeting,
  updateMeetingAction,
  addPpeppCycle,
  updatePpeppStage,
  addPpeppEvidence,
  addAmiAudit,
  updateAmiAssignment,
  updateAmiInstrument,
  updateAmiFindingFollowUp,
  verifyAmiFinding,
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
const { listAuditEvents, recordAuditEvent, recordApprovalHistory } = require("../services/auditService");
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
  return items.filter((item) => !item.deleted_at && item.status !== "deleted" && canReadScopedItem(req, item, options));
}

function prepareScopedPayload(req) {
  const payload = scopeItemForUser(req.body || {}, req.user);
  if (!canAccessOrgUnit(req.user, payload.org_unit_code)) {
    return null;
  }
  return payload;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dashboardSummary(req, res) {
  return success(res, getDashboardSummary(req.query || {}), "Ringkasan dashboard");
}

function dashboardExport(req, res) {
  const payload = getDashboardExport(req.query?.format || "excel", req.query || {});
  res.setHeader("Content-Type", payload.mime_type);
  res.setHeader("Content-Disposition", `attachment; filename="${payload.file_name}"`);
  return res.send(payload.content);
}

function performanceReport(_req, res) {
  return success(res, getPerformanceReport(), "Laporan performa sistem");
}

function dataSyncMap(_req, res) {
  return success(res, getDataSyncMap(), "Peta sinkronisasi data antar modul");
}

function catalog(_req, res) {
  return success(res, getCatalogSnapshot(), "Snapshot katalog");
}

function mutationFailure(res, error, fallback = "Operasi gagal diproses.") {
  return failure(res, error?.message || fallback, error?.statusCode || 500, error?.metadata || {});
}

function standards(_req, res) {
  return success(res, getActiveStandards(), "Daftar standar mutu");
}

function createStandard(req, res) {
  try {
    return success(
      res,
      addStandard({ ...(req.body || {}), changed_by: req.user?.email || req.user?.username || "system" }, req.user),
      "Standar berhasil dibuat di mode lokal.",
      201
    );
  } catch (error) {
    return mutationFailure(res, error, "Standar gagal dibuat.");
  }
}

function standardRevisions(req, res) {
  const revisions = getStandardRevisions(req.params.id);
  if (!revisions) return failure(res, "Standar tidak ditemukan.", 404);
  return success(res, revisions, "Riwayat revisi standar");
}

function updateStandardRecord(req, res) {
  try {
    const standard = updateStandard(req.params.id, {
      ...(req.body || {}),
      changed_by: req.user?.email || req.user?.username || "system",
    });
    if (!standard) return failure(res, "Standar tidak ditemukan.", 404);
    return success(res, standard, "Standar berhasil diperbarui.");
  } catch (error) {
    return mutationFailure(res, error, "Standar gagal diperbarui.");
  }
}

function deleteStandardRecord(req, res) {
  try {
    const standard = deleteStandard(req.params.id, {
      ...(req.body || {}),
      changed_by: req.user?.email || req.user?.username || "system",
    });
    if (!standard) return failure(res, "Standar tidak ditemukan.", 404);
    return success(res, standard, "Standar berhasil dinonaktifkan.");
  } catch (error) {
    return mutationFailure(res, error, "Standar gagal dinonaktifkan.");
  }
}

function documents(req, res) {
  if (req.query?.page || req.query?.limit || req.query?.q || req.query?.search || req.query?.type || req.query?.unit) {
    return success(
      res,
      getDocumentsPage(req.query || {}, req.user, (item) => canReadScopedItem(req, item)),
      "Daftar dokumen terpaginasikan"
    );
  }
  return success(res, scopedItems(req, state.documents), "Daftar dokumen");
}

function updateDocumentRecord(req, res) {
  const document = state.documents.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!document) return failure(res, "Dokumen tidak ditemukan.", 404);
  if (!canReadScopedItem(req, document)) return failure(res, "Anda tidak dapat mengubah dokumen ini.", 403);

  const payload = req.body || {};
  Object.assign(document, {
    title: payload.title || document.title,
    type: payload.type || document.type,
    category: payload.category || document.category,
    owner: payload.owner || payload.penanggung_jawab || document.owner,
    org_unit_code: payload.org_unit_code || payload.orgUnitCode || document.org_unit_code,
    status: payload.status || document.status,
    document_date: payload.document_date || payload.tanggal || document.document_date,
    metadata: {
      ...(document.metadata || {}),
      ...(payload.metadata || {}),
      unit: payload.unit || payload.org_unit_code || document.metadata?.unit,
      kategori: payload.category || document.metadata?.kategori,
      penanggung_jawab: payload.owner || payload.penanggung_jawab || document.metadata?.penanggung_jawab,
      tanggal: payload.document_date || payload.tanggal || document.metadata?.tanggal,
    },
    updated_at: new Date().toISOString(),
  });

  return success(res, document, "Dokumen berhasil diperbarui di mode lokal.");
}

function deleteDocumentRecord(req, res) {
  const document = state.documents.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!document) return failure(res, "Dokumen tidak ditemukan.", 404);
  if (!canReadScopedItem(req, document)) return failure(res, "Anda tidak dapat menghapus dokumen ini.", 403);

  document.status = "deleted";
  document.deleted_at = new Date().toISOString();
  return success(res, document, "Dokumen berhasil dinonaktifkan di mode lokal.");
}

function createDocument(req, res) {
  const fileName = req.file?.originalname || req.body?.file_name || "mock-file.pdf";
  const fileSize = req.file?.size || 0;
  const mimeType = req.file?.mimetype || null;
  const payload = prepareScopedPayload(req);
  if (!payload) return failure(res, "Anda tidak dapat membuat data di luar scope unit kerja.", 403);
  const documentPayload = {
    ...payload,
    file_name: fileName,
    file_path: req.file?.path || null,
    file_size: fileSize,
    mime_type: mimeType,
  };

  const duplicate = findDuplicateDocument(documentPayload);
  if (duplicate) {
    if (!canReadScopedItem(req, duplicate)) return failure(res, "Dokumen duplikat berada di luar scope akses Anda.", 403);
    if (hasDuplicateFile(duplicate, documentPayload)) {
      return failure(res, "File duplikat terdeteksi. Upload dibatalkan agar repository tetap bersih.", 409);
    }

    try {
      const versioned = addDocumentVersion(duplicate.id, documentPayload, req.user);
      return success(res, versioned.document, "Dokumen sudah ada. File disimpan sebagai versi baru.", 201);
    } catch (error) {
      return mutationFailure(res, error, "Versi dokumen gagal dibuat.");
    }
  }

  try {
    return res.status(201).json({
      success: true,
      data: addDocument(documentPayload, req.user),
      message: "Dokumen berhasil disimpan di mode lokal.",
    });
  } catch (error) {
    return mutationFailure(res, error, "Dokumen gagal disimpan.");
  }
}

function documentVersion(req, res) {
  const found = findDocumentVersion(req.params.versionId);
  if (!found) return failure(res, "Versi dokumen tidak ditemukan.", 404);
  if (!canReadScopedItem(req, found.document)) return failure(res, "Anda tidak dapat mengakses dokumen ini.", 403);

  return success(
    res,
    {
      version: found.version,
      document: {
        id: found.document.id,
        code: found.document.code,
        title: found.document.title,
      },
      download_url: `/documents/versions/${req.params.versionId}/download`,
      preview_url: `/documents/versions/${req.params.versionId}/preview`,
    },
    "URL unduhan versi dokumen"
  );
}

function documentVersionDownload(req, res) {
  const found = findDocumentVersion(req.params.versionId);
  if (!found) return failure(res, "Versi dokumen tidak ditemukan.", 404);
  if (!canReadScopedItem(req, found.document)) return failure(res, "Anda tidak dapat mengakses dokumen ini.", 403);

  return success(res, {
    file_name: found.version.file_name,
    file_size: found.version.file_size,
    mime_type: found.version.mime_type,
    download_url: found.version.file_path || `/mock-downloads/${req.params.versionId}`,
  }, "Download dokumen siap.");
}

function documentVersionPreview(req, res) {
  const found = findDocumentVersion(req.params.versionId);
  if (!found) return failure(res, "Versi dokumen tidak ditemukan.", 404);
  if (!canReadScopedItem(req, found.document)) return failure(res, "Anda tidak dapat mengakses dokumen ini.", 403);

  return success(res, {
    document: found.document,
    version: found.version,
    preview_supported: Boolean(found.version.mime_type?.includes("pdf") || found.version.mime_type?.startsWith("image/")),
    preview_url: found.version.file_path || `/mock-preview/${req.params.versionId}`,
  }, "Preview dokumen siap.");
}

function createDocumentVersion(req, res) {
  const document = findDocument(req.params.id);
  if (!document) return failure(res, "Dokumen tidak ditemukan.", 404);
  if (!canReadScopedItem(req, document)) return failure(res, "Anda tidak dapat mengubah dokumen ini.", 403);

  try {
    const result = addDocumentVersion(
      req.params.id,
      {
        ...(req.body || {}),
        file_name: req.file?.originalname || req.body?.file_name || null,
        file_path: req.file?.path || null,
        file_size: req.file?.size || 0,
        mime_type: req.file?.mimetype || null,
      },
      req.user
    );
    if (result?.duplicate) return failure(res, "File duplikat terdeteksi. Versi baru tidak dibuat.", 409);
    return success(res, result.document, "Versi dokumen berhasil ditambahkan.", 201);
  } catch (error) {
    return mutationFailure(res, error, "Versi dokumen gagal ditambahkan.");
  }
}

function ppeppCycles(req, res) {
  return success(res, scopedItems(req, getCatalogSnapshot().ppeppCycles), "Daftar siklus PPEPP");
}

function updatePpeppCycleRecord(req, res) {
  const cycle = state.ppeppCycles.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!cycle) return failure(res, "Siklus PPEPP tidak ditemukan.", 404);
  if (!canReadScopedItem(req, cycle)) return failure(res, "Anda tidak dapat mengubah data di luar scope unit kerja.", 403);

  Object.assign(cycle, {
    name: req.body?.name || req.body?.title || cycle.name,
    period: req.body?.period || cycle.period,
    year: req.body?.year || cycle.year,
    status: req.body?.status || cycle.status,
    org_unit_code: req.body?.org_unit_code || cycle.org_unit_code,
    updated_at: new Date().toISOString(),
  });

  return success(res, cycle, "Siklus PPEPP berhasil diperbarui di mode lokal.");
}

function deletePpeppCycleRecord(req, res) {
  const cycle = state.ppeppCycles.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!cycle) return failure(res, "Siklus PPEPP tidak ditemukan.", 404);
  if (!canReadScopedItem(req, cycle)) return failure(res, "Anda tidak dapat menghapus data di luar scope unit kerja.", 403);

  cycle.status = "deleted";
  cycle.deleted_at = new Date().toISOString();
  return success(res, cycle, "Siklus PPEPP berhasil dinonaktifkan di mode lokal.");
}

function createPpeppCycle(req, res) {
  const payload = prepareScopedPayload(req);
  if (!payload) return failure(res, "Anda tidak dapat membuat data di luar scope unit kerja.", 403);

  try {
    return res.status(201).json({
      success: true,
      data: addPpeppCycle(payload, req.user),
      message: "Siklus PPEPP berhasil dibuat di mode lokal.",
    });
  } catch (error) {
    return mutationFailure(res, error, "Siklus PPEPP gagal dibuat.");
  }
}

function updatePpeppCycleStage(req, res) {
  const cycle = state.ppeppCycles.find((item) => String(item.id) === String(req.params.id));
  if (!cycle) return failure(res, "Siklus PPEPP tidak ditemukan.", 404);
  if (!canReadScopedItem(req, cycle)) return failure(res, "Anda tidak dapat mengubah data di luar scope unit kerja.", 403);

  try {
    const updated = updatePpeppStage(req.params.id, req.params.stage, req.body || {}, req.user);
    if (!updated) return failure(res, "Tahap PPEPP tidak ditemukan.", 404);
    return success(res, updated, "Tahap PPEPP berhasil diperbarui.");
  } catch (error) {
    return mutationFailure(res, error, "Tahap PPEPP gagal diperbarui.");
  }
}

function uploadPpeppEvidence(req, res) {
  const cycle = state.ppeppCycles.find((item) => String(item.id) === String(req.params.id));
  if (!cycle) return failure(res, "Siklus PPEPP tidak ditemukan.", 404);
  if (!canReadScopedItem(req, cycle)) return failure(res, "Anda tidak dapat mengunggah bukti di luar scope unit kerja.", 403);

  try {
    const result = addPpeppEvidence(
      req.params.id,
      req.params.stage,
      {
        ...(req.body || {}),
        file_name: req.file?.originalname || req.body?.file_name || null,
        file_path: req.file?.path || null,
        file_size: req.file?.size || 0,
      },
      req.user
    );
    if (!result) return failure(res, "Tahap PPEPP tidak ditemukan.", 404);
    return success(res, result, "Bukti PPEPP berhasil diunggah.", 201);
  } catch (error) {
    return mutationFailure(res, error, "Bukti PPEPP gagal diunggah.");
  }
}

function amiAudits(req, res) {
  return success(res, scopedItems(req, state.audits, { allowAuditor: true }), "Daftar audit mutu internal");
}

function updateAmiAuditRecord(req, res) {
  const audit = state.audits.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!audit) return failure(res, "Audit tidak ditemukan.", 404);
  if (!canReadScopedItem(req, audit, { allowAuditor: true })) return failure(res, "Anda tidak dapat mengubah audit di luar scope.", 403);

  Object.assign(audit, {
    title: req.body?.title || req.body?.name || audit.title,
    scheduled_date: req.body?.scheduled_date || req.body?.audit_date || audit.scheduled_date,
    audit_date: req.body?.audit_date || audit.audit_date,
    status: req.body?.status || audit.status,
    org_unit_code: req.body?.org_unit_code || audit.org_unit_code,
    notes: req.body?.notes || audit.notes,
    updated_at: new Date().toISOString(),
  });

  return success(res, audit, "AMI audit berhasil diperbarui di mode lokal.");
}

function deleteAmiAuditRecord(req, res) {
  const audit = state.audits.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!audit) return failure(res, "Audit tidak ditemukan.", 404);
  if (!canReadScopedItem(req, audit, { allowAuditor: true })) return failure(res, "Anda tidak dapat menghapus audit di luar scope.", 403);

  audit.status = "deleted";
  audit.deleted_at = new Date().toISOString();
  return success(res, audit, "AMI audit berhasil dinonaktifkan di mode lokal.");
}

function createAmiAudit(req, res) {
  const payload = scopeItemForUser(req.body || {}, req.user);
  if (!canAccessOrgUnit(req.user, payload.org_unit_code, { allowAuditor: true })) {
    return failure(res, "Anda tidak dapat membuat audit di luar scope unit kerja.", 403);
  }

  try {
    return res.status(201).json({
      success: true,
      data: addAmiAudit(payload, req.user),
      message: "AMI audit berhasil dibuat di mode lokal.",
    });
  } catch (error) {
    return mutationFailure(res, error, "AMI audit gagal dibuat.");
  }
}

function createFinding(req, res) {
  const audit = state.audits.find((item) => String(item.id) === String(req.params.id));
  if (!audit) return failure(res, "Audit tidak ditemukan.", 404);
  if (!canReadScopedItem(req, audit, { allowAuditor: true })) return failure(res, "Anda tidak dapat mengubah audit di luar scope.", 403);

  try {
    return success(
      res,
      addFinding(req.params.id, { ...(req.body || {}), changed_by: req.user?.email || "system" }),
      "Temuan audit berhasil ditambahkan.",
      201
    );
  } catch (error) {
    return mutationFailure(res, error, "Temuan audit gagal ditambahkan.");
  }
}

function updateAmiAuditAssignment(req, res) {
  const audit = state.audits.find((item) => String(item.id) === String(req.params.id));
  if (!audit) return failure(res, "Audit tidak ditemukan.", 404);
  if (!canReadScopedItem(req, audit, { allowAuditor: true })) return failure(res, "Anda tidak dapat mengubah audit di luar scope.", 403);

  try {
    return success(res, updateAmiAssignment(req.params.id, req.body || {}, req.user), "Penugasan audit berhasil diperbarui.");
  } catch (error) {
    return mutationFailure(res, error, "Penugasan audit gagal diperbarui.");
  }
}

function updateAmiAuditInstrument(req, res) {
  const audit = state.audits.find((item) => String(item.id) === String(req.params.id));
  if (!audit) return failure(res, "Audit tidak ditemukan.", 404);
  if (!canReadScopedItem(req, audit, { allowAuditor: true })) return failure(res, "Anda tidak dapat mengubah audit di luar scope.", 403);

  try {
    const updated = updateAmiInstrument(req.params.id, req.params.instrumentId, req.body || {}, req.user);
    if (!updated) return failure(res, "Instrumen audit tidak ditemukan.", 404);
    return success(res, updated, "Instrumen audit berhasil diperbarui.");
  } catch (error) {
    return mutationFailure(res, error, "Instrumen audit gagal diperbarui.");
  }
}

function updateAmiFindingFollowUpRecord(req, res) {
  const audit = state.audits.find((item) => String(item.id) === String(req.params.id));
  if (!audit) return failure(res, "Audit tidak ditemukan.", 404);
  if (!canReadScopedItem(req, audit, { allowAuditor: true })) return failure(res, "Anda tidak dapat mengubah audit di luar scope.", 403);

  try {
    const updated = updateAmiFindingFollowUp(req.params.id, req.params.findingId, req.body || {}, req.user);
    if (!updated) return failure(res, "Temuan audit tidak ditemukan.", 404);
    return success(res, updated, "Tindak lanjut temuan berhasil diperbarui.");
  } catch (error) {
    return mutationFailure(res, error, "Tindak lanjut temuan gagal diperbarui.");
  }
}

function verifyAmiFindingRecord(req, res) {
  const audit = state.audits.find((item) => String(item.id) === String(req.params.id));
  if (!audit) return failure(res, "Audit tidak ditemukan.", 404);
  if (!canReadScopedItem(req, audit, { allowAuditor: true })) return failure(res, "Anda tidak dapat memverifikasi audit di luar scope.", 403);

  try {
    const updated = verifyAmiFinding(req.params.id, req.params.findingId, req.body || {}, req.user);
    if (!updated) return failure(res, "Temuan audit tidak ditemukan.", 404);
    return success(res, updated, "Perbaikan temuan berhasil diverifikasi.");
  } catch (error) {
    return mutationFailure(res, error, "Perbaikan temuan gagal diverifikasi.");
  }
}

function amiAuditSummary(req, res) {
  const audit = state.audits.find((item) => String(item.id) === String(req.params.id));
  if (!audit) return failure(res, "Audit tidak ditemukan.", 404);
  if (!canReadScopedItem(req, audit, { allowAuditor: true })) return failure(res, "Anda tidak dapat membaca audit di luar scope.", 403);

  return success(res, audit.recap, "Rekap hasil audit");
}

function amiAuditReport(req, res) {
  const audit = state.audits.find((item) => String(item.id) === String(req.params.id));
  if (!audit) return failure(res, "Audit tidak ditemukan.", 404);
  if (!canReadScopedItem(req, audit, { allowAuditor: true })) return failure(res, "Anda tidak dapat membaca audit di luar scope.", 403);

  const findings = audit.findings || [];
  const rows = findings.map((finding) => `
    <tr>
      <td>${escapeHtml(finding.title || "-")}</td>
      <td>${escapeHtml(finding.category || "-")}</td>
      <td>${escapeHtml(finding.follow_up?.status || "open")}</td>
      <td>${escapeHtml(finding.verification?.status || "unverified")}</td>
    </tr>
  `).join("");
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Laporan AMI - ${escapeHtml(audit.title || audit.org_unit?.name || "Audit")}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#0f172a;padding:32px;line-height:1.5}
    h1{margin:0 0 4px}
    .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
    .meta div{border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #e2e8f0;padding:8px;text-align:left}
    th{background:#f8fafc}
  </style>
</head>
<body>
  <h1>Laporan Audit Mutu Internal</h1>
  <p>Universitas Junrejo Indah</p>
  <section class="meta">
    <div><strong>Unit</strong><br>${escapeHtml(audit.org_unit?.name || "-")}</div>
    <div><strong>Auditor</strong><br>${escapeHtml(audit.auditor?.name || "-")}</div>
    <div><strong>Jadwal</strong><br>${escapeHtml(audit.scheduled_date || audit.audit_date || "-")}</div>
    <div><strong>Skor</strong><br>${escapeHtml(audit.recap?.score ?? audit.score ?? 0)}</div>
  </section>
  <h2>Rekap Temuan</h2>
  <p>Minor: ${audit.recap?.categories?.minor || 0}, Mayor: ${audit.recap?.categories?.mayor || 0}, Observasi: ${audit.recap?.categories?.observasi || 0}, Terverifikasi: ${audit.recap?.verified || 0}</p>
  <table>
    <thead><tr><th>Temuan</th><th>Kategori</th><th>Tindak Lanjut</th><th>Verifikasi</th></tr></thead>
    <tbody>${rows || "<tr><td colspan=\"4\">Tidak ada temuan.</td></tr>"}</tbody>
  </table>
  <script>window.print()</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="laporan-ami-${audit.id}.html"`);
  return res.send(html);
}

function rtmMeetings(req, res) {
  const meetings = state.meetings
    .filter((meeting) => !meeting.deleted_at && meeting.status !== "deleted")
    .map((meeting) => ({
      ...meeting,
      actions: scopedItems(req, meeting.actions || []),
    }))
    .filter((meeting) => canReadScopedItem(req, meeting) || meeting.actions.length > 0);

  return success(res, meetings, "Daftar rapat tinjauan manajemen");
}

function updateMeetingRecord(req, res) {
  const meeting = state.meetings.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!meeting) return failure(res, "Rapat RTM tidak ditemukan.", 404);
  if (!canReadScopedItem(req, meeting)) return failure(res, "Anda tidak dapat mengubah RTM di luar scope unit kerja.", 403);

  Object.assign(meeting, {
    title: req.body?.title || meeting.title,
    meeting_date: req.body?.meeting_date || meeting.meeting_date,
    status: req.body?.status || meeting.status,
    conclusion: req.body?.conclusion || meeting.conclusion,
    org_unit_code: req.body?.org_unit_code || meeting.org_unit_code,
    ppepp_cycle_id: req.body?.ppepp_cycle_id || meeting.ppepp_cycle_id,
    updated_at: new Date().toISOString(),
  });

  return success(res, meeting, "Rapat RTM berhasil diperbarui di mode lokal.");
}

function deleteMeetingRecord(req, res) {
  const meeting = state.meetings.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!meeting) return failure(res, "Rapat RTM tidak ditemukan.", 404);
  if (!canReadScopedItem(req, meeting)) return failure(res, "Anda tidak dapat menghapus RTM di luar scope unit kerja.", 403);

  meeting.status = "deleted";
  meeting.deleted_at = new Date().toISOString();
  return success(res, meeting, "Rapat RTM berhasil dinonaktifkan di mode lokal.");
}

function createMeeting(req, res) {
  const payload = prepareScopedPayload(req);
  if (!payload) return failure(res, "Anda tidak dapat membuat data di luar scope unit kerja.", 403);

  try {
    return res.status(201).json({
      success: true,
      data: addMeeting(payload, req.user),
      message: "Rapat RTM berhasil dibuat di mode lokal.",
    });
  } catch (error) {
    return mutationFailure(res, error, "Rapat RTM gagal dibuat.");
  }
}

function updateMeetingActionProgress(req, res) {
  const meeting = state.meetings.find((item) => String(item.id) === String(req.params.meetingId));
  const action = meeting?.actions?.find((item) => String(item.id) === String(req.params.actionId));
  if (!action) return failure(res, "Action RTL tidak ditemukan.", 404);
  if (!canAccessOrgUnit(req.user, action.org_unit_code)) {
    return failure(res, "Anda tidak dapat memperbarui RTL di luar scope unit kerja.", 403);
  }

  try {
    const updatedAction = updateMeetingAction(req.params.meetingId, req.params.actionId, req.body || {});
    if (!updatedAction) {
      return failure(res, "Action RTL tidak ditemukan.", 404);
    }

    return success(res, updatedAction, "Progres RTL berhasil diperbarui di mode lokal.");
  } catch (error) {
    return mutationFailure(res, error, "Progres RTL gagal diperbarui.");
  }
}

function indicators(req, res) {
  return success(res, scopedItems(req, state.indicators), "Daftar indikator mutu");
}

function updateIndicatorRecord(req, res) {
  const indicator = state.indicators.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!indicator) return failure(res, "Indikator tidak ditemukan.", 404);
  if (!canReadScopedItem(req, indicator)) return failure(res, "Anda tidak dapat mengubah indikator di luar scope unit kerja.", 403);

  Object.assign(indicator, {
    code: req.body?.code || indicator.code,
    name: req.body?.name || req.body?.title || indicator.name,
    target: req.body?.target ?? indicator.target,
    actual: req.body?.actual ?? indicator.actual,
    unit: req.body?.unit || indicator.unit,
    period: req.body?.period || indicator.period,
    status: req.body?.status || indicator.status,
    org_unit_code: req.body?.org_unit_code || indicator.org_unit_code,
    updated_at: new Date().toISOString(),
  });

  return success(res, indicator, "Indikator berhasil diperbarui di mode lokal.");
}

function deleteIndicatorRecord(req, res) {
  const indicator = state.indicators.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!indicator) return failure(res, "Indikator tidak ditemukan.", 404);
  if (!canReadScopedItem(req, indicator)) return failure(res, "Anda tidak dapat menghapus indikator di luar scope unit kerja.", 403);

  indicator.status = "deleted";
  indicator.deleted_at = new Date().toISOString();
  return success(res, indicator, "Indikator berhasil dinonaktifkan di mode lokal.");
}

function createIndicator(req, res) {
  const payload = prepareScopedPayload(req);
  if (!payload) return failure(res, "Anda tidak dapat membuat data di luar scope unit kerja.", 403);

  try {
    return res.status(201).json({
      success: true,
      data: addIndicator(payload, req.user),
      message: "Indikator berhasil dibuat di mode lokal.",
    });
  } catch (error) {
    return mutationFailure(res, error, "Indikator gagal dibuat.");
  }
}

function createIndicatorValue(req, res) {
  const indicator = state.indicators.find((item) => String(item.id) === String(req.params.id));
  if (!indicator) return failure(res, "Indikator tidak ditemukan.", 404);
  if (!canAccessOrgUnit(req.user, indicator.org_unit_code)) {
    return failure(res, "Anda tidak dapat mengisi capaian di luar scope unit kerja.", 403);
  }

  try {
    const value = addIndicatorValue(req.params.id, req.body || {});
    if (!value) {
      return failure(res, "Indikator tidak ditemukan.", 404);
    }

    return success(res, value, "Capaian indikator berhasil disimpan di mode lokal.", 201);
  } catch (error) {
    return mutationFailure(res, error, "Capaian indikator gagal disimpan.");
  }
}

function resolveGovernanceCollection(entity) {
  if (entity === "documents") return state.documents;
  if (entity === "ppepp") return state.ppeppCycles;
  if (entity === "indicators") return state.indicators;
  if (entity === "ami") return state.audits;
  if (entity === "rtl") return state.meetings.flatMap((meeting) => meeting.actions || []);
  return null;
}

async function updateApproval(req, res) {
  const collection = resolveGovernanceCollection(req.params.entity);
  if (!collection) return failure(res, "Entitas approval tidak dikenal.", 404);

  const item = collection.find((entry) => String(entry.id) === String(req.params.id));
  if (!item) return failure(res, "Data approval tidak ditemukan.", 404);
  if (!canAccessOrgUnit(req.user, item.org_unit_code, { allowAuditor: req.params.entity === "ami" })) {
    return failure(res, "Anda tidak dapat mengakses approval di luar scope unit kerja.", 403);
  }

  const previousApproval = item.approval ? { ...item.approval } : null;
  const previousStatus = item.status || null;
  const requestedAction = String(req.body?.action || "").toLowerCase();
  const nextApproval = transitionApproval(item, req.user, requestedAction, req.body?.note || "");
  if (!nextApproval) return failure(res, "Role Anda tidak berwenang menjalankan tahap approval ini.", 403);

  item.approval = nextApproval;
  item.status = nextApproval.status === "approved" ? "approved" : item.status;

  if (["approve", "reject", "submit"].includes(requestedAction)) {
    await recordAuditEvent({
      actor_id: req.user?.id || null,
      actor_email: req.user?.email || req.user?.username || "system",
      role: Array.isArray(req.user?.roles) ? req.user.roles.join(",") : req.user?.role || null,
      action: `approval.${requestedAction}`,
      entity: req.params.entity,
      entity_id: req.params.id,
      method: req.method,
      path: req.originalUrl,
      status_code: 200,
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
      before: {
        approval: previousApproval,
        status: previousStatus,
      },
      after: {
        approval: nextApproval,
        status: item.status || null,
      },
      metadata: {
        note: req.body?.note || "",
      },
    });
    await recordApprovalHistory({
      entity: req.params.entity,
      entity_id: req.params.id,
      step: previousApproval?.step || nextApproval.step,
      action: requestedAction,
      actor_id: req.user?.id || null,
      actor_email: req.user?.email || req.user?.username || "system",
      note: req.body?.note || "",
      metadata: {
        previous_status: previousStatus,
        next_status: item.status || null,
      },
    });
    res.locals.skipAuditTrail = true;
  }

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
  return success(res, getIntegrations(), "Daftar integrasi");
}

function integrationReadiness(_req, res) {
  return success(res, getIntegrationReadiness(), "Readiness integrasi sistem");
}

function integrationLogs(req, res) {
  return success(res, getIntegrationLogs(req.query?.service), "Log integrasi");
}

function integrationCheck(req, res) {
  const result = checkIntegration(req.params.key, req.user?.email || req.user?.username || "system");
  if (!result) return failure(res, "Connector integrasi tidak ditemukan.", 404);
  return success(res, result, "Readiness check integrasi selesai.");
}

function integrationSync(req, res) {
  const result = syncIntegration(req.params.key, req.user?.email || req.user?.username || "system");
  if (!result) return failure(res, "Connector integrasi tidak ditemukan.", 404);
  return success(res, result, "Sinkronisasi integrasi berhasil dijalankan.", 201);
}

async function auditTrail(req, res) {
  return success(res, await listAuditEvents(req.query || {}), "Audit trail aktivitas user");
}

function imports(_req, res) {
  return success(res, getCatalogSnapshot().imports.filter((item) => !item.deleted_at && item.status !== "deleted"), "Riwayat import");
}

function deleteImportRecord(req, res) {
  const item = state.imports.find((entry) => String(entry.id) === String(req.params.id) && !entry.deleted_at && entry.status !== "deleted");
  if (!item) return failure(res, "Import tidak ditemukan.", 404);

  item.status = "deleted";
  item.deleted_at = new Date().toISOString();
  return success(res, item, "Riwayat import berhasil dinonaktifkan di mode lokal.");
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
  try {
    return success(res, addHrisEmployee(req.body || {}), "Pegawai HRIS berhasil dibuat di mode lokal.", 201);
  } catch (error) {
    return mutationFailure(res, error, "Pegawai HRIS gagal dibuat.");
  }
}

function updateHrisEmployeeRecord(req, res) {
  try {
    const employee = updateHrisEmployee(req.params.id, req.body || {});
    if (!employee) {
      return failure(res, "Pegawai HRIS tidak ditemukan.", 404);
    }

    return success(res, employee, "Pegawai HRIS berhasil diperbarui di mode lokal.");
  } catch (error) {
    return mutationFailure(res, error, "Pegawai HRIS gagal diperbarui.");
  }
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
  try {
    return success(res, addHrisPosition(req.body || {}), "Jabatan HRIS berhasil dibuat di mode lokal.", 201);
  } catch (error) {
    return mutationFailure(res, error, "Jabatan HRIS gagal dibuat.");
  }
}

function updateHrisPositionRecord(req, res) {
  try {
    const position = updateHrisPosition(req.params.id, req.body || {});
    if (!position) {
      return failure(res, "Jabatan HRIS tidak ditemukan.", 404);
    }

    return success(res, position, "Jabatan HRIS berhasil diperbarui di mode lokal.");
  } catch (error) {
    return mutationFailure(res, error, "Jabatan HRIS gagal diperbarui.");
  }
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
  try {
    return success(res, addHrisCompetency(req.body || {}), "Kompetensi HRIS berhasil dibuat di mode lokal.", 201);
  } catch (error) {
    return mutationFailure(res, error, "Kompetensi HRIS gagal dibuat.");
  }
}

function updateHrisCompetencyRecord(req, res) {
  try {
    const competency = updateHrisCompetency(req.params.id, req.body || {});
    if (!competency) {
      return failure(res, "Kompetensi HRIS tidak ditemukan.", 404);
    }

    return success(res, competency, "Kompetensi HRIS berhasil diperbarui di mode lokal.");
  } catch (error) {
    return mutationFailure(res, error, "Kompetensi HRIS gagal diperbarui.");
  }
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
  try {
    return success(res, addHrisDocument(buildHrisDocumentPayload(req)), "Dokumen HRIS berhasil dibuat di mode lokal.", 201);
  } catch (error) {
    return mutationFailure(res, error, "Dokumen HRIS gagal dibuat.");
  }
}

function updateHrisDocumentRecord(req, res) {
  try {
    const document = updateHrisDocument(req.params.id, buildHrisDocumentPayload(req));
    if (!document) {
      return failure(res, "Dokumen HRIS tidak ditemukan.", 404);
    }

    return success(res, document, "Dokumen HRIS berhasil diperbarui di mode lokal.");
  } catch (error) {
    return mutationFailure(res, error, "Dokumen HRIS gagal diperbarui.");
  }
}

function deleteHrisDocumentRecord(req, res) {
  const document = deleteHrisDocument(req.params.id);
  if (!document) {
    return failure(res, "Dokumen HRIS tidak ditemukan.", 404);
  }

  return success(res, document, "Dokumen HRIS berhasil dihapus di mode lokal.");
}

function surveys(_req, res) {
  return success(res, getCatalogSnapshot().surveys.filter((item) => !item.deleted_at && item.status !== "deleted"), "Daftar survei");
}

function updateSurveyRecord(req, res) {
  const survey = state.surveys.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!survey) return failure(res, "Survei tidak ditemukan.", 404);

  Object.assign(survey, {
    title: req.body?.title || survey.title,
    target: req.body?.target || survey.target,
    status: req.body?.status || survey.status,
    ppepp_cycle_id: req.body?.ppepp_cycle_id || survey.ppepp_cycle_id,
    updated_at: new Date().toISOString(),
  });

  return success(res, survey, "Survei berhasil diperbarui di mode lokal.");
}

function deleteSurveyRecord(req, res) {
  const survey = state.surveys.find((item) => String(item.id) === String(req.params.id) && !item.deleted_at && item.status !== "deleted");
  if (!survey) return failure(res, "Survei tidak ditemukan.", 404);

  survey.status = "deleted";
  survey.deleted_at = new Date().toISOString();
  return success(res, survey, "Survei berhasil dinonaktifkan di mode lokal.");
}

function createSurvey(req, res) {
  try {
    return res.status(201).json({
      success: true,
      data: addSurvey(req.body || {}),
      message: "Survei berhasil dibuat di mode lokal.",
    });
  } catch (error) {
    return mutationFailure(res, error, "Survei gagal dibuat.");
  }
}

function createImport(req, res) {
  const fileName = req.file?.originalname || req.body?.file_name || "mock-import.xlsx";
  try {
    return res.status(201).json({
      success: true,
      data: addImport({ ...(req.body || {}), file_name: fileName }),
      message: "Import berhasil dibuat di mode lokal.",
    });
  } catch (error) {
    return mutationFailure(res, error, "Import gagal dibuat.");
  }
}

module.exports = {
  dashboardSummary,
  dashboardExport,
  performanceReport,
  dataSyncMap,
  catalog,
  standards,
  createStandard,
  standardRevisions,
  updateStandardRecord,
  deleteStandardRecord,
  documents,
  createDocument,
  updateDocumentRecord,
  deleteDocumentRecord,
  documentVersion,
  documentVersionDownload,
  documentVersionPreview,
  createDocumentVersion,
  ppeppCycles,
  createPpeppCycle,
  updatePpeppCycleRecord,
  deletePpeppCycleRecord,
  updatePpeppCycleStage,
  uploadPpeppEvidence,
  amiAudits,
  createAmiAudit,
  updateAmiAuditRecord,
  deleteAmiAuditRecord,
  createFinding,
  updateAmiAuditAssignment,
  updateAmiAuditInstrument,
  updateAmiFindingFollowUpRecord,
  verifyAmiFindingRecord,
  amiAuditSummary,
  amiAuditReport,
  rtmMeetings,
  createMeeting,
  updateMeetingRecord,
  deleteMeetingRecord,
  updateMeetingActionProgress,
  indicators,
  createIndicator,
  updateIndicatorRecord,
  deleteIndicatorRecord,
  createIndicatorValue,
  updateApproval,
  orgUnits,
  integrations,
  integrationReadiness,
  integrationLogs,
  integrationCheck,
  integrationSync,
  auditTrail,
  imports,
  deleteImportRecord,
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
  updateSurveyRecord,
  deleteSurveyRecord,
  createImport,
};
