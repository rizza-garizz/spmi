"use client";

import { useState } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

type AmiFinding = {
  id: number | string;
  title: string;
  description: string;
  category: string;
  recommendation?: string;
  follow_up?: { status: string; progress: number; plan?: string };
  verification?: { status: string };
};

type AmiInstrument = {
  id: string;
  code: string;
  title: string;
  status: string;
  score?: number | null;
};

type AmiAudit = {
  id: number | string;
  title?: string;
  org_unit: { name: string };
  status: string;
  scheduled_date?: string;
  auditor?: { name: string; email?: string };
  instruments?: AmiInstrument[];
  findings?: AmiFinding[];
  score?: number;
  recap?: {
    categories: { minor: number; mayor: number; observasi: number };
    follow_up_open: number;
    verified: number;
    instrument_checked: number;
    instrument_total: number;
    score: number;
  };
};

const categoryOptions = ["Minor", "Mayor", "Observasi"];

export function AmiAuditWorkflow({ audits }: { audits: AmiAudit[] }) {
  const [items, setItems] = useState(audits);
  const [message, setMessage] = useState("");

  async function patchAudit(path: string, body: Record<string, unknown>) {
    if (!hasApiBaseUrl()) {
      setMessage("Backend belum tersambung.");
      return null;
    }

    const response = await clientApiRequest(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setMessage("Update AMI gagal.");
      return null;
    }

    const payload = await response.json();
    dispatchAppEvent("spmi-data-changed");
    return payload.data as AmiAudit;
  }

  async function updateAssignment(audit: AmiAudit) {
    const updated = await patchAudit(`/ami/audits/${audit.id}/assignment`, {
      auditor_name: audit.auditor?.name || "Internal Auditor",
      scheduled_date: audit.scheduled_date || new Date().toISOString().slice(0, 10),
      status: audit.status === "terjadwal" ? "berjalan" : audit.status,
    });
    if (!updated) return;
    setItems((current) => current.map((item) => (String(item.id) === String(updated.id) ? updated : item)));
    setMessage("Penugasan auditor diperbarui.");
  }

  async function checkInstrument(audit: AmiAudit, instrument: AmiInstrument) {
    const updated = await patchAudit(`/ami/audits/${audit.id}/instruments/${instrument.id}`, {
      status: "checked",
      score: instrument.score ?? 85,
      notes: "Instrumen sudah diperiksa.",
    });
    if (!updated) return;
    setItems((current) => current.map((item) => (String(item.id) === String(updated.id) ? updated : item)));
    setMessage("Instrumen audit diperiksa.");
  }

  async function addFinding(audit: AmiAudit, category: string) {
    if (!hasApiBaseUrl()) return;
    const response = await clientApiRequest(`/ami/audits/${audit.id}/findings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Temuan ${category}`,
        category,
        description: `Catatan ${category.toLowerCase()} dari audit ${audit.org_unit.name}`,
        recommendation: "Unit menyusun rencana tindak lanjut dan bukti perbaikan.",
        follow_up_plan: "Perbaikan dan upload eviden.",
      }),
    });
    if (!response.ok) {
      setMessage("Tambah temuan gagal.");
      return;
    }
    const created = await response.json();
    setItems((current) =>
      current.map((item) =>
        String(item.id) === String(audit.id)
          ? { ...item, findings: [created.data, ...(item.findings || [])] }
          : item
      )
    );
    setMessage("Temuan audit ditambahkan.");
    dispatchAppEvent("spmi-data-changed");
  }

  async function followUp(audit: AmiAudit, finding: AmiFinding) {
    const updated = await patchAudit(`/ami/audits/${audit.id}/findings/${finding.id}/follow-up`, {
      status: "in_progress",
      progress: 75,
      plan: finding.follow_up?.plan || "Perbaikan sedang berjalan.",
      evidence_title: "Bukti tindak lanjut",
    });
    if (!updated) return;
    setItems((current) => current.map((item) => (String(item.id) === String(updated.id) ? updated : item)));
    setMessage("Tindak lanjut temuan diperbarui.");
  }

  async function verify(audit: AmiAudit, finding: AmiFinding) {
    const updated = await patchAudit(`/ami/audits/${audit.id}/findings/${finding.id}/verification`, {
      status: "verified",
      notes: "Perbaikan sudah diverifikasi auditor.",
    });
    if (!updated) return;
    setItems((current) => current.map((item) => (String(item.id) === String(updated.id) ? updated : item)));
    setMessage("Perbaikan temuan diverifikasi.");
  }

  return (
    <div className="grid grid-1">
      {message ? <p className="form-note">{message}</p> : null}
      {items.map((audit) => (
        <article className="glass auth-card" key={audit.id}>
          <div className="section-head" style={{ alignItems: "flex-start" }}>
            <div>
              <span className="eyebrow">AMI Workflow</span>
              <h3 style={{ marginBottom: 8 }}>{audit.org_unit.name}</h3>
              <p className="hero-copy" style={{ marginTop: 0 }}>
                Auditor: {audit.auditor?.name || "-"} · Jadwal: {audit.scheduled_date || "-"} · Status: {audit.status}
              </p>
            </div>
            <button className="btn btn-sm btn-primary" type="button" onClick={() => updateAssignment(audit)}>
              Update Penugasan
            </button>
          </div>

          <div className="grid grid-4">
            <div className="pill">Minor {audit.recap?.categories.minor ?? 0}</div>
            <div className="pill">Mayor {audit.recap?.categories.mayor ?? 0}</div>
            <div className="pill">Observasi {audit.recap?.categories.observasi ?? 0}</div>
            <div className="pill">Skor {audit.recap?.score ?? audit.score ?? 0}</div>
          </div>

          <div className="grid grid-2" style={{ marginTop: 18 }}>
            <div className="card">
              <div className="card-body">
                <h5>Instrumen Audit</h5>
                {(audit.instruments || []).map((instrument) => (
                  <div className="d-flex justify-content-between align-items-center mb-2" key={instrument.id}>
                    <span>{instrument.code} · {instrument.title}</span>
                    <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => checkInstrument(audit, instrument)}>
                      Periksa
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h5>Tambah Temuan</h5>
                <div className="form-actions">
                  {categoryOptions.map((category) => (
                    <button className="btn btn-sm btn-outline-primary" type="button" key={category} onClick={() => addFinding(audit, category)}>
                      {category}
                    </button>
                  ))}
                </div>
                <hr />
                {(audit.findings || []).slice(0, 4).map((finding) => (
                  <div className="mb-3" key={finding.id}>
                    <strong>{finding.category}</strong>
                    <p className="mb-1 text-muted">{finding.description}</p>
                    <div className="form-actions">
                      <button className="btn btn-sm btn-outline-warning" type="button" onClick={() => followUp(audit, finding)}>
                        Tindak Lanjut
                      </button>
                      <button className="btn btn-sm btn-success" type="button" onClick={() => verify(audit, finding)}>
                        Verifikasi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
