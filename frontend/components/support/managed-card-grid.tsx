"use client";

import { useMemo, useState } from "react";
import { NilaiCardGrid, type NilaiCardItem } from "@/components/nilai/core";

type ManagedCardGridProps = {
  items: NilaiCardItem[];
  columns?: 2 | 3 | 4;
  exportName: string;
  searchPlaceholder?: string;
};

export function ManagedCardGrid({ items, columns = 3, exportName, searchPlaceholder = "Cari data..." }: ManagedCardGridProps) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const filtered = useMemo(() => {
    return items.filter((item) => [item.title, ...(item.lines || [])].join(" ").toLowerCase().includes(query.toLowerCase()));
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function exportCsv() {
    const rows = [
      ["Judul", "Keterangan"],
      ...filtered.map((item) => [item.title, (item.lines || []).join(" | ")]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="row mb-3">
        <div className="col-md-8 mb-2 mb-md-0">
          <input
            className="form-control"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="col-md-2 mb-2 mb-md-0">
          <button className="btn btn-light w-100" type="button" onClick={() => { setQuery(""); setCurrentPage(1); }}>
            Reset
          </button>
        </div>
        <div className="col-md-2">
          <button className="btn btn-outline-primary w-100" type="button" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>
      <NilaiCardGrid columns={columns} items={paginated} />
      <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
        <small className="text-muted">Menampilkan {paginated.length} dari {filtered.length} data</small>
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
  );
}
