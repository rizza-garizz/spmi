"use client";

import { useEffect, useState } from "react";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { useToast } from "@/components/support/Toast";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

interface RtmMeeting {
  id: number;
  title: string;
  meeting_date: string;
  status: string;
  conclusion: string | null;
  actions?: any[];
}

export function RtmPage() {
  const { showToast } = useToast();
  const roles = useCurrentRoles();
  const canManageMeetings = hasRoleAccess(["admin_lpm", "dekan", "wakil_dekan"], roles);
  const [meetings, setMeetings] = useState<RtmMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    ppepp_cycle_id: "3", // Default ke siklus yang baru kita buat
    title: "",
    meeting_date: "",
    conclusion: "",
  });

  const fetchMeetings = async () => {
    try {
      const res = await clientApiRequest("/rtm/meetings");
      const json = await res.json();
      setMeetings(parseApiPayload(json, []));
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await clientApiRequest("/rtm/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast("Rapat RTM berhasil dijadwalkan!");
        setFormData({ ...formData, title: "", meeting_date: "", conclusion: "" });
        setShowAddForm(false);
        fetchMeetings();
      }
    } catch {
      showToast("Gagal menyimpan data rapat.", "danger");
    }
  };

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Rapat Tinjauan Manajemen (RTM)</h4>
            <p className="mb-0">Fase Pengendalian PPEPP: Pengambilan keputusan strategis oleh Pimpinan.</p>
          </div>
        </div>
      </div>

      {canManageMeetings ? (
        <div className="hris-page-toolbar">
          <div>
            <span>Decision Log</span>
            <strong>Kelola Agenda RTM</strong>
            <p>Riwayat rapat tetap menjadi fokus utama. Jadwal baru dibuka saat pimpinan perlu membuat agenda.</p>
          </div>
          <div className="hris-toolbar-actions">
            <button
              className={showAddForm ? "btn btn-light" : "btn btn-primary"}
              onClick={() => setShowAddForm(!showAddForm)}
              type="button"
            >
              <i className="la la-plus me-1"></i> {showAddForm ? "Batal" : "Jadwalkan RTM Baru"}
            </button>
          </div>
        </div>
      ) : (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-outline-primary mb-0">
              Anda berada pada mode baca. Penjadwalan RTM hanya tersedia untuk admin/LPM, dekan, dan wakil dekan.
            </div>
          </div>
        </div>
      )}

      {showAddForm && canManageMeetings && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header"><h4 className="card-title">Inisialisasi Rapat</h4></div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Judul Rapat / Agenda</label>
                        <input type="text" className="form-control" placeholder="Misal: RTM Semester Ganjil 2024" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label>Tanggal Pelaksanaan</label>
                        <input type="date" className="form-control" value={formData.meeting_date} onChange={e => setFormData({...formData, meeting_date: e.target.value})} required />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label>Siklus PPEPP</label>
                        <select className="form-control" value={formData.ppepp_cycle_id} onChange={e => setFormData({...formData, ppepp_cycle_id: e.target.value})}>
                          <option value="3">Siklus 2024 (Aktif)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-3">Simpan Agenda</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="card-title">Riwayat & Status RTM</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-responsive-sm">
                  <thead className="thead-primary">
                    <tr>
                      <th>Agenda Rapat</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Kesimpulan / Keputusan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center">Memuat data...</td></tr>
                    ) : meetings.map(m => (
                      <tr key={m.id}>
                        <td><strong>{m.title}</strong></td>
                        <td>{m.meeting_date}</td>
                        <td>
                          <span className={`badge badge-${m.status === 'done' ? 'success' : 'warning'}`}>
                            {m.status.toUpperCase()}
                          </span>
                        </td>
                        <td>{m.conclusion || <span className="text-muted small">Belum ada kesimpulan</span>}</td>
                        <td>
                          <button className="btn btn-xs btn-info"><i className="la la-eye"></i> Detail RTL</button>
                        </td>
                      </tr>
                    ))}
                    {meetings.length === 0 && !loading && (
                      <tr><td colSpan={5} className="text-center">Belum ada agenda RTM yang tercatat.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
