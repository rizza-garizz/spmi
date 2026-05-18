"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/support/Toast";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

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
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  
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

      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Daftar Audit Berjalan</h4>
            </div>
            <div className="card-body">
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
                    ) : audits.map((audit) => (
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
                          <button
                            className="btn btn-xs btn-primary"
                            onClick={() => setSelectedAudit(audit)}
                          >
                            + Tambah Temuan
                          </button>
                        </td>
                      </tr>
                    ))}
                    {audits.length === 0 && !loading && (
                      <tr><td colSpan={5} className="text-center text-muted">Belum ada jadwal audit.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Temuan (Simple Version) */}
      {selectedAudit && (
        <div className="card mt-4 border-primary">
          <div className="card-header bg-primary">
            <h4 className="card-title text-white">Input Temuan: {selectedAudit.org_unit?.name}</h4>
          </div>
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
    </>
  );
}
