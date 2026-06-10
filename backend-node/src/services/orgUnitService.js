const prisma = require("../lib/prisma");
const env = require("../config/env");
const { getCatalogSnapshot } = require("./catalogStore");
const { fetchOrgUnits: fetchSiakadOrgUnits } = require("./siakadConnector");

const DEFAULT_INSTITUTION_CODE = "DEFAULT";

function getCatalogOrgUnits() {
  const orgUnits = getCatalogSnapshot().orgUnits || [];
  const idByCode = new Map(orgUnits.map((item, index) => [item.code, String(index + 1)]));

  return orgUnits.map((item, index) => ({
    id: String(index + 1),
    parent_id: item.parent_code ? idByCode.get(item.parent_code) || null : null,
    parent_code: item.parent_code || null,
    code: item.code,
    siakad_code: item.siakad_code || null,
    name: item.name,
    type: item.type,
    source: item.source || "catalog",
    sync_status: item.sync_status || "synced",
    last_synced_at: item.last_synced_at || null,
    is_active: true,
    metadata: item.metadata || {},
  }));
}

function toApiOrgUnit(row) {
  return {
    id: row.id,
    parent_id: row.parentId || null,
    parent_code: row.parent?.code || null,
    code: row.code,
    siakad_code: row.siakadCode || null,
    name: row.name,
    type: row.type,
    source: row.source || "manual",
    sync_status: row.syncStatus || "manual",
    last_synced_at: row.lastSyncedAt || null,
    is_active: !row.deletedAt,
    metadata: row.metadata || {},
  };
}

function normalizeSourceUnit(item = {}) {
  return {
    code: String(item.code || item.kode || item.internal_code || "").trim().toUpperCase(),
    siakad_code: String(item.siakad_code || item.siakadCode || item.kode_siakad || item.kodeSIAKAD || item.code || "").trim(),
    name: String(item.name || item.nama || item.nama_unit || "").trim(),
    type: String(item.type || item.jenis || item.level || "unit").trim().toLowerCase(),
    parent_code: String(item.parent_code || item.parentCode || item.parent || "").trim().toUpperCase() || null,
    metadata: item.metadata || {},
  };
}

function summarizePreviewRows(rows, incomingCount) {
  return {
    incoming: incomingCount,
    create: rows.filter((item) => item.action === "create").length,
    update: rows.filter((item) => item.action === "update").length,
    deactivate: rows.filter((item) => item.action === "deactivate").length,
    skip: rows.filter((item) => item.action === "skip").length,
    conflict: rows.filter((item) => item.status === "conflict").length,
  };
}

function conflict(type, note) {
  return { status: "conflict", conflict_type: type, conflict_note: note };
}

function detectIncomingConflicts(item, context) {
  if (!item.code) return conflict("missing_code", "Kode unit dari SIAKAD kosong.");
  if (!item.name) return conflict("missing_name", "Nama unit dari SIAKAD kosong.");
  if (context.duplicateCodes.has(item.code)) return conflict("duplicate_code", `Kode ${item.code} muncul lebih dari satu kali di payload SIAKAD.`);
  if (item.siakad_code && context.duplicateSiakadCodes.has(item.siakad_code)) {
    return conflict("duplicate_siakad_code", `Kode SIAKAD ${item.siakad_code} muncul lebih dari satu kali.`);
  }
  if (item.parent_code && !context.incomingByCode.has(item.parent_code) && !context.currentByCode.has(item.parent_code)) {
    return conflict("missing_parent", `Parent ${item.parent_code} tidak ditemukan di SIAKAD maupun master SPMI.`);
  }

  const existing = context.currentByCode.get(item.code);
  if (existing?.source === "manual" && item.siakad_code && existing.siakad_code && existing.siakad_code !== item.siakad_code) {
    return conflict("manual_mapping_mismatch", `Unit manual ${item.code} sudah memiliki kode SIAKAD berbeda.`);
  }

  return { status: "ready", conflict_type: null, conflict_note: null };
}

