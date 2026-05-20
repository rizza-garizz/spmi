"use client";

import { useState, type FormEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

type StandardPreviewItem = {
  id?: number;
  code: string;
  title: string;
  category: string;
  description: string;
};

type StandardCategory = {
  key: string;
  label: string;
};

export function CreateStandardForm({
  initialItems,
  categories,
}: {
  initialItems: StandardPreviewItem[];
  categories: StandardCategory[];
}) {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<StandardPreviewItem[]>(initialItems);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const title = String(formData.get("title") ?? "");
    const category = String(formData.get("category") ?? "");
    const code = String(formData.get("code") ?? "");
    const description = String(formData.get("description") ?? "");

    if (hasApiBaseUrl()) {
      try {
        const response = await clientApiRequest("/standards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            title,
            category,
            description,
          }),
        });

        if (response.ok) {
          const created = (await response.json()) as {
            id?: number;
            code?: string;
            title?: string;
            category?: string;
            description?: string;
            data?: {
              id?: number;
              code?: string;
              title?: string;
              category?: string;
              description?: string;
            };
          };
          const item = created.data ?? created;

          setItems((current) => [
            {
              id: item.id ?? Date.now(),
              code: item.code ?? code,
              title: item.title ?? title,
              category: item.category ?? category,
              description: item.description ?? description,
            },
            ...current,
          ]);
          setMessage("Standar berhasil disimpan ke backend.");
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
      <h3>Tambah Standar</h3>
      <div className="field">
        <label htmlFor="code">Kode</label>
        <input id="code" name="code" placeholder="STD-PEND-02" required />
      </div>
      <div className="field">
        <label htmlFor="title">Judul</label>
        <input id="title" name="title" placeholder="Standar Kurikulum" required />
      </div>
      <div className="field">
        <label htmlFor="category">Kategori</label>
        <select id="category" name="category" className="form-select">
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="description">Deskripsi</label>
        <input id="description" name="description" placeholder="Ringkasan standar" />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">
          Simpan
        </button>
      </div>
      {message ? <p className="form-note">{message}</p> : null}
      <div className="form-preview">
        <h4 className="form-preview-title">Preview daftar standar</h4>
        <div className="grid grid-2">
          {items.map((item) => (
            <div className="pill" key={item.code}>
              {item.code} ·
              {item.title} · {item.category}
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
