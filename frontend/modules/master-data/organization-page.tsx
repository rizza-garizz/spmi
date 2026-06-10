"use client";

import { useEffect, useMemo, useState } from "react";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";

interface OrgUnit {
  id: number | string;
  parent_id: number | string | null;
  parent_code?: string | null;
  code: string;
  siakad_code: string | null;
  name: string;
  type: string;
  source?: string;
  sync_status?: string;
  last_synced_at?: string | null;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

interface SyncPreview {
  generated_at: string;
  source?: string;
  source_reason?: string;
  batch?: {
    id: string;
    status: string;
    conflict_count: number;
    created_at: string;
  } | null;
  summary: {
    incoming: number;
    create: number;
    update: number;
    deactivate: number;
    skip: number;
    conflict?: number;
  };
  rows: Array<{
    action: string;
    status: string;
    conflict_type?: string | null;
    conflict_note?: string | null;
    incoming: Partial<OrgUnit> | null;
    current: OrgUnit | null;
  }>;
}

interface SiakadConnectionStatus {
  status: string;
  configured: boolean;
  message: string;
  base_url: string | null;
  org_units_path: string;
  sample_count: number;
}

interface SiakadSyncBatch {
  id: string;
  source: string;
  status: string;
  summary?: SyncPreview["summary"];
  conflict_count: number;
  created_by_email?: string | null;
  committed_at?: string | null;
  created_at: string;
  conflicts: Array<{
    id: string;
    code: string;
    action: string;
    conflict_type?: string | null;
    conflict_note?: string | null;
  }>;
}

const emptyForm = {
  id: "",
  code: "",
  siakad_code: "",
  name: "",
  type: "unit",
  parent_id: "",
  source: "manual",
};

export function OrganizationPage() {
  const roles = useCurrentRoles();
  const canEditUnits = hasRoleAccess(["super_admin", "admin_lpm"], roles);
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formState, setFormState] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [syncPreview, setSyncPreview] = useState<SyncPreview | null>(null);
  const [siakadStatus, setSiakadStatus] = useState<SiakadConnectionStatus | null>(null);
  const [syncBatches, setSyncBatches] = useState<SiakadSyncBatch[]>([]);
  const [syncing, setSyncing] = useState(false);
  const pageSize = 10;

  const unitById = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const rootUnits = useMemo(() => units.filter((unit) => unit.parent_id === null), [units]);
  const childrenByParent = useMemo(() => units.reduce<Map<number | string, OrgUnit[]>>((acc, unit) => {
    if (unit.parent_id !== null) {
      const siblings = acc.get(unit.parent_id) || [];
      siblings.push(unit);
      acc.set(unit.parent_id, siblings);
    }
    return acc;
  }, new Map()), [units]);

  const totals = useMemo(() => units.reduce(
    (acc, unit) => {
      acc.total += 1;
      if (unit.type === "fakultas") acc.faculties += 1;
      if (unit.type === "prodi") acc.programs += 1;
      return acc;
    },
    { total: 0, faculties: 0, programs: 0 }
  ), [units]);

  const getDepth = (unit: OrgUnit) => {
    let depth = 0;
    let current = unit.parent_id ? unitById.get(unit.parent_id) : undefined;

    while (current) {
      depth += 1;
      current = current.parent_id ? unitById.get(current.parent_id) : undefined;
    }

    return depth;
  };

  const flattenTree = (items: OrgUnit[]): OrgUnit[] =>
    items.flatMap((unit) => [unit, ...flattenTree(childrenByParent.get(unit.id) || [])]);

  const orderedUnits = useMemo(() => flattenTree(rootUnits), [rootUnits, childrenByParent]);
  const filteredUnits = useMemo(() => orderedUnits.filter((unit) => {
    const haystack = [unit.code, unit.siakad_code, unit.name, unit.type].join(" ").toLowerCase();
    return haystack.includes(searchTerm.toLowerCase()) && (!typeFilter || unit.type === typeFilter);
  }), [orderedUnits, searchTerm, typeFilter]);
  const unitTypes = useMemo(() => Array.from(new Set(units.map((unit) => unit.type))).sort(), [units]);
  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const paginatedUnits = useMemo(() => filteredUnits.slice((currentPage - 1) * pageSize, currentPage * pageSize), [currentPage, filteredUnits]);
  const scopeItems = useMemo(
    () => [
      {
        title: "Admin LPM",
        value: units.filter((unit) => ["lpm", "fakultas", "prodi"].includes(unit.type)).length,
        description: "Akses koordinasi dan validasi lintas unit mutu.",
      },
      {
        title: "Pimpinan Fakultas",
        value: units.filter((unit) => unit.type === "fakultas").length,
        description: "Akses monitoring unit fakultas dan program studi di bawahnya.",
      },
      {
        title: "Program Studi",
        value: units.filter((unit) => unit.type === "prodi").length,
        description: "Akses data operasional dan capaian pada scope prodi.",
      },
    ],
    [units]
  );

