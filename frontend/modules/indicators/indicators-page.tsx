"use client";

import { useEffect, useState } from "react";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

interface Indicator {
  id: number;
  code: string;
  name: string;
  description: string | null;
  target_value: number;
  unit: string;
  source_type: string;
  standard: { id: number; code: string; title: string } | null;
  latest_value: {
    actual_value: number;
    period: string;
    status: string;
    notes: string | null;
  } | null;
  history: Array<{
    actual_value: number;
    period: string;
    status: string;
    created_at: string;
  }>;
}

export function IndicatorsPage() {
  const roles = useCurrentRoles();
  const canEditIndicators = hasRoleAccess(["admin_lpm", "kaprodi", "sekprodi", "unit_kerja"], roles);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showValueForm, setShowValueForm] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Form state - Tambah Indikator
  const [newIndicator, setNewIndicator] = useState({
    mutu_standard_id: "",
    code: "",
    name: "",
    description: "",
    target_value: "",
    unit: "%",
    source_type: "manual",
  });

  // Form state - Input Capaian
  const [newValue, setNewValue] = useState({
    period: "",
    actual_value: "",
    notes: "",
  });

  const fetchIndicators = async () => {
    try {
      const res = await clientApiRequest("/indicators");
      const json = await res.json();
      setIndicators(parseApiPayload(json, []));
    } catch {
      setIndicators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicators();
  }, []);

  const handleAddIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await clientApiRequest("/indicators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newIndicator,
          target_value: parseFloat(newIndicator.target_value),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Indikator berhasil ditambahkan!" });
        setShowAddForm(false);
        setNewIndicator({ mutu_standard_id: "", code: "", name: "", description: "", target_value: "", unit: "%", source_type: "manual" });
        fetchIndicators();
      } else {
        setMessage({ type: "danger", text: json.message || "Gagal menambahkan indikator" });
      }
    } catch {
      setMessage({ type: "danger", text: "Koneksi ke server gagal" });
    }
  };

  const handleAddValue = async (e: React.FormEvent, indicatorId: number) => {
    e.preventDefault();
    try {
      const res = await clientApiRequest(`/indicators/${indicatorId}/values`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newValue,
          actual_value: parseFloat(newValue.actual_value),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Capaian berhasil disimpan!" });
        setShowValueForm(null);
        setNewValue({ period: "", actual_value: "", notes: "" });
        fetchIndicators();
      } else {
        setMessage({ type: "danger", text: json.message || "Gagal menyimpan capaian" });
      }
    } catch {
      setMessage({ type: "danger", text: "Koneksi ke server gagal" });
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        small { font-size: 14px !important; }
      `}} />
      {/* Breadcrumb */}
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Kelola Indikator Mutu (IKU/IKT)</h4>
            <p className="mb-0">Tambah, edit, dan input capaian indikator kinerja.</p>
          </div>
        </div>
        <div className="col-sm-6 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item active"><a href="/indicators">Indikator</a></li>
          </ol>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="close" onClick={() => setMessage(null)}>
            <span>&times;</span>
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="row mb-3">
        <div className="col-12">
          {canEditIndicators ? (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <i className="la la-plus me-1"></i>
              {showAddForm ? "Tutup Form" : "Tambah Indikator Baru"}
            </button>
          ) : (
            <div className="alert alert-outline-primary mb-0">
              Role Anda berada pada mode baca. Penambahan indikator dan input capaian hanya tersedia untuk admin/LPM atau unit kerja.
            </div>
          )}
        </div>
      </div>

      {/* Form Tambah Indikator */}
      {showAddForm && canEditIndicators && (
        <div className="row mb-4">
          <div className="col-xl-12">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Tambah Indikator Baru</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleAddIndicator}>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="form-group">
                        <label>Kode IKU</label>
                        <input type="text" className="form-control" placeholder="Misal: IKU-2.1" value={newIndicator.code} onChange={(e) => setNewIndicator({ ...newIndicator, code: e.target.value })} required />
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="form-group">
                        <label>Nama Indikator</label>
                        <input type="text" className="form-control" placeholder="Misal: Rasio Dosen-Mahasiswa" value={newIndicator.name} onChange={(e) => setNewIndicator({ ...newIndicator, name: e.target.value })} required />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="form-group">
                        <label>Target</label>
                        <input type="number" step="0.01" className="form-control" placeholder="80" value={newIndicator.target_value} onChange={(e) => setNewIndicator({ ...newIndicator, target_value: e.target.value })} required />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="form-group">
                        <label>Satuan</label>
                        <select className="form-control" value={newIndicator.unit} onChange={(e) => setNewIndicator({ ...newIndicator, unit: e.target.value })}>
                          <option value="%">%</option>
                          <option value="IPK">IPK</option>
                          <option value="Orang">Orang</option>
                          <option value="Ratio">Ratio</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="form-group">
                        <label>Kriteria Akreditasi</label>
                        <select className="form-control">
                          <option value="k1">K1: Visi Misi</option>
                          <option value="k2">K2: Tata Pamong</option>
                          <option value="k3">K3: Mahasiswa</option>
                          <option value="k4">K4: SDM</option>
                          <option value="k5">K5: Keuangan/Sarpras</option>
                          <option value="k6">K6: Pendidikan</option>
                          <option value="k7">K7: Penelitian</option>
                          <option value="k8">K8: PkM</option>
                          <option value="k9">K9: Luaran/Capaian</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label>Sumber Data</label>
                        <select className="form-control" value={newIndicator.source_type} onChange={(e) => setNewIndicator({ ...newIndicator, source_type: e.target.value })}>
                          <option value="manual">Manual</option>
                          <option value="api_siakad">API SIAKAD</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Deskripsi</label>
                        <input type="text" className="form-control" placeholder="Penjelasan singkat" value={newIndicator.description} onChange={(e) => setNewIndicator({ ...newIndicator, description: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-2">
                    <i className="la la-save me-1"></i> Simpan Indikator
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Daftar Indikator */}
      <div className="row">
        <div className="col-xl-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Daftar Indikator Kinerja Utama (IKU/IKT)</h4>
            </div>
            <div className="card-body">
              {loading ? (
                <p>Memuat data...</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-responsive-lg">
                    <thead>
                      <tr>
                        <th>Kode</th>
                        <th>Indikator</th>
                        <th>Standar</th>
                        <th>Target</th>
                        <th>Capaian Terakhir</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indicators.map((item) => {
                        const actual = item.latest_value?.actual_value ?? 0;
                        const pct = Math.min((actual / item.target_value) * 100, 100);
                        const color = pct >= 100 ? "success" : pct > 50 ? "warning" : "danger";
                        return (
                          <tr key={item.id}>
                            <td><strong>{item.code}</strong></td>
                            <td>
                              {item.name}
                              <br /><small className="text-muted">{item.description}</small>
                            </td>
                            <td><small>{item.standard?.code}</small></td>
                            <td>{item.target_value} {item.unit}</td>
                            <td>
                              {item.latest_value ? (
                                <>
                                  <strong>{item.latest_value.actual_value}</strong> {item.unit}
                                  <br /><small className="text-muted">Periode: {item.latest_value.period}</small>
                                </>
                              ) : (
                                <span className="text-muted">Belum ada</span>
                              )}
                            </td>
                            <td style={{ minWidth: "120px" }}>
                              <div className="progress" style={{ height: "8px" }}>
                                <div className={`progress-bar bg-${color}`} style={{ width: `${pct}%` }}></div>
                              </div>
                              <small>{pct.toFixed(0)}%</small>
                            </td>
                            <td>
                              <span className={`badge badge-${color}`}>
                                {item.latest_value?.status || "No Data"}
                              </span>
                            </td>
                            <td>
                              {canEditIndicators ? (
                                <button
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => {
                                    setShowValueForm(showValueForm === item.id ? null : item.id);
                                    setNewValue({ period: "", actual_value: "", notes: "" });
                                  }}
                                >
                                  <i className="la la-plus-circle"></i> Input
                                </button>
                              ) : (
                                <span className="text-muted small">Read only</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {indicators.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center">Belum ada indikator terdaftar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Input Capaian (muncul di bawah tabel saat tombol "Input" diklik) */}
      {showValueForm !== null && canEditIndicators && (
        <div className="row">
          <div className="col-xl-8">
            <div className="card border-primary">
              <div className="card-header bg-primary">
                <h4 className="card-title text-white">
                  Input Capaian: {indicators.find((i) => i.id === showValueForm)?.name}
                </h4>
              </div>
              <div className="card-body">
                <form onSubmit={(e) => handleAddValue(e, showValueForm)}>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="form-group">
                        <label>Periode</label>
                        <input type="text" className="form-control" placeholder="Misal: 2024-1" value={newValue.period} onChange={(e) => setNewValue({ ...newValue, period: e.target.value })} required />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label>Nilai Capaian</label>
                        <input type="number" step="0.01" className="form-control" placeholder="Misal: 3.5" value={newValue.actual_value} onChange={(e) => setNewValue({ ...newValue, actual_value: e.target.value })} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="text-danger">Analisis Akar Masalah / Kendala (Wajib Jika Tidak Tercapai)</label>
                        <textarea className="form-control" rows={2} placeholder="Jelaskan mengapa target tidak tercapai dan apa rencana perbaikannya..." value={newValue.notes} onChange={(e) => setNewValue({ ...newValue, notes: e.target.value })}></textarea>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-2 me-2">
                    <i className="la la-save me-1"></i> Simpan Capaian
                  </button>
                  <button type="button" className="btn btn-light mt-2" onClick={() => setShowValueForm(null)}>
                    Batal
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
