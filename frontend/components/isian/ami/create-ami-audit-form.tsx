"use client";

import { useState, type FormEvent } from "react";
import { fallbackAmiAudits } from "@/lib/spmi-catalog-data";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

type AuditPreviewItem = {
  id: number | string;
  org_unit: { name: string };
  score: number;
  status: string;
};

export function CreateAmiAuditForm() {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<AuditPreviewItem[]>(
    fallbackAmiAudits.map((item) => ({
      id: item.id,
      org_unit: { name: item.org_unit?.name ?? "Unit Lokal" },
      score: item.score ?? 0,
      status: item.status ?? "draft",
    }))
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const ppeppCycleId = Number(formData.get("ppepp_cycle_id") ?? 0);
    const orgUnitId = Number(formData.get("org_unit_id") ?? 0);
    const auditDate = String(formData.get("audit_date") ?? "");
    const score = Number(formData.get("score") ?? 0);
    const findingSummary = String(formData.get("finding_summary") ?? "");

    if (hasApiBaseUrl()) {
      try {
        const response = await clientApiRequest("/ami/audits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ppepp_cycle_id: ppeppCycleId,
            org_unit_id: orgUnitId,
            audit_date: auditDate || null,
            score,
            finding_summary: findingSummary,
          }),
        });

        if (response.ok) {
          const created = (await response.json()) as {
            id?: number;
            score?: number;
            status?: string;
            org_unit?: { name?: string };
            data?: {
              id?: number;
              score?: number;
              status?: string;
              org_unit?: { name?: string };
            };
          };
          const item = created.data ?? created;

          setItems((current) => [
            {
              id: item.id ?? Date.now(),
              org_unit: { name: item.org_unit?.name ?? "Unit Lokal" },
              score: item.score ?? score,
              status: item.status ?? "draft",
            },
            ...current,
          ]);
          setMessage("AMI audit berhasil disimpan ke backend.");
          dispatchAppEvent("spmi-data-changed");
          event.currentTarget.reset();
          return;
        }
      } catch {
        // Fall back to local cache.
      }
    }

    setItems((current) => [
      { id: Date.now(), org_unit: { name: "Unit Lokal" }, score, status: "draft" },
      ...current,
    ]);
    setMessage(`AMI audit disimpan ke cache lokal dengan skor ${score}.`);
    dispatchAppEvent("spmi-data-changed");
    event.currentTarget.reset();
  }

  return (
    <form className="glass auth-card form-shell" onSubmit={handleSubmit}>
      <h3>Buat AMI Audit</h3>
      <div className="field">
        <label htmlFor="ppepp_cycle_id">PPEPP Cycle ID</label>
        <input id="ppepp_cycle_id" name="ppepp_cycle_id" type="number" required />
      </div>
      <div className="field">
        <label htmlFor="org_unit_id">Org Unit ID</label>
        <input id="org_unit_id" name="org_unit_id" type="number" required />
      </div>
      <div className="field">
        <label htmlFor="audit_date">Tanggal Audit</label>
        <input id="audit_date" name="audit_date" type="date" />
      </div>
      <div className="field">
        <label htmlFor="score">Skor</label>
        <input id="score" name="score" type="number" min="0" max="100" step="0.01" />
      </div>
      <div className="field">
        <label htmlFor="finding_summary">Ringkasan Temuan</label>
        <input id="finding_summary" name="finding_summary" placeholder="Temuan utama audit" />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">Simpan</button>
      </div>
      {message ? <p className="form-note">{message}</p> : null}
      <div className="form-preview">
        <h4 className="form-preview-title">Audit terbaru</h4>
        <div className="grid grid-2">
          {items.map((item) => (
            <div className="pill" key={`${item.id}-${item.org_unit.name}`}>
              {item.org_unit.name} · {item.score}
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
