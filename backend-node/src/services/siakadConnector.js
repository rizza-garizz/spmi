const env = require("../config/env");
const { getCatalogSnapshot } = require("./catalogStore");

function normalizeOrgUnit(item = {}) {
  const code = String(item.code || item.kode || item.kode_unit || item.kodeUnit || item.internal_code || item.internalCode || item.unit_code || "").trim().toUpperCase();
  const siakadCode = String(item.siakad_code || item.siakadCode || item.kode_siakad || item.kodeSIAKAD || item.id_siakad || item.idSiakad || item.kode || item.code || "").trim();
  const name = String(item.name || item.nama || item.nama_unit || item.namaUnit || item.nama_prodi || item.nama_fakultas || item.label || "").trim();
  const type = String(item.type || item.jenis || item.level || item.tipe || item.unit_type || item.unitType || "unit").trim().toLowerCase();
  const parentCode = String(item.parent_code || item.parentCode || item.kode_parent || item.kodeParent || item.parent_unit_code || item.parentUnitCode || item.parent || "").trim().toUpperCase();
  const activeValue = item.is_active ?? item.active ?? item.aktif ?? item.status;

  return {
    code: code || siakadCode.toUpperCase(),
    siakad_code: siakadCode || code,
    name,
    type,
    parent_code: parentCode || null,
    is_active: activeValue === undefined ? true : !["0", "false", "nonaktif", "inactive", "deleted"].includes(String(activeValue).toLowerCase()),
    metadata: {
      raw: item,
    },
  };
}

function getMockOrgUnits() {
  return (getCatalogSnapshot().orgUnits || []).map((item) =>
    normalizeOrgUnit({
      code: item.code,
      siakad_code: item.siakad_code || item.code,
      name: item.name,
      type: item.type,
      parent_code: item.parent_code,
      status: "aktif",
    })
  );
}

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function buildHeaders() {
  const headers = {
    Accept: "application/json",
  };

  if (!env.siakad.apiToken) {
    return headers;
  }

  if (env.siakad.authType === "api-key") {
    headers[env.siakad.apiKeyHeader] = env.siakad.apiToken;
    return headers;
  }

  headers.Authorization = `Bearer ${env.siakad.apiToken}`;
  return headers;
}

function assertConnectorConfigured() {
  if (!env.siakad.enabled) {
    return { ok: false, reason: "SIAKAD_SYNC_ENABLED=false" };
  }
  if (!env.siakad.baseUrl) {
    return { ok: false, reason: "SIAKAD_BASE_URL belum diisi" };
  }
  return { ok: true, reason: "configured" };
}

async function fetchJson(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.siakad.timeoutMs);

  try {
    const response = await fetch(`${env.siakad.baseUrl}${path}`, {
      headers: buildHeaders(),
      signal: controller.signal,
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const error = new Error(payload?.message || `SIAKAD API gagal: ${response.status}`);
      error.statusCode = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkConnection() {
  const configured = assertConnectorConfigured();
  if (!configured.ok) {
    return {
      status: "mock",
      configured: false,
      message: configured.reason,
      base_url: env.siakad.baseUrl || null,
      org_units_path: env.siakad.orgUnitsPath,
      sample_count: getMockOrgUnits().length,
    };
  }

  try {
    const payload = await fetchJson(env.siakad.healthPath || env.siakad.orgUnitsPath);
    const rows = extractRows(payload);
    return {
      status: "online",
      configured: true,
      message: "Koneksi SIAKAD berhasil.",
      base_url: env.siakad.baseUrl,
      health_path: env.siakad.healthPath || null,
      org_units_path: env.siakad.orgUnitsPath,
      sample_count: rows.length,
    };
  } catch (error) {
    return {
      status: "failed",
      configured: true,
      message: error.message || "Koneksi SIAKAD gagal.",
      base_url: env.siakad.baseUrl,
      health_path: env.siakad.healthPath || null,
      org_units_path: env.siakad.orgUnitsPath,
      sample_count: 0,
    };
  }
}

async function fetchOrgUnits() {
  const configured = assertConnectorConfigured();
  if (!configured.ok) {
    return {
      source: "mock",
      reason: configured.reason,
      units: getMockOrgUnits(),
    };
  }

  const payload = await fetchJson(env.siakad.orgUnitsPath);
  return {
    source: "siakad",
    reason: "api",
    units: extractRows(payload).map(normalizeOrgUnit).filter((item) => item.code && item.name && item.is_active),
  };
}

module.exports = {
  checkConnection,
  fetchOrgUnits,
  normalizeOrgUnit,
  getMockOrgUnits,
};
