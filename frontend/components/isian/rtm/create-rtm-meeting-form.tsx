"use client";

import { useState, type FormEvent } from "react";
import { fallbackRtmMeetings } from "@/lib/spmi-catalog-data";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

type RtmPreviewItem = {
  id: number | string;
  title: string;
  status: string;
};

export function CreateRtmMeetingForm() {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<RtmPreviewItem[]>(
    fallbackRtmMeetings.map((item) => ({
      id: item.id,
      title: item.title ?? "RTM Lokal",
      status: item.status ?? "draft",
    }))
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const ppeppCycleId = Number(formData.get("ppepp_cycle_id") ?? 0);
    const meetingDate = String(formData.get("meeting_date") ?? "");
    const title = String(formData.get("title") ?? "");
    const conclusion = String(formData.get("conclusion") ?? "");
    const status = String(formData.get("status") ?? "draft");

    if (hasApiBaseUrl()) {
      try {
        const response = await clientApiRequest("/rtm/meetings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ppepp_cycle_id: ppeppCycleId,
            meeting_date: meetingDate || null,
            title,
            conclusion,
            status,
          }),
        });

        if (response.ok) {
          const created = (await response.json()) as {
            id?: number;
            title?: string;
            status?: string;
            data?: {
              id?: number;
              title?: string;
              status?: string;
            };
          };
          const item = created.data ?? created;

          setItems((current) => [
            {
              id: item.id ?? Date.now(),
              title: item.title ?? title,
              status: item.status ?? status,
            },
            ...current,
          ]);
          setMessage("RTM berhasil disimpan ke backend.");
          dispatchAppEvent("spmi-data-changed");
          event.currentTarget.reset();
          return;
        }
      } catch {
        // Fall back to local cache.
      }
    }

    setItems((current) => [{ id: Date.now(), title, status }, ...current]);
    setMessage("RTM disimpan ke cache lokal.");
    dispatchAppEvent("spmi-data-changed");
    event.currentTarget.reset();
  }

  return (
    <form className="glass auth-card form-shell" onSubmit={handleSubmit}>
      <h3>Buat RTM Meeting</h3>
      <div className="field">
        <label htmlFor="ppepp_cycle_id">PPEPP Cycle ID</label>
        <input id="ppepp_cycle_id" name="ppepp_cycle_id" type="number" required />
      </div>
      <div className="field">
        <label htmlFor="meeting_date">Tanggal</label>
        <input id="meeting_date" name="meeting_date" type="date" />
      </div>
      <div className="field">
        <label htmlFor="title">Judul</label>
        <input id="title" name="title" placeholder="RTM Semester Ganjil" required />
      </div>
      <div className="field">
        <label htmlFor="conclusion">Kesimpulan</label>
        <input id="conclusion" name="conclusion" placeholder="Arah tindak lanjut utama" />
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" className="form-select">
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="done">Done</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">Simpan</button>
      </div>
      {message ? <p className="form-note">{message}</p> : null}
      <div className="form-preview">
        <h4 className="form-preview-title">RTM terbaru</h4>
        <div className="grid grid-2">
          {items.map((item) => (
            <div className="pill" key={`${item.id}-${item.title}`}>
              {item.title} · {item.status}
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
