"use client";

import { useState, type FormEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";
import { useSpmiCatalogOptions } from "@/lib/use-spmi-catalog-options";

type ImportItem = { id: number | string; type: string; title: string; status: string };

export function CreateImportForm({
  initialItems,
  importTypes,
}: {
  initialItems: ImportItem[];
  importTypes: Array<{ value: string; label: string }>;
}) {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState(Array.isArray(initialItems) ? initialItems : []);
  const catalog = useSpmiCatalogOptions();
  const typeOptions = catalog.importTypes.length ? catalog.importTypes : importTypes;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const type = String(formData.get("type") ?? "");
    const title = String(formData.get("title") ?? "");
    const file = formData.get("file");

    if (!type || !title.trim()) {
      setMessage("Tipe dan judul import wajib diisi.");
      return;
    }
    if (items.some((item) => item.title.toLowerCase() === title.trim().toLowerCase() && item.type === type)) {
      setMessage("Import dengan tipe dan judul yang sama sudah pernah dikirim.");
      return;
    }
    if (!(file instanceof File) || file.size === 0) {
      setMessage("File import wajib dipilih.");
      return;
    }
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setMessage("File import harus berformat XLSX, XLS, atau CSV.");
      return;
    }

    if (hasApiBaseUrl()) {
      try {
        const upload = new FormData();
        upload.append("type", type);
        upload.append("title", title);

        if (file instanceof File && file.size > 0) {
          upload.append("file", file);
        }

        const response = await clientApiRequest("/imports", {
          method: "POST",
          body: upload,
        });

        if (response.ok) {
          const created = (await response.json()) as {
            id?: number;
            type?: string;
            title?: string;
            status?: string;
            data?: {
              id?: number;
              type?: string;
              title?: string;
              status?: string;
            };
          };
          const item = created.data ?? created;

          setItems((current) => [
            { id: item.id ?? Date.now(), type: item.type ?? type, title: item.title ?? title, status: item.status ?? "queued" },
            ...current,
          ]);
          setMessage("Import berhasil dikirim ke backend.");
          dispatchAppEvent("spmi-data-changed");
          event.currentTarget.reset();
          return;
        }
      } catch {}
    }
    setMessage("Gagal mengirim ke backend. Data tidak ditulis agar tetap sinkron.");
  }

  return (
    <form className="glass auth-card form-shell" onSubmit={handleSubmit}>
      <h3>Import LKPT / LKPS / KKM</h3>
      <div className="field">
        <label htmlFor="type">Tipe</label>
        <select id="type" name="type" className="form-select">
          {typeOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="title">Judul</label>
        <input id="title" name="title" placeholder="Import data semester ganjil" required />
      </div>
      <div className="field">
        <label htmlFor="file">File</label>
        <input id="file" name="file" type="file" accept=".xlsx,.xls,.csv" required />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">
          Kirim Import
        </button>
      </div>
      {message ? <p className="form-note">{message}</p> : null}
      <div className="form-preview">
        <h4 className="form-preview-title">Riwayat import</h4>
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
