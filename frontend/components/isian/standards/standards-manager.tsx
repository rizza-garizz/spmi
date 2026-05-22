"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { useToast } from "@/components/support/Toast";
import { clientApiRequest, dispatchAppEvent } from "@/lib/spmi-session-client";

type StandardCategory = {
  key: string;
  label: string;
  scope: string;
};

type Standard = {
  id?: string | number;
  code?: string;
  title: string;
  category: string;
  description?: string;
  version?: string;
  revisions?: Array<unknown>;
};

type StandardsManagerProps = {
  initialItems: Standard[];
  categories: StandardCategory[];
};

export function StandardsManager({ initialItems, categories }: StandardsManagerProps) {
  const { showToast } = useToast();
  const safeCategories = Array.isArray(categories) ? categories : [];
  const [items, setItems] = useState<Standard[]>(Array.isArray(initialItems) ? initialItems : []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState<Standard | null>(null);
  const pageSize = 10;

  useEffect(() => {
    setItems(Array.isArray(initialItems) ? initialItems : []);
  }, [initialItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, category]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const haystack = [item.code, item.title, item.category, item.description].join(" ").toLowerCase();
      return haystack.includes(query.toLowerCase()) && (!category || item.category === category);
    });
  }, [items, query, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing?.id) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") || ""),
      category: String(formData.get("category") || ""),
      description: String(formData.get("description") || ""),
      revision_note: String(formData.get("revision_note") || "Update dari halaman standar"),
    };

    const response = await clientApiRequest(`/standards/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      showToast(result.message || "Gagal memperbarui standar.", "danger");
      return;
    }

    setItems((current) => current.map((item) => String(item.id) === String(editing.id) ? result.data : item));
    setEditing(null);
    dispatchAppEvent("spmi-data-changed");
    showToast("Standar berhasil diperbarui.");
  }

  async function handleDelete(item: Standard) {
    if (!item.id || !window.confirm(`Nonaktifkan standar ${item.code || item.title}?`)) return;
    const response = await clientApiRequest(`/standards/${item.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok || !result.success) {
      showToast(result.message || "Gagal menghapus standar.", "danger");
      return;
    }

    setItems((current) => current.filter((row) => String(row.id) !== String(item.id)));
    dispatchAppEvent("spmi-data-changed");
    showToast("Standar berhasil dinonaktifkan.");
  }

  function exportCsv() {
    const rows = [
      ["Kode", "Judul", "Kategori", "Versi", "Jumlah Revisi"],
      ...filtered.map((item) => [
        item.code || "",
        item.title,
        item.category,
        item.version || "1.0",
        String(item.revisions?.length || 0),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "standar-mutu.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="card-title mb-0">Daftar Standar Mutu Tersedia</h4>
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={exportCsv}>
            <i className="la la-file-excel-o me-1"></i> Export CSV
          </button>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-7 mb-2 mb-md-0">
              <input className="form-control" placeholder="Cari kode, judul, kategori, atau deskripsi..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="col-md-3 mb-2 mb-md-0">
              <select className="form-control" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Semua kategori</option>
                {safeCategories.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-light w-100" type="button" onClick={() => { setQuery(""); setCategory(""); }}>
                Reset
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered verticle-middle table-responsive-sm">
              <thead>
                <tr>
                  <th scope="col">Kode</th>
                  <th scope="col">Judul Standar</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Versi</th>
                  <th scope="col">Revisi</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((standard) => (
                  <tr key={standard.id || standard.code}>
                    <td><strong>{standard.code ?? "-"}</strong></td>
                    <td>
                      {standard.title}
                      {standard.description && <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>{standard.description}</p>}
                    </td>
                    <td><span className="badge badge-primary">{standard.category}</span></td>
                    <td><span className="badge badge-light">v{standard.version ?? "1.0"}</span></td>
                    <td>{standard.revisions?.length ?? 0} catatan</td>
                    <td>
                      <RoleGate allowedRoles={["admin_lpm"]} fallback={<span className="text-muted">Read only</span>}>
                        <button className="btn btn-xs btn-outline-secondary me-2" type="button" onClick={() => setEditing(standard)}>
                          <i className="fa fa-pencil color-muted"></i> Edit
                        </button>
                        <button className="btn btn-xs btn-outline-danger" type="button" onClick={() => handleDelete(standard)}>
                          <i className="fa fa-close color-danger"></i> Hapus
                        </button>
                      </RoleGate>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted">Tidak ada standar sesuai pencarian.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
            <small className="text-muted">Menampilkan {paginated.length} dari {filtered.length} standar</small>
            <div>
              <button className="btn btn-sm btn-light me-2" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                Sebelumnya
              </button>
              <span className="text-muted small">Halaman {currentPage} / {totalPages}</span>
              <button className="btn btn-sm btn-light ms-2" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="card mt-4 border-primary">
          <div className="card-header">
            <h4 className="card-title">Edit Standar: {editing.code || editing.title}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdate}>
              <div className="row">
                <div className="col-md-5">
                  <div className="form-group mb-3">
                    <label className="form-label">Judul Standar</label>
                    <input className="form-control" name="title" defaultValue={editing.title} required />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group mb-3">
                    <label className="form-label">Kategori</label>
                    <select className="form-control" name="category" defaultValue={editing.category} required>
                      {safeCategories.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Catatan Revisi</label>
                    <input className="form-control" name="revision_note" placeholder="Ringkasan perubahan" />
                  </div>
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-control" name="description" rows={3} defaultValue={editing.description || ""} />
              </div>
              <div className="d-flex justify-content-end">
                <button className="btn btn-light me-2" type="button" onClick={() => setEditing(null)}>Batal</button>
                <button className="btn btn-primary" type="submit">Update Standar</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
