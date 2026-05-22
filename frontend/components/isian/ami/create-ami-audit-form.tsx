"use client";

import { useState, type FormEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";
import { useSpmiCatalogOptions } from "@/lib/use-spmi-catalog-options";

type AuditPreviewItem = {
  id: number | string;
  org_unit: { name: string };
  score: number;
  status: string;
  auditor?: { name?: string };
};

export function CreateAmiAuditForm({ initialItems }: { initialItems: AuditPreviewItem[] }) {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<AuditPreviewItem[]>(Array.isArray(initialItems) ? initialItems : []);
  const catalog = useSpmiCatalogOptions();
  const unitOptions = catalog.orgUnits.filter((unit) => ["prodi", "fakultas", "unit", "lpm"].includes(unit.type));
  const auditorOptions = (catalog.hris?.employees || []).filter((employee) =>
    ["Dosen", "Dosen dengan Tugas Tambahan", "Tendik"].includes(employee.type || "")
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const ppeppCycleId = String(formData.get("ppepp_cycle_id") ?? "");
    const orgUnitCode = String(formData.get("org_unit_code") ?? "");
    const orgUnitName = unitOptions.find((unit) => unit.code === orgUnitCode)?.name || "";
    const auditDate = String(formData.get("audit_date") ?? "");
    const auditorName = String(formData.get("auditor_name") ?? "");
    const status = String(formData.get("status") ?? "terjadwal");
    const score = Number(formData.get("score") ?? 0);
    const findingSummary = String(formData.get("finding_summary") ?? "");
    const findingCategory = String(formData.get("finding_category") ?? "Observasi");

    if (!ppeppCycleId || !orgUnitCode || !auditDate) {
      setMessage("Siklus, unit, dan tanggal audit wajib dipilih dari master data.");
      return;
    }

    if (hasApiBaseUrl()) {
      try {
        const response = await clientApiRequest("/ami/audits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ppepp_cycle_id: ppeppCycleId,
            org_unit_code: orgUnitCode,
            org_unit_name: orgUnitName,
            audit_date: auditDate || null,
            scheduled_date: auditDate || null,
            auditor_name: auditorName || "Internal Auditor",
            status,
            score,
            finding_summary: findingSummary,
            finding_category: findingCategory,
          }),
        });

        if (response.ok) {
          const created = (await response.json()) as {
            id?: number;
            score?: number;
            status?: string;
            auditor?: { name?: string };
            org_unit?: { name?: string };
            data?: {
              id?: number;
              score?: number;
              status?: string;
              auditor?: { name?: string };
              org_unit?: { name?: string };
            };
          };
          const item = created.data ?? created;

          setItems((current) => [
            {
              id: item.id ?? Date.now(),
              org_unit: { name: item.org_unit?.name ?? "Unit Lokal" },
              score: item.score ?? score,
              status: item.status ?? status,
              auditor: item.auditor ?? { name: auditorName },
            },
            ...current,
          ]);
          setMessage("AMI audit berhasil disimpan ke backend.");
          dispatchAppEvent("spmi-data-changed");
          event.currentTarget.reset();
          return;
        }
      } catch {}
    }
    setMessage("Gagal menyimpan ke backend. Data tidak ditulis agar tetap sinkron.");
  }

  return (
    <form className="glass auth-card form-shell" onSubmit={handleSubmit}>
      <h3>Buat AMI Audit</h3>
      <div className="field">
        <label htmlFor="ppepp_cycle_id">PPEPP Cycle ID</label>
        <select id="ppepp_cycle_id" name="ppepp_cycle_id" className="form-select" required defaultValue="">
          <option value="" disabled>Pilih siklus PPEPP</option>
          {catalog.ppeppCycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.name} {cycle.status ? `(${cycle.status})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="org_unit_code">Unit Audit</label>
        <select id="org_unit_code" name="org_unit_code" className="form-select" required defaultValue="">
          <option value="" disabled>Pilih fakultas/prodi/unit</option>
          {unitOptions.map((unit) => (
            <option key={unit.code} value={unit.code}>
              {unit.name} · {unit.type}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="audit_date">Tanggal Audit</label>
        <input id="audit_date" name="audit_date" type="date" />
      </div>
      <div className="field">
        <label htmlFor="auditor_name">Auditor</label>
        <select id="auditor_name" name="auditor_name" className="form-select" defaultValue="">
          <option value="">Internal Auditor</option>
          {auditorOptions.map((employee) => (
            <option key={employee.id} value={employee.name}>
              {employee.name} {employee.unit ? `· ${employee.unit}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" className="form-select">
          <option value="terjadwal">Terjadwal</option>
          <option value="berjalan">Berjalan</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="score">Skor</label>
        <input id="score" name="score" type="number" min="0" max="100" step="0.01" />
      </div>
      <div className="field">
        <label htmlFor="finding_summary">Ringkasan Temuan</label>
        <input id="finding_summary" name="finding_summary" placeholder="Temuan utama audit" />
      </div>
      <div className="field">
        <label htmlFor="finding_category">Kategori Temuan Awal</label>
        <select id="finding_category" name="finding_category" className="form-select">
          <option value="Observasi">Observasi</option>
          <option value="Minor">Minor</option>
          <option value="Mayor">Mayor</option>
        </select>
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
