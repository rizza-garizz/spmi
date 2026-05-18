"use client";

import { useState, type FormEvent } from "react";
import { fallbackSurveys, fallbackSurveyTargets } from "@/lib/spmi-catalog-data";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

export function CreateSurveyForm() {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState(fallbackSurveys);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const title = String(formData.get("title") ?? "");
    const target = String(formData.get("target") ?? "");
    const ppeppCycleId = Number(formData.get("ppepp_cycle_id") ?? 0);
    const status = String(formData.get("status") ?? "draft");

    if (hasApiBaseUrl()) {
      try {
        const response = await clientApiRequest("/surveys", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            target,
            ppepp_cycle_id: ppeppCycleId || null,
            status,
          }),
        });

        if (response.ok) {
          const created = (await response.json()) as {
            id?: number;
            title?: string;
            target?: string;
          };

          setItems((current) => [
            {
              id: created.id ?? Date.now(),
              title: created.title ?? title,
              target: created.target ?? target,
            },
            ...current,
          ]);
          setMessage("Survei berhasil disimpan ke backend.");
          dispatchAppEvent("spmi-data-changed");
          event.currentTarget.reset();
          return;
        }
      } catch {
        // Fall back to local cache.
      }
    }

    setItems((current) => [{ id: Date.now(), title, target }, ...current]);
    setMessage("Survei disimpan ke cache lokal.");
    dispatchAppEvent("spmi-data-changed");
    event.currentTarget.reset();
  }

  return (
    <form className="glass auth-card form-shell" onSubmit={handleSubmit}>
      <h3>Buat Survei</h3>
      <div className="field">
        <label htmlFor="title">Judul</label>
        <input id="title" name="title" placeholder="Survei Kepuasan Mahasiswa" required />
      </div>
      <div className="field">
        <label htmlFor="target">Target</label>
        <select id="target" name="target" className="form-select">
          {fallbackSurveyTargets.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="ppepp_cycle_id">PPEPP Cycle ID</label>
        <input id="ppepp_cycle_id" name="ppepp_cycle_id" type="number" />
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" className="form-select">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">Simpan</button>
      </div>
      {message ? <p className="form-note">{message}</p> : null}
      <div className="form-preview">
        <h4 className="form-preview-title">Survei tersedia</h4>
        <div className="grid grid-2">
          {items.map((item) => (
            <div className="pill" key={`${item.id}-${item.title}`}>
              {item.title} · {item.target}
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
