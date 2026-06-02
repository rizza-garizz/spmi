"use client";

import { useEffect, useMemo, useState } from "react";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";

interface OrgUnit {
  id: number;
  parent_id: number | null;
  code: string;
  siakad_code: string | null;
  name: string;
  type: string;
}

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
  const pageSize = 10;

  const unitById = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const rootUnits = useMemo(() => units.filter((unit) => unit.parent_id === null), [units]);
  const childrenByParent = useMemo(() => units.reduce<Map<number, OrgUnit[]>>((acc, unit) => {
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
      ["Kode Internal", "Kode SIAKAD", "Nama Unit", "Tipe", "Parent"],
      ...filteredUnits.map((unit) => [
        unit.code,
        unit.siakad_code || "",
        unit.name,
        unit.type,
        unit.parent_id ? unitById.get(unit.parent_id)?.code || "" : "",
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

  useEffect(() => {
    fetchUnits();
  }, []);

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
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center">Memuat...</td></tr>
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
                          {canEditUnits ? (
                            <button className="btn btn-xs btn-primary" type="button" onClick={() => setSelectedUnit(unit)}>
                              <i className="la la-eye"></i> Detail Mapping
                            </button>
                          ) : (
                            <span className="text-muted">Read only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUnits.length === 0 && !loading && (
                      <tr><td colSpan={5} className="text-center text-muted">Belum ada unit kerja terdaftar.</td></tr>
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
