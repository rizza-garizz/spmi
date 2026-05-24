"use client";

import { useState, type ChangeEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

type PpeppEvidence = {
  id: string;
  title: string;
  file_name?: string | null;
  uploaded_at?: string;
};

type PpeppStage = {
  key: string;
  label: string;
  description: string;
  deliverable: string;
  status: string;
  progress: number;
  due_date?: string | null;
  notes?: string;
  evidence: PpeppEvidence[];
};

type PpeppCycle = {
  id: number | string;
  name: string;
  period: string;
  status: string;
  progress?: number;
  current_stage?: string;
  stages?: PpeppStage[];
  timeline?: Array<{ at: string; action: string; stage?: string | null; note?: string }>;
};

const statusLabels: Record<string, string> = {
  not_started: "Belum mulai",
  in_progress: "Berjalan",
  completed: "Selesai",
  blocked: "Tertahan",
};

export function PpeppCycleMonitor({ cycles }: { cycles: PpeppCycle[] }) {
  const [items, setItems] = useState<PpeppCycle[]>(cycles);
  const [message, setMessage] = useState("");

  async function updateStage(cycleId: PpeppCycle["id"], stage: PpeppStage, nextStatus: string) {
    if (!hasApiBaseUrl()) {
      setMessage("Backend belum tersambung.");
      return;
    }

    const nextProgress = nextStatus === "completed" ? 100 : nextStatus === "in_progress" ? Math.max(stage.progress || 0, 50) : stage.progress || 0;
    const response = await clientApiRequest(`/ppepp/cycles/${cycleId}/stages/${stage.key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        progress: nextProgress,
        notes: `${stage.label} ditandai ${statusLabels[nextStatus] || nextStatus}.`,
      }),
    });

    if (!response.ok) {
      setMessage("Gagal memperbarui tahap PPEPP.");
      return;
    }

    const payload = await response.json();
    const updated = payload.data as PpeppCycle;
    setItems((current) => current.map((item) => (String(item.id) === String(cycleId) ? updated : item)));
    setMessage("Tahap PPEPP berhasil diperbarui.");
    dispatchAppEvent("spmi-data-changed");
  }

  async function uploadEvidence(cycleId: PpeppCycle["id"], stage: PpeppStage, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage("Pilih file bukti PPEPP terlebih dahulu.");
      return;
    }
    if (!hasApiBaseUrl()) {
      setMessage("Backend belum tersambung. Bukti PPEPP tidak diupload.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    const response = await clientApiRequest(`/ppepp/cycles/${cycleId}/stages/${stage.key}/evidence`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setMessage("Gagal upload bukti PPEPP.");
      return;
    }

    const payload = await response.json();
    const updated = payload.data.cycle as PpeppCycle;
    setItems((current) => current.map((item) => (String(item.id) === String(cycleId) ? updated : item)));
    setMessage("Bukti PPEPP berhasil diupload.");
    dispatchAppEvent("spmi-data-changed");
    event.target.value = "";
  }

  return (
    <div className="grid grid-1">
      {message ? <p className="form-note">{message}</p> : null}
      {items.map((cycle) => (
        <article className="glass auth-card" key={cycle.id}>
          <div className="section-head" style={{ alignItems: "flex-start" }}>
            <div>
              <span className="eyebrow">PPEPP Cycle</span>
              <h3 style={{ marginBottom: 8 }}>{cycle.name}</h3>
              <p className="hero-copy" style={{ marginTop: 0 }}>
                {cycle.period} · {cycle.status} · Tahap aktif: {cycle.current_stage || "-"}
              </p>
            </div>
            <div className="section-tag">{cycle.progress ?? 0}%</div>
          </div>

          <div className="progress" style={{ height: 10 }}>
            <div className="progress-bar bg-success" style={{ width: `${cycle.progress ?? 0}%` }} />
          </div>

          <div className="grid grid-2" style={{ marginTop: 20 }}>
            {(cycle.stages || []).map((stage) => (
              <div className="card" key={stage.key}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="card-title mb-1">{stage.label}</h5>
                      <p className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>{stage.description}</p>
                    </div>
                    <span className="badge badge-primary">{statusLabels[stage.status] || stage.status}</span>
                  </div>
                  <p className="mb-2"><strong>Deliverable:</strong> {stage.deliverable}</p>
                  <div className="progress" style={{ height: 8 }}>
                    <div className="progress-bar bg-info" style={{ width: `${stage.progress || 0}%` }} />
                  </div>
                  <div className="form-actions" style={{ marginTop: 14 }}>
                    <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => updateStage(cycle.id, stage, "in_progress")}>
                      Berjalan
                    </button>
                    <button className="btn btn-sm btn-primary" type="button" onClick={() => updateStage(cycle.id, stage, "completed")}>
                      Selesai
                    </button>
                    <label className="btn btn-sm btn-outline-success mb-0">
                      Upload Bukti
                      <input type="file" hidden onChange={(event) => uploadEvidence(cycle.id, stage, event)} />
                    </label>
                  </div>
                  <div className="mt-3">
                    <strong>Bukti:</strong>
                    <ul className="mb-0 mt-1">
                      {stage.evidence.length ? stage.evidence.slice(0, 3).map((evidence) => (
                        <li key={evidence.id}>{evidence.title || evidence.file_name}</li>
                      )) : <li className="text-muted">Belum ada bukti.</li>}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="timeline" style={{ marginTop: 20 }}>
            {(cycle.timeline || []).slice(0, 5).map((entry, index) => (
              <div className="timeline-item" key={`${entry.at}-${index}`}>
                <span className="timeline-code">{entry.stage || "cycle"}</span>
                <div>
                  <strong>{entry.action}</strong>
                  <p className="mb-0 text-muted">{entry.note || "-"} · {new Date(entry.at).toLocaleString("id-ID")}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
