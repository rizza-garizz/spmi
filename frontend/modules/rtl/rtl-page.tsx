"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/support/Toast";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";

interface RtmAction {
  id: number;
  action_item: string;
  due_date: string;
  status: string;
  progress?: number;
  owner_notes: string | null;
  updated_at?: string;
  meeting: { title: string };
  meeting_id?: number;
  unit?: { name: string };
}

export function RtlPage() {
  const { showToast } = useToast();
  const roles = useCurrentRoles();
  const [actions, setActions] = useState<RtmAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingActionId, setSavingActionId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, { status: string; progress: number; owner_notes: string }>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const canUpdateActions = hasRoleAccess(["super_admin", "lpm", "admin_lpm", "kaprodi", "sekprodi", "unit_kerja", "operator"], roles);

  const fetchActions = async () => {
    try {
      const res = await clientApiRequest("/rtm/meetings");
      const json = await res.json();
      // Untuk demo, kita ambil semua action dari meeting yang ada
      const allActions: RtmAction[] = [];
      parseApiPayload<any[]>(json, []).forEach((m: any) => {
        m.actions?.forEach((a: any) => {
          allActions.push({ ...a, meeting: { title: m.title }, meeting_id: m.id });
        });
      });
      setActions(allActions);
      setDrafts(
        allActions.reduce<Record<number, { status: string; progress: number; owner_notes: string }>>((acc, item) => {
          acc[item.id] = {
            status: item.status || "open",
            progress: Number(item.progress ?? 0),
            owner_notes: item.owner_notes || "",
          };
          return acc;
        }, {})
      );
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (action: RtmAction) => {
    const draft = drafts[action.id];
    if (!draft?.status || !action.meeting_id) {
      return;
    }

    setSavingActionId(action.id);
    try {
      const res = await clientApiRequest(`/rtm/meetings/${action.meeting_id}/actions/${action.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.message || "Pembaruan RTL gagal disimpan.");
      }

      const updated = parseApiPayload<RtmAction | null>(payload, null);
      if (updated) {
        setActions((current) =>
          current.map((item) =>
            item.id === action.id
              ? {
                  ...item,
                  ...updated,
                  meeting: { title: updated.meeting?.title || item.meeting.title },
                  meeting_id: updated.meeting_id || item.meeting_id,
                }
              : item
          )
        );
        setDrafts((current) => ({
          ...current,
          [action.id]: {
            status: updated.status || draft.status,
            progress: Number(updated.progress ?? draft.progress),
            owner_notes: updated.owner_notes || "",
          },
        }));
      }

      showToast("Perubahan tindak lanjut sudah tersimpan di mode lokal.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Tidak dapat menyimpan progres RTL.", "danger");
    } finally {
      setSavingActionId(null);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredActions = actions.filter((action) => {
    const draft = drafts[action.id];
    const status = draft?.status || action.status || "open";
    const haystack = [
      action.action_item,
      action.meeting.title,
      action.unit?.name,
      action.due_date,
      status,
      draft?.owner_notes || action.owner_notes,
    ].join(" ").toLowerCase();
    return haystack.includes(searchTerm.toLowerCase()) && (!statusFilter || status === statusFilter);
  });
  const totalPages = Math.max(1, Math.ceil(filteredActions.length / pageSize));
  const paginatedActions = filteredActions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function exportCsv() {
    const rows = [
      ["Tindak Lanjut", "Sumber RTM", "PIC", "Deadline", "Status", "Progress", "Catatan"],
      ...filteredActions.map((action) => {
        const draft = drafts[action.id] || { status: action.status || "open", progress: Number(action.progress ?? 0), owner_notes: action.owner_notes || "" };
        return [
          action.action_item,
          action.meeting.title,
          action.unit?.name || "Rektorat",
          action.due_date,
          draft.status,
          String(draft.status === "done" ? 100 : draft.progress),
          draft.owner_notes,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "monitoring-rtl.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Monitoring RTL (Tindak Lanjut)</h4>
            <p className="mb-0">Daftar penugasan hasil Rapat Tinjauan Manajemen untuk perbaikan mutu.</p>
          </div>
        </div>
      </div>

      <div className="row" id="monitoring-rtl">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <div>
                <h4 className="card-title">Tracking Penugasan Strategis</h4>
                <p className="mb-0 text-muted">
                  {canUpdateActions
                    ? "Perbarui status dan progres tindak lanjut langsung dari halaman ini."
                    : "Mode baca aktif. Hanya admin LPM dan unit kerja yang dapat memperbarui progres RTL."}
                </p>
              </div>
              <button className="btn btn-outline-primary btn-sm" type="button" onClick={exportCsv}>
                Export CSV
              </button>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-7 mb-2 mb-md-0">
                  <input
                    className="form-control"
                    placeholder="Cari tindak lanjut, RTM, PIC, deadline, atau catatan..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-2 mb-md-0">
                  <select className="form-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="">Semua status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="overdue">Overdue</option>
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
                      <th>Tugas / Tindak Lanjut</th>
                      <th>Sumber RTM</th>
                      <th>PIC / Unit</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center">Memuat data...</td></tr>
                    ) : paginatedActions.map((a) => {
                      const draft = drafts[a.id] || { status: a.status || "open", progress: Number(a.progress ?? 0), owner_notes: a.owner_notes || "" };
                      const badgeName =
                        draft.status === "done" ? "success" : draft.status === "overdue" ? "danger" : draft.status === "in_progress" ? "warning" : "info";

                      return (
                        <tr key={a.id}>
                          <td>
                            <strong>{a.action_item}</strong>
                            <div className="text-muted small mt-1">
                              Update terakhir: {a.updated_at ? new Date(a.updated_at).toLocaleDateString("id-ID") : "-"}
                            </div>
                          </td>
                          <td><small>{a.meeting.title}</small></td>
                          <td>{a.unit?.name || "Rektorat"}</td>
                          <td>{a.due_date}</td>
                          <td>
                            <span className={`badge badge-${badgeName}`}>
                              {draft.status.replace("_", " ").toUpperCase()}
                            </span>
                            <div className="text-muted small mt-2">Progress: {draft.status === "done" ? 100 : draft.progress}%</div>
                          </td>
                          <td className="rtl-action-cell">
                            {canUpdateActions ? (
                              <div className="rtl-action-editor">
                                <select
                                  className="form-control form-control-sm mb-2"
                                  value={draft.status}
                                  onChange={(event) => {
                                    const nextStatus = event.target.value;
                                    setDrafts((current) => ({
                                      ...current,
                                      [a.id]: {
                                        ...draft,
                                        status: nextStatus,
                                        progress: nextStatus === "done" ? 100 : draft.progress,
                                      },
                                    }));
                                  }}
                                >
                                  <option value="open">Open</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="overdue">Overdue</option>
                                  <option value="done">Done</option>
                                </select>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  className="form-control form-control-sm mb-2"
                                  value={draft.status === "done" ? 100 : draft.progress}
                                  onChange={(event) =>
                                    setDrafts((current) => ({
                                      ...current,
                                      [a.id]: {
                                        ...draft,
                                        progress: Number(event.target.value || 0),
                                      },
                                    }))
                                  }
                                  disabled={draft.status === "done"}
                                />
                                <textarea
                                  className="form-control form-control-sm mb-2"
                                  rows={2}
                                  value={draft.owner_notes}
                                  placeholder="Catatan progres unit..."
                                  onChange={(event) =>
                                    setDrafts((current) => ({
                                      ...current,
                                      [a.id]: {
                                        ...draft,
                                        owner_notes: event.target.value,
                                      },
                                    }))
                                  }
                                />
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => saveProgress(a)}
                                  disabled={savingActionId === a.id}
                                >
                                  {savingActionId === a.id ? "Menyimpan..." : "Simpan Progress"}
                                </button>
                              </div>
                            ) : (
                              <div className="text-muted small">
                                Monitoring only
                                <div className="mt-2">{draft.owner_notes || "Belum ada catatan progres."}</div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredActions.length === 0 && !loading && (
                      <tr><td colSpan={6} className="text-center">Belum ada penugasan RTL aktif.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <small className="text-muted">Menampilkan {paginatedActions.length} dari {filteredActions.length} RTL</small>
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
      <div id="update-progress" aria-hidden="true"></div>
      <div id="action-plan" aria-hidden="true"></div>
    </>
  );
}
