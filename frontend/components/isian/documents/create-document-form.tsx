"use client";

import { useState, type FormEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

type DocumentPreviewItem = {
  id: number | string;
  title: string;
  type: string;
  status: string;
};

export function CreateDocumentForm({
  initialItems,
  documentTypes,
}: {
  initialItems: DocumentPreviewItem[];
  documentTypes: Array<{ value: string; label: string }>;
}) {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<DocumentPreviewItem[]>(initialItems);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "");
    const title = String(formData.get("title") ?? "");
    const type = String(formData.get("type") ?? "");
    const file = formData.get("file");

    if (hasApiBaseUrl()) {
      try {
        const upload = new FormData();
        upload.append("code", code);
        upload.append("title", title);
        upload.append("type", type);

        if (file instanceof File && file.size > 0) {
          upload.append("file", file);
        }

        const response = await clientApiRequest("/documents", {
          method: "POST",
          body: upload,
        });

        if (response.ok) {
          const created = (await response.json()) as {
            id?: number;
            title?: string;
            type?: string;
            status?: string;
            data?: {
              id?: number;
              title?: string;
              type?: string;
              status?: string;
            };
          };
          const item = created.data ?? created;

          setItems((current) => [
            { id: item.id ?? Date.now(), title: item.title ?? title, type: item.type ?? type, status: item.status ?? "draft" },
            ...current,
          ]);
          setMessage("Dokumen berhasil diunggah ke backend.");
          dispatchAppEvent("spmi-data-changed");
          event.currentTarget.reset();
          return;
        }
      } catch {}
    }
    setMessage("Gagal mengunggah ke backend. Data tidak ditulis agar tetap sinkron.");
  }

  return (
    <form className="glass auth-card form-shell" onSubmit={handleSubmit}>
      <h3>Upload Dokumen</h3>
      <div className="field">
        <label htmlFor="code">Kode</label>
        <input id="code" name="code" placeholder="DOC-SPMI-001" required />
      </div>
      <div className="field">
        <label htmlFor="title">Judul</label>
        <input id="title" name="title" placeholder="Kebijakan SPMI" required />
      </div>
      <div className="field">
        <label htmlFor="type">Tipe</label>
        <select id="type" name="type" className="form-select">
          {documentTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="file">File</label>
        <input id="file" name="file" type="file" required />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">
          Upload
        </button>
      </div>
      {message ? <p className="form-note">{message}</p> : null}
      <div className="form-preview">
        <h4 className="form-preview-title">Preview repository</h4>
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
