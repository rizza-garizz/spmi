"use client";

import { useMemo, useState, type FormEvent } from "react";
import { clientApiRequest, hasApiBaseUrl, parseApiPayload } from "@/lib/spmi-session-client";

type MigrationPreviewRow = {
  row_number: number;
  status: "ready" | "blocked";
  issues: string[];
  duplicate_in_system: boolean;
  duplicate_in_file: boolean;
  normalized: {
    code?: string;
    title: string;
    category: string;
    description?: string;
    status: string;
  };
};

type MigrationPreview = {
  file_name: string;
  entity: string;
  summary: {
    total_rows: number;
    ready_rows: number;
    blocked_rows: number;
    duplicate_rows: number;
    empty_rows: number;
    imported_rows?: number;
    updated_rows?: number;
    committed_rows?: number;
  };
  rows: MigrationPreviewRow[];
};

export function AoaMigrationForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"preview" | "commit" | null>(null);
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [strategy, setStrategy] = useState("skip_duplicates");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const readyCount = useMemo(() => preview?.summary.ready_rows ?? 0, [preview]);

  async function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!hasApiBaseUrl()) {
      setError("API backend belum terkonfigurasi untuk preview migrasi.");
      return;
    }

    if (!selectedFile) {
      setError("Pilih file AOA terlebih dahulu.");
      return;
    }

    setLoading("preview");
    try {
      const upload = new FormData();
      upload.append("entity", "standards");
      upload.append("file", selectedFile);

      const response = await clientApiRequest("/imports/aoa/preview", {
        method: "POST",
        body: upload,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Preview migrasi AOA gagal dibuat.");
      }

      setPreview(parseApiPayload<MigrationPreview | null>(payload, null));
      setMessage("Preview migrasi AOA siap ditinjau. Periksa baris yang diblok sebelum commit.");
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "Preview migrasi gagal dijalankan.");
    } finally {
      setLoading(null);
    }
  }

  async function handleCommit() {
    setError("");
    setMessage("");

    if (!hasApiBaseUrl()) {
      setError("API backend belum terkonfigurasi untuk commit migrasi.");
      return;
    }

    if (!selectedFile) {
      setError("File AOA harus tetap terpasang saat commit.");
      return;
    }

    if (!preview || readyCount === 0) {
      setError("Preview harus dibuat dan minimal ada satu baris siap commit.");
      return;
    }

    setLoading("commit");
    try {
      const upload = new FormData();
      upload.append("entity", "standards");
      upload.append("strategy", strategy);
      upload.append("file", selectedFile);

      const response = await clientApiRequest("/imports/aoa/commit", {
        method: "POST",
        body: upload,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Migrasi AOA gagal dijalankan.");
      }

      const result = parseApiPayload<MigrationPreview | null>(payload, null);
      setPreview(result);
      setMessage("Migrasi AOA berhasil diproses. Ringkasan commit sudah diperbarui.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Migrasi AOA gagal dijalankan.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="glass migration-panel">
      <div className="migration-panel-head">
        <div>
          <h3>Migrasi AOA Aman</h3>
          <p>
            Jalur ini memakai preview, validasi, dan deteksi duplikat sebelum data standar ditulis ke sistem.
          </p>
        </div>
        <span className="section-tag">Preview first</span>
      </div>

      <form onSubmit={handlePreview} className="migration-form">
        <div className="field">
          <label htmlFor="aoa-file">File AOA</label>
          <input
            id="aoa-file"
            name="file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="aoa-strategy">Strategi duplikat</label>
          <select
            id="aoa-strategy"
            className="form-select"
            value={strategy}
            onChange={(event) => setStrategy(event.target.value)}
          >
            <option value="skip_duplicates">Lewati duplikat yang sudah ada</option>
            <option value="overwrite_duplicates">Perbarui data duplikat yang sudah ada</option>
          </select>
        </div>

        <div className="form-actions">
          <button className="btn btn-outline-primary" type="submit" disabled={loading !== null}>
            {loading === "preview" ? "Membuat preview..." : "Preview Migrasi"}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={loading !== null || !preview || readyCount === 0}
            onClick={handleCommit}
          >
            {loading === "commit" ? "Menjalankan migrasi..." : "Commit Migrasi"}
          </button>
        </div>
      </form>

      {message ? <div className="alert alert-success mt-3">{message}</div> : null}
      {error ? <div className="alert alert-danger mt-3">{error}</div> : null}

      {preview ? (
        <div className="migration-preview">
          <div className="migration-stats grid grid-4">
            <div className="pill">Total baris: {preview.summary.total_rows}</div>
            <div className="pill">Siap commit: {preview.summary.ready_rows}</div>
            <div className="pill">Diblok: {preview.summary.blocked_rows}</div>
            <div className="pill">Duplikat: {preview.summary.duplicate_rows}</div>
          </div>

          <div className="table-responsive mt-3">
            <table className="table table-bordered table-responsive-sm">
              <thead>
                <tr>
                  <th>Baris</th>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Validasi</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 12).map((row) => (
                  <tr key={`${row.row_number}-${row.normalized.title}`}>
                    <td>{row.row_number}</td>
                    <td>{row.normalized.title || "-"}</td>
                    <td>{row.normalized.category || "-"}</td>
                    <td>
                      <span className={`badge badge-${row.status === "ready" ? "success" : "danger"}`}>
                        {row.status === "ready" ? "READY" : "BLOCKED"}
                      </span>
                    </td>
                    <td>{row.issues.length > 0 ? row.issues.join(" ") : "Siap dimigrasikan."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.rows.length > 12 ? (
            <p className="form-note mt-2">
              Menampilkan 12 baris pertama. Gunakan preview ini untuk cek kualitas file sebelum commit.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