  const formatUnitType = (type: string) =>
    type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const exportCsv = () => {
    if (loading || filteredUnits.length === 0) return;

    const rows = [
      ["Kode Internal", "Kode SIAKAD", "Nama Unit", "Tipe", "Parent", "Sumber", "Status Sync"],
      ...filteredUnits.map((unit) => [
        unit.code,
        unit.siakad_code || "",
        unit.name,
        unit.type,
        unit.parent_id ? unitById.get(unit.parent_id)?.code || "" : "",
        unit.source || "manual",
        unit.sync_status || "manual",
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "struktur-organisasi.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const fetchUnits = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await clientApiRequest("/org-units");
      const json = await res.json();
      const nextUnits = parseApiPayload<OrgUnit[]>(json, []);

      if (!res.ok) {
        throw new Error(json?.message || "Gagal memuat struktur organisasi.");
      }

      setUnits(Array.isArray(nextUnits) ? nextUnits : []);
    } catch (error) {
      setUnits([]);
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat struktur organisasi.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUnit(null);
    setFormState(emptyForm);
  };

  const selectUnit = (unit: OrgUnit) => {
    setSelectedUnit(unit);
    setFormState({
      id: String(unit.id),
      code: unit.code,
      siakad_code: unit.siakad_code || "",
      name: unit.name,
      type: unit.type,
      parent_id: unit.parent_id ? String(unit.parent_id) : "",
      source: unit.source || "manual",
    });
  };

  const saveUnit = async () => {
    if (!canEditUnits || saving) return;
    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        code: formState.code,
        siakad_code: formState.siakad_code,
        name: formState.name,
        type: formState.type,
        parent_id: formState.parent_id || null,
        source: formState.source,
      };
      const res = await clientApiRequest(formState.id ? `/org-units/${formState.id}` : "/org-units", {
        method: formState.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Unit organisasi gagal disimpan.");
      }

      resetForm();
      await fetchUnits();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unit organisasi gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateUnit = async (unit: OrgUnit) => {
    if (!canEditUnits || saving) return;
    setSaving(true);
    setErrorMessage("");

    try {
      const res = await clientApiRequest(`/org-units/${unit.id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Unit organisasi gagal dinonaktifkan.");
      }

      resetForm();
      await fetchUnits();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unit organisasi gagal dinonaktifkan.");
    } finally {
      setSaving(false);
    }
  };

  const previewSiakadSync = async () => {
    if (!canEditUnits || syncing) return;
    setSyncing(true);
    setErrorMessage("");

    try {
      const res = await clientApiRequest("/integrations/siakad/org-units/preview", { method: "POST" });
      const json = await res.json();
      const payload = parseApiPayload<SyncPreview | null>(json, null);

      if (!res.ok || !payload) {
        throw new Error(json?.message || "Preview sinkronisasi SIAKAD gagal dibuat.");
      }

      setSyncPreview(payload);
      await loadSiakadBatches();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Preview sinkronisasi SIAKAD gagal dibuat.");
    } finally {
      setSyncing(false);
    }
  };

  const checkSiakadConnection = async () => {
    if (!canEditUnits || syncing) return;
    setSyncing(true);
    setErrorMessage("");

    try {
      const res = await clientApiRequest("/integrations/siakad/check");
      const json = await res.json();
      const payload = parseApiPayload<SiakadConnectionStatus | null>(json, null);

      if (!res.ok || !payload) {
        throw new Error(json?.message || "Cek koneksi SIAKAD gagal.");
      }

      setSiakadStatus(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Cek koneksi SIAKAD gagal.");
    } finally {
      setSyncing(false);
    }
  };

  const loadSiakadBatches = async () => {
    if (!canEditUnits) return;

    try {
      const res = await clientApiRequest("/integrations/siakad/org-units/batches?limit=5");
      const json = await res.json();
      const payload = parseApiPayload<SiakadSyncBatch[]>(json, []);

      if (res.ok) {
        setSyncBatches(Array.isArray(payload) ? payload : []);
      }
    } catch {
      setSyncBatches([]);
    }
  };

  const commitSiakadSync = async () => {
    if (!canEditUnits || syncing) return;
    setSyncing(true);
    setErrorMessage("");

    try {
      const res = await clientApiRequest("/integrations/siakad/org-units/commit", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Sinkronisasi SIAKAD gagal diterapkan.");
      }

      setSyncPreview(null);
      await fetchUnits();
      await loadSiakadBatches();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sinkronisasi SIAKAD gagal diterapkan.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (canEditUnits) {
      loadSiakadBatches();
    }
  }, [canEditUnits]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (loading || typeof window === "undefined") return;

    const targetId = window.location.hash.replace("#", "");
    if (!targetId) return;

    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [loading]);

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Daftar Unit Kerja & Prodi</h4>
            <p className="mb-0">Manajemen struktur organisasi universitas pendukung SPMI.</p>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-1">Total Unit</h5>
              <h2 className="mb-0">{totals.total}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-1">Fakultas</h5>
              <h2 className="mb-0">{totals.faculties}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-1">Program Studi</h5>
              <h2 className="mb-0">{totals.programs}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4">
          <div className="card" id="struktur-unit">
            <div className="card-header">
              <h4 className="card-title">Pohon Organisasi</h4>
            </div>
            <div className="card-body">
              {errorMessage ? (
                <div className="alert alert-warning" role="alert">
                  {errorMessage}
                  <div className="mt-2">
                    <button className="btn btn-sm btn-warning" type="button" onClick={fetchUnits}>
                      Muat Ulang
                    </button>
                  </div>
                </div>
              ) : null}
              {loading ? (
                <p className="mb-0">Memuat...</p>
              ) : orderedUnits.length === 0 ? (
                <p className="mb-0 text-muted">Belum ada struktur unit yang tersedia.</p>
              ) : (
                <div className="list-group">
                  {orderedUnits.map((unit) => {
                    const depth = getDepth(unit);
                    return (
                      <div key={`tree-${unit.id}`} className="list-group-item" style={{ paddingLeft: `${16 + depth * 20}px` }}>
                        <strong>{unit.code}</strong>
                        <div className="text-muted">{unit.name}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          {canEditUnits ? (
            <div className="card" id="mapping-siakad">
              <div className="card-header">
                <div>
                  <h4 className="card-title mb-1">{formState.id ? "Edit Unit Organisasi" : "Tambah Unit Organisasi"}</h4>
                  <p className="mb-0 text-muted">Master data organisasi siap disinkronkan dengan kode SIAKAD.</p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-outline-secondary btn-sm" type="button" onClick={checkSiakadConnection} disabled={syncing}>
                    <i className="la la-plug me-1"></i> Cek Koneksi
                  </button>
                  <button className="btn btn-outline-primary btn-sm" type="button" onClick={previewSiakadSync} disabled={syncing}>
                    <i className="la la-refresh me-1"></i> Preview Sync
                  </button>
                </div>
              </div>
              <div className="card-body">
                {siakadStatus ? (
                  <div className="alert alert-light border d-flex justify-content-between align-items-start flex-wrap gap-2" role="status">
                    <div>
                      <strong>Status SIAKAD: {siakadStatus.status}</strong>
                      <div className="text-muted small">{siakadStatus.message}</div>
                    </div>
                    <span className="badge badge-light">{siakadStatus.sample_count} sample</span>
                  </div>
                ) : null}
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Kode Internal</label>
                    <input className="form-control" value={formState.code} onChange={(event) => setFormState((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Kode SIAKAD</label>
                    <input className="form-control" value={formState.siakad_code} onChange={(event) => setFormState((current) => ({ ...current, siakad_code: event.target.value }))} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nama Unit</label>
                    <input className="form-control" value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Tipe</label>
                    <select className="form-control" value={formState.type} onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value }))}>
                      {["universitas", "lpm", "lembaga", "fakultas", "prodi", "unit"].map((type) => (
                        <option value={type} key={type}>{formatUnitType(type)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Parent Unit</label>
                    <select className="form-control" value={formState.parent_id} onChange={(event) => setFormState((current) => ({ ...current, parent_id: event.target.value }))}>
                      <option value="">Tanpa parent</option>
                      {units.filter((unit) => String(unit.id) !== formState.id).map((unit) => (
                        <option value={String(unit.id)} key={unit.id}>{unit.code} - {unit.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Sumber</label>
                    <select className="form-control" value={formState.source} onChange={(event) => setFormState((current) => ({ ...current, source: event.target.value }))}>
                      <option value="manual">Manual SPMI</option>
                      <option value="siakad">SIAKAD</option>
                    </select>
                  </div>
                  <div className="col-md-2 mb-3 d-flex align-items-end gap-2">
                    <button className="btn btn-primary" type="button" onClick={saveUnit} disabled={saving}>
                      {saving ? "Menyimpan..." : "Simpan"}
                    </button>
                    <button className="btn btn-light" type="button" onClick={resetForm} disabled={saving}>
                      Reset
                    </button>
                  </div>
                </div>

                {syncPreview ? (
                  <div className="border rounded p-3 mt-2">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                      <div>
                        <h5 className="mb-1">Preview Sinkronisasi SIAKAD</h5>
                        <p className="mb-0 text-muted">
                          {syncPreview.summary.create} baru, {syncPreview.summary.update} berubah, {syncPreview.summary.deactivate} nonaktif, {syncPreview.summary.skip} sama, {syncPreview.summary.conflict || 0} konflik.
                        </p>
                        {syncPreview.batch ? (
                          <p className="mb-0 text-muted small">Batch: {syncPreview.batch.id} · {syncPreview.source || "unknown"}</p>
                        ) : null}
                      </div>
                      <button className="btn btn-success btn-sm" type="button" onClick={commitSiakadSync} disabled={syncing || Boolean(syncPreview.summary.conflict)}>
                        Terapkan Sync
                      </button>
                    </div>
                    <div className="table-responsive mt-3">
                      <table className="table table-sm table-bordered mb-0">
                        <thead>
                          <tr>
                            <th>Aksi</th>
                            <th>Kode</th>
                            <th>Nama dari SIAKAD</th>
                            <th>Data Saat Ini</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {syncPreview.rows.slice(0, 8).map((row, index) => (
                            <tr key={`${row.action}-${index}`}>
                              <td><span className="badge badge-light">{row.action}</span></td>
                              <td>{row.incoming?.code || row.current?.code || "-"}</td>
                              <td>{row.incoming?.name || "-"}</td>
                              <td>{row.current?.name || "-"}</td>
                              <td>
                                <span className={`badge badge-${row.status === "conflict" ? "danger" : "success"}`}>{row.status}</span>
                                {row.conflict_note ? <div className="small text-muted">{row.conflict_note}</div> : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {syncBatches.length > 0 ? (
                  <div className="border rounded p-3 mt-3">
                    <h5 className="mb-2">Riwayat Batch SIAKAD</h5>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered mb-0">
                        <thead>
                          <tr>
                            <th>Waktu</th>
                            <th>Status</th>
                            <th>Ringkasan</th>
                            <th>Konflik</th>
                          </tr>
                        </thead>
                        <tbody>
                          {syncBatches.map((batch) => (
                            <tr key={batch.id}>
                              <td>{new Date(batch.created_at).toLocaleString("id-ID")}</td>
                              <td><span className="badge badge-light">{batch.status}</span></td>
                              <td>
                                {(batch.summary?.create || 0)} baru, {(batch.summary?.update || 0)} berubah, {(batch.summary?.skip || 0)} sama
                              </td>
                              <td>
                                {batch.conflict_count}
                                {batch.conflicts[0]?.conflict_note ? <div className="small text-muted">{batch.conflicts[0].conflict_note}</div> : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="card" id="export-organisasi">
            <div className="card-header">
              <div>
                <h4 className="card-title mb-1">Struktur Organisasi Aktif</h4>
                <p className="mb-0 text-muted">Master unit mengikuti sinkronisasi SIAKAD agar struktur tetap konsisten.</p>
              </div>
              <button className="btn btn-outline-primary btn-sm" type="button" onClick={exportCsv} disabled={loading || filteredUnits.length === 0}>
                <i className="la la-file-excel-o me-1"></i> Export CSV
              </button>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-7 mb-2 mb-md-0">
                  <input
                    className="form-control"
                    placeholder="Cari kode, nama unit, tipe, atau kode SIAKAD..."
                    value={searchTerm}
                    onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }}
                  />
                </div>
                <div className="col-md-3 mb-2 mb-md-0">
                  <select className="form-control" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setCurrentPage(1); }}>
                    <option value="">Semua tipe</option>
                    {unitTypes.map((type) => (
                      <option value={type} key={type}>{formatUnitType(type)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-light w-100" type="button" onClick={() => { setSearchTerm(""); setTypeFilter(""); setCurrentPage(1); }}>
                    Reset
                  </button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-responsive-sm">
                  <thead className="thead-primary">
                    <tr>
                      <th>Kode Internal</th>
                      <th>Kode SIAKAD</th>
                      <th>Nama Unit / Program Studi</th>
                      <th>Level/Tipe</th>
                      <th>Sync</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center">Memuat...</td></tr>
                    ) : paginatedUnits.map((unit) => (
                      <tr key={unit.id}>
                        <td><strong>{unit.code}</strong></td>
                        <td><span className="badge badge-light">{unit.siakad_code || "-"}</span></td>
                        <td style={{ paddingLeft: `${12 + getDepth(unit) * 20}px` }}>{unit.name}</td>
                        <td>
                          <span className={`badge badge-${unit.type === 'prodi' ? 'info' : 'primary'}`}>
                            {formatUnitType(unit.type)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${unit.source === "siakad" ? "success" : "light"}`}>
                            {unit.source || "manual"}
                          </span>
                          <div className="small text-muted">{unit.sync_status || "manual"}</div>
                        </td>
                        <td>
                          {canEditUnits ? (
                            <div className="d-flex gap-1 flex-wrap">
                              <button className="btn btn-xs btn-primary" type="button" onClick={() => selectUnit(unit)}>
                                <i className="la la-edit"></i> Edit
                              </button>
                              <button className="btn btn-xs btn-outline-danger" type="button" onClick={() => deactivateUnit(unit)} disabled={saving}>
                                Nonaktif
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">Read only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUnits.length === 0 && !loading && (
                      <tr><td colSpan={6} className="text-center text-muted">Belum ada unit kerja terdaftar.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <small className="text-muted">Menampilkan {paginatedUnits.length} dari {filteredUnits.length} unit</small>
                <div>
                  <button className="btn btn-sm btn-light me-2" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                    Sebelumnya
                  </button>
                  <span className="text-muted small">Halaman {currentPage} / {totalPages}</span>
                  <button className="btn btn-sm btn-light ms-2" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                    Berikutnya
                  </button>
                </div>
              </div>
            </div>
          </div>
          {selectedUnit ? (
            <div className="card border-primary">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title mb-0">Detail Mapping Unit</h4>
                <button className="btn btn-light btn-sm" type="button" onClick={() => setSelectedUnit(null)}>Tutup</button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1 text-muted">Nama Unit</p>
                    <h5>{selectedUnit.name}</h5>
                  </div>
                  <div className="col-md-3">
                    <p className="mb-1 text-muted">Kode Internal</p>
                    <h5>{selectedUnit.code}</h5>
                  </div>
                  <div className="col-md-3">
                    <p className="mb-1 text-muted">Kode SIAKAD</p>
                    <h5>{selectedUnit.siakad_code || "-"}</h5>
                  </div>
                </div>
                <p className="mb-0 text-muted">
                  Perubahan master unit dilakukan dari sumber utama SIAKAD/IAM. Halaman ini mengunci struktur agar data mutu, audit, dan dashboard tidak berbeda antar sistem.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="row" id="scope-data">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <div>
                <h4 className="card-title mb-1">Scope Data Organisasi</h4>
                <p className="mb-0 text-muted">Ringkasan cakupan akses berdasarkan tipe unit yang tersedia.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                {scopeItems.map((item) => (
                  <div className="col-md-4 mb-3 mb-md-0" key={item.title}>
                    <div className="border rounded p-3 h-100">
                      <p className="mb-1 text-muted">{item.title}</p>
                      <h4 className="mb-2">{item.value}</h4>
                      <p className="mb-0 text-muted">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mb-0 mt-3 text-muted">
                Scope detail mengikuti role login dan pemetaan unit dari API <code>/org-units</code>. Perubahan hak akses tetap dikendalikan oleh modul administrasi role.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
