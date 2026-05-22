"use client";

import { useState, type FormEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";
import { makeNextCode, useSpmiCatalogOptions } from "@/lib/use-spmi-catalog-options";

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
  const [items, setItems] = useState<DocumentPreviewItem[]>(Array.isArray(initialItems) ? initialItems : []);
  const catalog = useSpmiCatalogOptions();
  const typeOptions = catalog.documentTypes.length ? catalog.documentTypes : documentTypes;
  const nextCode = makeNextCode("DOC-SPMI", items.map((item) => String(item.id)));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "");
    const title = String(formData.get("title") ?? "");
    const type = String(formData.get("type") ?? "");
    const documentDate = String(formData.get("document_date") ?? "");
    const orgUnitCode = String(formData.get("org_unit_code") ?? "");
    const owner = String(formData.get("owner") ?? "");
    const file = formData.get("file");

    if (!code.trim() || !title.trim() || !type || !documentDate || !orgUnitCode || !owner) {
      setMessage("Kode, judul, tipe, tanggal, unit, dan penanggung jawab wajib lengkap.");
      return;
    }
    if (items.some((item) => item.title.toLowerCase() === title.trim().toLowerCase() && item.type === type)) {
      setMessage("Dokumen dengan judul dan tipe yang sama sudah ada.");
      return;
    }
    if (!(file instanceof File) || file.size === 0) {
      setMessage("File wajib dipilih.");
      return;
    }

    if (hasApiBaseUrl()) {
      try {
        const upload = new FormData();
        upload.append("code", code);
        upload.append("title", title);
        upload.append("type", type);
        upload.append("document_date", documentDate);
        upload.append("org_unit_code", orgUnitCode);
        upload.append("owner", owner);
        upload.append("file", file);

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
        <input id="code" name="code" placeholder={nextCode} defaultValue={nextCode} required />
      </div>
      <div className="field">
        <label htmlFor="title">Judul</label>
        <input id="title" name="title" placeholder="Kebijakan SPMI" required />
      </div>
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
        <label htmlFor="document_date">Tanggal Dokumen</label>
        <input id="document_date" name="document_date" type="date" required />
      </div>
      <div className="field">
        <label htmlFor="org_unit_code">Unit Pemilik</label>
        <select id="org_unit_code" name="org_unit_code" className="form-select" required defaultValue="">
          <option value="" disabled>Pilih unit</option>
          {catalog.orgUnits.map((unit) => (
            <option key={unit.code} value={unit.code}>{unit.name} · {unit.type}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="owner">Penanggung Jawab</label>
        <select id="owner" name="owner" className="form-select" required defaultValue="">
          <option value="" disabled>Pilih penanggung jawab</option>
          <option value="LPM">LPM</option>
          <option value="Fakultas">Fakultas</option>
          <option value="Program Studi">Program Studi</option>
          <option value="Unit Pendukung">Unit Pendukung</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="file">File</label>
        <input id="file" name="file" type="file" accept=".pdf,image/png,image/jpeg,image/webp" required />
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
