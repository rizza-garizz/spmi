"use client";

import { useEffect, useState } from "react";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { useToast } from "@/components/support/Toast";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";

interface RtmMeeting {
  id: number;
  title: string;
  meeting_date: string;
  status: string;
  conclusion: string | null;
  org_unit_code?: string | null;
  actions?: any[];
}

type CatalogCycle = { id: number | string; name: string; status?: string };
type CatalogOrgUnit = { code: string; name: string; type: string };

export function RtmPage() {
  const { showToast } = useToast();
  const roles = useCurrentRoles();
  const canManageMeetings = hasRoleAccess(["admin_lpm", "dekan", "wakil_dekan"], roles);
  const [meetings, setMeetings] = useState<RtmMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<RtmMeeting | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cycles, setCycles] = useState<CatalogCycle[]>([]);
  const [orgUnits, setOrgUnits] = useState<CatalogOrgUnit[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Form State
  const [formData, setFormData] = useState({
    ppepp_cycle_id: "",
    org_unit_code: "",
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

  const fetchCatalog = async () => {
    try {
      const res = await clientApiRequest("/catalog");
      const json = await res.json();
      const catalog = parseApiPayload(json, { ppeppCycles: [], orgUnits: [] });
      setCycles(Array.isArray(catalog.ppeppCycles) ? catalog.ppeppCycles : []);
      setOrgUnits(Array.isArray(catalog.orgUnits) ? catalog.orgUnits : []);
    } catch {
      setCycles([]);
      setOrgUnits([]);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchCatalog();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.meeting_date || !formData.ppepp_cycle_id || !formData.org_unit_code) {
      showToast("Agenda, tanggal, siklus PPEPP, dan unit wajib dipilih.", "danger");
      return;
    }

    const duplicate = meetings.some(
      (meeting) =>
        meeting.title.trim().toLowerCase() === formData.title.trim().toLowerCase() &&
        meeting.meeting_date === formData.meeting_date &&
        (meeting.org_unit_code || "") === formData.org_unit_code
    );
    if (duplicate) {
      showToast("Agenda RTM dengan tanggal dan unit yang sama sudah ada.", "warning");
      return;
    }

    try {
      const res = await clientApiRequest("/rtm/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast("Rapat RTM berhasil dijadwalkan!");
        setFormData({ ppepp_cycle_id: "", org_unit_code: "", title: "", meeting_date: "", conclusion: "" });
        setShowAddForm(false);
        fetchMeetings();
      }
    } catch {
      showToast("Gagal menyimpan data rapat.", "danger");
    }
  };

  const filteredMeetings = meetings.filter((meeting) => {
    const haystack = [meeting.title, meeting.meeting_date, meeting.status, meeting.conclusion].join(" ").toLowerCase();
    return haystack.includes(searchTerm.toLowerCase()) && (!statusFilter || meeting.status === statusFilter);
  });

  const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / pageSize));
  const paginatedMeetings = filteredMeetings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCsv = () => {
    const rows = [
      ["Agenda", "Tanggal", "Status", "Kesimpulan", "Jumlah RTL"],
      ...filteredMeetings.map((meeting) => [
        meeting.title,
        meeting.meeting_date,
        meeting.status,
        meeting.conclusion || "",
        String(meeting.actions?.length || 0),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "riwayat-rtm.csv";
    link.click();
    URL.revokeObjectURL(url);
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
            <button className="btn btn-outline-primary" type="button" onClick={exportCsv}>
              <i className="la la-file-excel-o me-1"></i> Export CSV
            </button>
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
                        <select className="form-control" value={formData.ppepp_cycle_id} onChange={e => setFormData({...formData, ppepp_cycle_id: e.target.value})} required>
                          <option value="">Pilih siklus</option>
                          {cycles.map((cycle) => (
                            <option key={cycle.id} value={cycle.id}>
                              {cycle.name} {cycle.status ? `(${cycle.status})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Unit Pembahas</label>
                        <select className="form-control" value={formData.org_unit_code} onChange={e => setFormData({...formData, org_unit_code: e.target.value})} required>
                          <option value="">Pilih unit</option>
                          {orgUnits.map((unit) => (
                            <option key={unit.code} value={unit.code}>{unit.name} · {unit.type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="form-group">
                        <label>Kesimpulan Awal / Fokus Keputusan</label>
                        <input type="text" className="form-control" placeholder="Arah keputusan atau fokus tindak lanjut" value={formData.conclusion} onChange={e => setFormData({...formData, conclusion: e.target.value})} />
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
              <div className="row mb-3">
                <div className="col-md-7 mb-2 mb-md-0">
                  <input
                    className="form-control"
                    placeholder="Cari agenda, tanggal, status, atau keputusan..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-2 mb-md-0">
                  <select className="form-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="">Semua status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="open">Open</option>
                    <option value="done">Done</option>
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
                    ) : paginatedMeetings.map(m => (
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
                          <button className="btn btn-xs btn-info" type="button" onClick={() => setSelectedMeeting(m)}>
                            <i className="la la-eye"></i> Detail RTL
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredMeetings.length === 0 && !loading && (
                      <tr><td colSpan={5} className="text-center">Belum ada agenda RTM yang tercatat.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <small className="text-muted">Menampilkan {paginatedMeetings.length} dari {filteredMeetings.length} RTM</small>
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

      {selectedMeeting ? (
        <div className="row">
          <div className="col-lg-12">
            <div className="card border-primary">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title mb-0">Detail RTL: {selectedMeeting.title}</h4>
                <button className="btn btn-light btn-sm" type="button" onClick={() => setSelectedMeeting(null)}>Tutup</button>
              </div>
              <div className="card-body">
                <p className="text-muted">{selectedMeeting.conclusion || "Belum ada kesimpulan rapat."}</p>
                <div className="table-responsive">
                  <table className="table table-bordered table-responsive-sm">
                    <thead>
                      <tr>
                        <th>Tindak Lanjut</th>
                        <th>PIC</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedMeeting.actions || []).map((action) => (
                        <tr key={action.id}>
                          <td>{action.action_item}</td>
                          <td>{action.unit?.name || "Rektorat"}</td>
                          <td>{action.due_date || "-"}</td>
                          <td><span className="badge badge-primary">{action.status || "open"}</span></td>
                          <td>{action.progress ?? 0}%</td>
                        </tr>
                      ))}
                      {(!selectedMeeting.actions || selectedMeeting.actions.length === 0) ? (
                        <tr><td colSpan={5} className="text-center text-muted">Belum ada RTL pada agenda ini.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