async function persistPreviewBatch(preview, actorEmail) {
  if (env.appMode !== "database") return null;

  try {
    const batch = await prisma.siakadSyncBatch.create({
      data: {
        entity: "org_units",
        source: preview.source,
        status: preview.summary.conflict > 0 ? "conflict" : "preview",
        summary: preview.summary,
        conflictCount: preview.summary.conflict,
        createdByEmail: actorEmail || null,
        orgUnitRows: {
          create: preview.rows.map((row) => ({
            code: row.incoming?.code || row.current?.code || "-",
            siakadCode: row.incoming?.siakad_code || row.current?.siakad_code || null,
            name: row.incoming?.name || row.current?.name || "-",
            type: row.incoming?.type || row.current?.type || "unit",
            parentCode: row.incoming?.parent_code || row.current?.parent_code || null,
            action: row.action,
            status: row.status,
            conflictType: row.conflict_type || null,
            conflictNote: row.conflict_note || null,
            incoming: row.incoming || {},
            current: row.current || null,
          })),
        },
      },
      include: { orgUnitRows: true },
    });

    return {
      id: batch.id,
      status: batch.status,
      conflict_count: batch.conflictCount,
      created_at: batch.createdAt,
    };
  } catch {
    return null;
  }
}

function getMockSiakadUnits() {
  return getCatalogOrgUnits().map((item) => ({
    code: item.code,
    siakad_code: item.siakad_code || item.code,
    name: item.name,
    type: item.type,
    parent_code: item.parent_code,
    metadata: { source: "mock_siakad" },
  }));
}

async function getDefaultInstitutionId() {
  const institution = await prisma.institution.findFirst({
    where: { code: DEFAULT_INSTITUTION_CODE },
    orderBy: { createdAt: "asc" },
  });

  if (institution) return institution.id;

  const created = await prisma.institution.create({
    data: {
      code: DEFAULT_INSTITUTION_CODE,
      name: "Universitas Junrejo Indah",
      systemName: "SPMI Command Center",
      academicYear: "2026/2027",
      configuration: {
        locale: "id-ID",
        timezone: "Asia/Jakarta",
      },
    },
  });

  return created.id;
}

async function ensureCatalogOrgUnitsSeeded(institutionId) {
  const count = await prisma.orgUnit.count({
    where: { institutionId, deletedAt: null },
  });

  if (count > 0) return;

  const createdByCode = new Map();
  for (const item of getCatalogOrgUnits()) {
    const created = await prisma.orgUnit.create({
      data: {
        institutionId,
        code: item.code,
        siakadCode: item.siakad_code || item.code,
        name: item.name,
        type: item.type,
        source: item.source === "catalog" ? "manual" : item.source,
        syncStatus: item.sync_status || "synced",
        metadata: item.metadata || {},
      },
    });
    createdByCode.set(item.code, created);
  }

  for (const item of getCatalogOrgUnits()) {
    if (!item.parent_code) continue;
    const child = createdByCode.get(item.code);
    const parent = createdByCode.get(item.parent_code);
    if (child && parent) {
      await prisma.orgUnit.update({
        where: { id: child.id },
        data: { parentId: parent.id },
      });
    }
  }
}

async function listOrgUnits() {
  if (env.appMode !== "database") {
    return getCatalogOrgUnits();
  }

  try {
    const institutionId = await getDefaultInstitutionId();
    await ensureCatalogOrgUnitsSeeded(institutionId);

    const rows = await prisma.orgUnit.findMany({
      where: { institutionId, deletedAt: null },
      include: { parent: true },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });

    return rows.map(toApiOrgUnit);
  } catch {
    return getCatalogOrgUnits().map((item) => ({
      ...item,
      sync_status: "database_unavailable",
    }));
  }
}

