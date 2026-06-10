"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/support/Toast";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";

interface Audit {
  id: number;
  audit_date: string;
  score: number;
  status: string;
  org_unit?: { name: string };
  findings?: any[];
}

export function AmiPage() {
  const { showToast } = useToast();
  const roles = useCurrentRoles();
  const canWriteAmi = hasRoleAccess(["super_admin", "lpm", "admin_lpm", "auditor"], roles);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Finding Form State
  const [findingData, setFindingData] = useState({
    description: "",
    severity: "observation",
    recommendation: "",
    root_cause: "",
  });

  const fetchAudits = async () => {
    try {
      const res = await clientApiRequest("/ami/audits");
      const json = await res.json();
      setAudits(parseApiPayload(json, []));
    } catch (err) {
      console.error("Gagal memuat audit", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAudit) return;

    try {
      const res = await clientApiRequest(`/ami/audits/${selectedAudit.id}/findings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(findingData),
      });

      if (res.ok) {
        showToast("Temuan berhasil ditambahkan!");
        setFindingData({ description: "", severity: "observation", recommendation: "", root_cause: "" });
        setSelectedAudit(null);
        fetchAudits();
      }
    } catch (err) {
      showToast("Terjadi kesalahan saat menyimpan temuan.", "danger");
    }
  };

  const filteredAudits = audits.filter((audit) => {
    const haystack = [
      audit.org_unit?.name,
      audit.audit_date,
      audit.status,
      String(audit.score || ""),
    ].join(" ").toLowerCase();
    return haystack.includes(searchTerm.toLowerCase()) && (!statusFilter || audit.status === statusFilter);
  });

  const totalPages = Math.max(1, Math.ceil(filteredAudits.length / pageSize));
  const paginatedAudits = filteredAudits.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleReport = async (audit: Audit) => {
    try {
      const response = await clientApiRequest(`/ami/audits/${audit.id}/report`);
      if (!response.ok) {
        showToast("Gagal membuat laporan AMI.", "danger");
        return;
      }
      const html = await response.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      showToast("Gagal membuka laporan AMI.", "danger");
    }
  };

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Audit Mutu Internal (AMI)</h4>
            <p className="mb-0">Evaluasi kepatuhan unit kerja terhadap Standar Mutu yang ditetapkan.</p>
          </div>
        </div>
      </div>

      <div className="row" id="jadwal-audit">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Daftar Audit Berjalan</h4>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-7 mb-2 mb-md-0">
                  <input
                    className="form-control"
                    placeholder="Cari unit, tanggal, status, atau skor..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-2 mb-md-0">
                  <select className="form-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="">Semua status</option>
                    <option value="terjadwal">Terjadwal</option>
                    <option value="berjalan">Berjalan</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-light w-100" type="button" onClick={() => { setSearchTerm(""); setStatusFilter(""); }}>
                    Reset
                  </button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-responsive-sm">
                  <thead>
                    <tr>
                      <th>Unit Kerja</th>
                      <th>Tanggal Audit</th>
                      <th>Skor</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center">Memuat...</td></tr>
                    ) : paginatedAudits.map((audit) => (
                      <tr key={audit.id}>
                        <td><strong>{audit.org_unit?.name || "Unit"}</strong></td>
                        <td>{audit.audit_date || "-"}</td>
                        <td>{audit.score || "0.0"}</td>
                        <td>
                          <span className={`badge badge-${audit.status === 'approved' ? 'success' : 'warning'}`}>
                            {audit.status}
                          </span>
                        </td>
                        <td>
                          {canWriteAmi ? (
                            <button
                              className="btn btn-xs btn-primary me-2"
                              onClick={() => setSelectedAudit(audit)}
                            >
                              + Tambah Temuan
                            </button>
                          ) : null}
                          <button className="btn btn-xs btn-outline-primary" type="button" onClick={() => handleReport(audit)}>
                            <i className="la la-file-text-o"></i> Laporan
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredAudits.length === 0 && !loading && (
                      <tr><td colSpan={5} className="text-center text-muted">Belum ada jadwal audit.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <small className="text-muted">
                  Menampilkan {paginatedAudits.length} dari {filteredAudits.length} audit
                </small>
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
        </div>
      </div>

      {selectedAudit && canWriteAmi && (
        <div className="row">
          <div className="col-xl-12">
            <div className="hris-page-toolbar">
              <div>
                <span>Audit Finding</span>
                <strong>Input Temuan: {selectedAudit.org_unit?.name}</strong>
                <p>Temuan audit dibuka dari audit yang dipilih, jadi operator tetap paham konteks datanya.</p>
              </div>
              <div className="hris-toolbar-actions">
                <button type="button" className="btn btn-light" onClick={() => setSelectedAudit(null)}>Tutup Form</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAudit && canWriteAmi && (
        <div className="card mt-4 border-primary" id="temuan">
          <div className="card-body">
            <form onSubmit={handleAddFinding}>
              <div className="row">
                <div className="col-md-8">
                  <div className="form-group mb-3">
                    <label className="form-label">Deskripsi Temuan</label>
                    <textarea 
                      className="form-control" rows={3} placeholder="Contoh: Belum ada bukti rapat kurikulum..."
                      value={findingData.description} onChange={(e) => setFindingData({...findingData, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Kategori (Severity)</label>
                    <select 
                      className="form-control"
                      value={findingData.severity} onChange={(e) => setFindingData({...findingData, severity: e.target.value})}
                    >
                      <option value="observation">OB (Observasi)</option>
                      <option value="minor">KTS Minor</option>
                      <option value="major">KTS Major</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Rekomendasi / Akar Masalah</label>
                <textarea 
                  className="form-control" rows={2} placeholder="Saran perbaikan..."
                  value={findingData.recommendation} onChange={(e) => setFindingData({...findingData, recommendation: e.target.value})}
                ></textarea>
              </div>
              <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-light me-2" onClick={() => setSelectedAudit(null)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Temuan</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div id="instrumen" aria-hidden="true"></div>
      <div id="laporan" aria-hidden="true"></div>
    </>
  );
}
