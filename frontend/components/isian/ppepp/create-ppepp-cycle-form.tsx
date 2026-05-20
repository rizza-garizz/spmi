"use client";

import { useState, type FormEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

type PpeppPreviewItem = {
  id: number | string;
  name: string;
  period: string;
  status: string;
};

export function CreatePpeppCycleForm({ initialItems }: { initialItems: PpeppPreviewItem[] }) {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<PpeppPreviewItem[]>(initialItems);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "");
    const period = String(formData.get("period") ?? "yearly");
    const status = String(formData.get("status") ?? "planned");
    const academicYearStart = Number(formData.get("academic_year_start") ?? 0);
    const academicYearEnd = Number(formData.get("academic_year_end") ?? 0);

    if (hasApiBaseUrl()) {
      try {
        const response = await clientApiRequest("/ppepp/cycles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            academic_year_start: academicYearStart,
            academic_year_end: academicYearEnd,
            period,
            status,
          }),
        });

        if (response.ok) {
          const created = (await response.json()) as {
            id?: number;
            name?: string;
            period?: string;
            status?: string;
            data?: {
              id?: number;
              name?: string;
              period?: string;
              status?: string;
            };
          };
          const item = created.data ?? created;

          setItems((current) => [
            {
              id: item.id ?? Date.now(),
              name: item.name ?? name,
              period: item.period ?? period,
              status: item.status ?? status,
            },
            ...current,
          ]);
          setMessage("Siklus berhasil disimpan ke backend.");
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
      <h3>Buat Siklus PPEPP</h3>
      <div className="field">
        <label htmlFor="name">Nama</label>
        <input id="name" name="name" placeholder="Siklus 2025/2026" required />
      </div>
      <div className="field">
        <label htmlFor="academic_year_start">Tahun Awal</label>
        <input id="academic_year_start" name="academic_year_start" type="number" placeholder="2025" required />
      </div>
      <div className="field">
        <label htmlFor="academic_year_end">Tahun Akhir</label>
        <input id="academic_year_end" name="academic_year_end" type="number" placeholder="2026" required />
      </div>
      <div className="field">
        <label htmlFor="period">Periode</label>
        <select id="period" name="period" className="form-select">
          <option value="yearly">Yearly</option>
          <option value="annual">Annual</option>
          <option value="semester">Semester</option>
          <option value="semester_ganjil">Semester Ganjil</option>
          <option value="semester_genap">Semester Genap</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" className="form-select">
          <option value="planned">Planned</option>
          <option value="running">Running</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">Simpan</button>
      </div>
      {message ? <p className="form-note">{message}</p> : null}
      <div className="form-preview">
        <h4 className="form-preview-title">Siklus tersedia</h4>
        <div className="grid grid-2">
          {items.map((item) => (
            <div className="pill" key={`${item.id}-${item.name}`}>
              {item.name} · {item.status}
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