function validateOrgUnitPayload(payload = {}, { partial = false } = {}) {
  const code = payload.code === undefined ? undefined : String(payload.code || "").trim().toUpperCase();
  const name = payload.name === undefined ? undefined : String(payload.name || "").trim();
  const type = payload.type === undefined ? undefined : String(payload.type || "").trim().toLowerCase();
  const siakadCode = payload.siakad_code ?? payload.siakadCode;
  const parentId = payload.parent_id ?? payload.parentId;

  if (!partial && !code) throw Object.assign(new Error("Kode unit wajib diisi."), { statusCode: 400 });
  if (!partial && !name) throw Object.assign(new Error("Nama unit wajib diisi."), { statusCode: 400 });
  if (!partial && !type) throw Object.assign(new Error("Tipe unit wajib diisi."), { statusCode: 400 });

  return {
    ...(code !== undefined ? { code } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(siakadCode !== undefined ? { siakadCode: String(siakadCode || "").trim() || null } : {}),
    ...(parentId !== undefined ? { parentId: parentId ? String(parentId) : null } : {}),
    source: payload.source ? String(payload.source).trim() : undefined,
    syncStatus: payload.sync_status || payload.syncStatus ? String(payload.sync_status || payload.syncStatus).trim() : undefined,
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : undefined,
  };
}

async function assertParent(institutionId, parentId, id) {
  if (!parentId) return null;
  if (id && String(parentId) === String(id)) {
    throw Object.assign(new Error("Unit tidak bisa menjadi parent dirinya sendiri."), { statusCode: 400 });
  }

  const parent = await prisma.orgUnit.findFirst({
    where: { id: parentId, institutionId, deletedAt: null },
  });
  if (!parent) throw Object.assign(new Error("Parent unit tidak ditemukan."), { statusCode: 400 });
  return parent.id;
}

async function createOrgUnit(payload = {}) {
  if (env.appMode !== "database") {
    throw Object.assign(new Error("CRUD struktur organisasi membutuhkan APP_MODE=database."), { statusCode: 409 });
  }

  const institutionId = await getDefaultInstitutionId();
  const data = validateOrgUnitPayload(payload);
  const parentId = await assertParent(institutionId, data.parentId);

  const row = await prisma.orgUnit.create({
    data: {
      institutionId,
      code: data.code,
      siakadCode: data.siakadCode || null,
      name: data.name,
      type: data.type,
      parentId,
      source: data.source || "manual",
      syncStatus: data.syncStatus || "manual",
      metadata: data.metadata || {},
    },
    include: { parent: true },
  });

  return toApiOrgUnit(row);
}

async function updateOrgUnit(id, payload = {}) {
  if (env.appMode !== "database") {
    throw Object.assign(new Error("CRUD struktur organisasi membutuhkan APP_MODE=database."), { statusCode: 409 });
  }

  const institutionId = await getDefaultInstitutionId();
  const existing = await prisma.orgUnit.findFirst({
    where: { id: String(id), institutionId, deletedAt: null },
    include: { parent: true },
  });
  if (!existing) throw Object.assign(new Error("Unit organisasi tidak ditemukan."), { statusCode: 404 });

  const data = validateOrgUnitPayload(payload, { partial: true });
  const parentId = data.parentId !== undefined ? await assertParent(institutionId, data.parentId, id) : undefined;

  const row = await prisma.orgUnit.update({
    where: { id: existing.id },
    data: {
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.siakadCode !== undefined ? { siakadCode: data.siakadCode } : {}),
      ...(parentId !== undefined ? { parentId } : {}),
      ...(data.source !== undefined ? { source: data.source } : {}),
      ...(data.syncStatus !== undefined ? { syncStatus: data.syncStatus } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
    },
    include: { parent: true },
  });

  return { before: toApiOrgUnit(existing), after: toApiOrgUnit(row) };
}

async function deleteOrgUnit(id) {
  if (env.appMode !== "database") {
    throw Object.assign(new Error("CRUD struktur organisasi membutuhkan APP_MODE=database."), { statusCode: 409 });
  }

  const institutionId = await getDefaultInstitutionId();
  const existing = await prisma.orgUnit.findFirst({
    where: { id: String(id), institutionId, deletedAt: null },
    include: { parent: true },
  });
  if (!existing) throw Object.assign(new Error("Unit organisasi tidak ditemukan."), { statusCode: 404 });

  const row = await prisma.orgUnit.update({
    where: { id: existing.id },
    data: { deletedAt: new Date(), syncStatus: "inactive" },
    include: { parent: true },
  });

  return { before: toApiOrgUnit(existing), after: toApiOrgUnit(row) };
}

async function resolveSiakadUnits(sourceUnits) {
  if (Array.isArray(sourceUnits)) {
    return { source: "request", reason: "payload", units: sourceUnits };
  }

  return fetchSiakadOrgUnits();
}

async function previewSiakadOrgUnits(sourceUnits, options = {}) {
  const source = await resolveSiakadUnits(sourceUnits);
  const incoming = source.units.map(normalizeSourceUnit);
  const current = await listOrgUnits();
  const currentByCode = new Map(current.map((item) => [item.code, item]));
  const incomingByCode = new Map(incoming.map((item) => [item.code, item]));
  const codeCounts = incoming.reduce((acc, item) => acc.set(item.code, (acc.get(item.code) || 0) + 1), new Map());
  const siakadCodeCounts = incoming.reduce((acc, item) => {
    if (!item.siakad_code) return acc;
    return acc.set(item.siakad_code, (acc.get(item.siakad_code) || 0) + 1);
  }, new Map());
  const context = {
    currentByCode,
    incomingByCode,
    duplicateCodes: new Set([...codeCounts.entries()].filter(([, count]) => count > 1).map(([code]) => code)),
    duplicateSiakadCodes: new Set([...siakadCodeCounts.entries()].filter(([, count]) => count > 1).map(([code]) => code)),
  };

  const rows = incoming.map((item) => {
    const detected = detectIncomingConflicts(item, context);
    const existing = currentByCode.get(item.code);
    if (!existing) return { action: "create", ...detected, incoming: item, current: null };
    const changed =
      existing.name !== item.name ||
      existing.type !== item.type ||
      (existing.siakad_code || "") !== (item.siakad_code || "") ||
      (existing.parent_code || "") !== (item.parent_code || "");
    return { action: changed ? "update" : "skip", ...detected, incoming: item, current: existing };
  });

  current.forEach((item) => {
    if (!incomingByCode.has(item.code) && item.source === "siakad") {
      rows.push({ action: "deactivate", status: "ready", incoming: null, current: item });
    }
  });

  const preview = {
    generated_at: new Date().toISOString(),
    source: source.source,
    source_reason: source.reason,
    summary: summarizePreviewRows(rows, incoming.length),
    rows,
  };

  const batch = await persistPreviewBatch(preview, options.actorEmail);
  return batch ? { ...preview, batch } : preview;
}

async function commitSiakadOrgUnits(sourceUnits) {
  if (env.appMode !== "database") {
    throw Object.assign(new Error("Commit sinkronisasi SIAKAD membutuhkan APP_MODE=database."), { statusCode: 409 });
  }

  const institutionId = await getDefaultInstitutionId();
  await ensureCatalogOrgUnitsSeeded(institutionId);
  const preview = await previewSiakadOrgUnits(sourceUnits);
  if (preview.summary.conflict > 0) {
    throw Object.assign(new Error("Sinkronisasi memiliki konflik. Selesaikan konflik sebelum commit."), { statusCode: 409, metadata: preview.summary });
  }
  const byCode = new Map((await prisma.orgUnit.findMany({ where: { institutionId } })).map((item) => [item.code, item]));
  const result = [];

  for (const row of preview.rows) {
    if (row.action === "skip" || row.status === "conflict") continue;
    if (row.action === "deactivate" && row.current) {
      const updated = await prisma.orgUnit.update({
        where: { id: row.current.id },
        data: { deletedAt: new Date(), syncStatus: "inactive", lastSyncedAt: new Date() },
        include: { parent: true },
      });
      result.push({ action: row.action, unit: toApiOrgUnit(updated) });
      continue;
    }

    const incoming = row.incoming;
    const parent = incoming.parent_code ? byCode.get(incoming.parent_code) : null;
    const data = {
      institutionId,
      code: incoming.code,
      siakadCode: incoming.siakad_code || incoming.code,
      name: incoming.name,
      type: incoming.type,
      parentId: parent?.id || null,
      source: "siakad",
      syncStatus: "synced",
      lastSyncedAt: new Date(),
      deletedAt: null,
      metadata: incoming.metadata || {},
    };

    const updated = await prisma.orgUnit.upsert({
      where: { institutionId_code: { institutionId, code: incoming.code } },
      update: data,
      create: data,
      include: { parent: true },
    });
    byCode.set(updated.code, updated);
    result.push({ action: row.action, unit: toApiOrgUnit(updated) });
  }

  if (preview.batch?.id) {
    await prisma.siakadSyncBatch.update({
      where: { id: preview.batch.id },
      data: {
        status: "committed",
        committedAt: new Date(),
      },
    }).catch(() => null);
  }

  return { batch: preview.batch || null, preview: preview.summary, applied: result };
}

async function listSiakadSyncBatches(limit = 10) {
  if (env.appMode !== "database") {
    return [];
  }

  try {
    const rows = await prisma.siakadSyncBatch.findMany({
      where: { service: "siakad", entity: "org_units" },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(Number(limit) || 10, 1), 50),
      include: {
        orgUnitRows: {
          where: { status: "conflict" },
          take: 5,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      source: row.source,
      status: row.status,
      summary: row.summary,
      conflict_count: row.conflictCount,
      created_by_email: row.createdByEmail,
      committed_at: row.committedAt,
      created_at: row.createdAt,
      conflicts: row.orgUnitRows.map((item) => ({
        id: item.id,
        code: item.code,
        action: item.action,
        conflict_type: item.conflictType,
        conflict_note: item.conflictNote,
      })),
    }));
  } catch {
    return [];
  }
}

module.exports = {
  listOrgUnits,
  createOrgUnit,
  updateOrgUnit,
  deleteOrgUnit,
  previewSiakadOrgUnits,
  commitSiakadOrgUnits,
  listSiakadSyncBatches,
};
