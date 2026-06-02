"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { findModuleTrail, type ModuleNode } from "@/lib/module-registry";

function getNodeLabel(node: ModuleNode | undefined) {
  return node?.shortLabel ?? node?.label ?? "";
}

function getActionKey(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "dan");
}

function downloadCsv(fileName: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

type ActionWorkspaceProps = {
  current: ModuleNode;
  parent?: ModuleNode;
  root?: ModuleNode;
  onDone: (message: string) => void;
};

function ActionWorkspaceBody({ current, parent, root, onDone }: ActionWorkspaceProps) {
  const actionKey = getActionKey(current.label);
  const context = parent?.label ?? root?.label ?? "Modul";
  const persistRequiredActions = new Set([
    "identitas",
    "metadata",
    "lampiran",
    "draft",
    "submit",
    "status-pengajuan",
    "review",
    "keputusan",
    "catatan-approval",
    "revisi",
    "versi-aktif",
  ]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Aktif");
  const [unit, setUnit] = useState("Semua Unit");
  const [period, setPeriod] = useState("2026/2027");

  function handleSubmit(event: FormEvent<HTMLFormElement>, message: string) {
    event.preventDefault();
    onDone(message);
  }

  if (persistRequiredActions.has(actionKey)) {
    return (
      <div className="module-action-detail">
        <p>
          Aksi {current.label} membutuhkan record aktif agar perubahan tersimpan ke API. Buka modul operasional parent untuk memilih atau membuat data terlebih dahulu.
        </p>
        <a href={parent?.href ?? root?.href ?? current.href} className="module-action-primary">
          <i className="la la-arrow-right"></i>Buka Modul Operasional
        </a>
      </div>
    );
  }

  if (actionKey === "pencarian") {
    return (
      <form className="module-action-form" onSubmit={(event) => handleSubmit(event, `Pencarian "${query || "semua data"}" pada ${context} berhasil dijalankan.`)}>
        <label>
          Kata kunci
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kode, nama, unit, atau status" />
        </label>
        <button type="submit" className="module-action-primary"><i className="la la-search"></i>Cari Data</button>
      </form>
    );
  }

  if (actionKey === "filter") {
    return (
      <form className="module-action-form module-action-form-grid" onSubmit={(event) => handleSubmit(event, `Filter ${context} diterapkan: ${status}, ${unit}, ${period}.`)}>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>Aktif</option>
            <option>Draft</option>
            <option>Menunggu Review</option>
            <option>Perlu Revisi</option>
            <option>Terverifikasi</option>
          </select>
        </label>
        <label>
          Unit
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option>Semua Unit</option>
            <option>LPM</option>
            <option>Fakultas Ilmu Komputer</option>
            <option>Program Studi Sistem Informasi</option>
            <option>Unit Pendukung</option>
          </select>
        </label>
        <label>
          Periode
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option>2026/2027</option>
            <option>2025/2026</option>
            <option>2024/2025</option>
          </select>
        </label>
        <button type="submit" className="module-action-primary"><i className="la la-filter"></i>Terapkan Filter</button>
      </form>
    );
  }

  if (actionKey === "detail-data") {
    return (
      <div className="module-action-detail">
        <dl>
          <div><dt>Parent</dt><dd>{context}</dd></div>
          <div><dt>Status</dt><dd>Terverifikasi</dd></div>
          <div><dt>Unit</dt><dd>Universitas Junrejo Indah</dd></div>
          <div><dt>Terakhir update</dt><dd>24 Mei 2026</dd></div>
        </dl>
        <a href={parent?.href ?? current.href} className="module-action-secondary"><i className="la la-eye"></i>Buka Detail Parent</a>
      </div>
    );
  }

  if (actionKey === "aktivitas") {
    return (
      <div className="module-action-timeline">
        <div><span>09:00</span><strong>Data dibuka oleh Admin LPM</strong></div>
        <div><span>10:15</span><strong>Validasi awal selesai</strong></div>
        <div><span>11:20</span><strong>Menunggu review pimpinan unit</strong></div>
        <button type="button" className="module-action-secondary" onClick={() => onDone(`Aktivitas terbaru ${context} berhasil dimuat ulang.`)}><i className="la la-redo"></i>Refresh Aktivitas</button>
      </div>
    );
  }

  if (actionKey === "perubahan-field") {
    return (
      <div className="module-action-table-wrap">
        <table className="module-action-table">
          <thead><tr><th>Field</th><th>Sebelum</th><th>Sesudah</th></tr></thead>
          <tbody>
            <tr><td>Status</td><td>Draft</td><td>Terverifikasi</td></tr>
            <tr><td>Unit</td><td>Prodi</td><td>Fakultas</td></tr>
            <tr><td>Versi</td><td>1.0</td><td>1.1</td></tr>
          </tbody>
        </table>
        <button type="button" className="module-action-secondary" onClick={() => downloadCsv("perubahan-field.csv", [["Field", "Sebelum", "Sesudah"], ["Status", "Draft", "Terverifikasi"], ["Unit", "Prodi", "Fakultas"]])}><i className="la la-file-export"></i>Export Perubahan</button>
      </div>
    );
  }

  if (actionKey === "export-log") {
    return (
      <div className="module-action-detail">
        <p>Log aktivitas siap diekspor untuk audit trail dan kebutuhan pemeriksaan mutu.</p>
        <button type="button" className="module-action-primary" onClick={() => downloadCsv("audit-log.csv", [["Waktu", "Aktor", "Aktivitas"], ["2026-05-24 09:00", "Admin LPM", `Membuka ${context}`], ["2026-05-24 10:15", "Auditor", "Validasi data"]])}><i className="la la-download"></i>Download CSV</button>
      </div>
    );
  }

  if (actionKey === "perbandingan") {
    return (
      <form className="module-action-form module-action-form-grid" onSubmit={(event) => handleSubmit(event, `Perbandingan versi ${context} berhasil ditampilkan.`)}>
        <label>
          Versi A
          <select><option>Versi 1.0</option><option>Versi 1.1</option></select>
        </label>
        <label>
          Versi B
          <select><option>Versi 1.1</option><option>Versi 1.0</option></select>
        </label>
        <button type="submit" className="module-action-primary"><i className="la la-columns"></i>Bandingkan</button>
      </form>
    );
  }

  return (
    <div className="module-action-detail">
      <p>{current.description || `Aksi ${current.label} untuk ${context}.`}</p>
      <button type="button" className="module-action-primary" onClick={() => onDone(`${current.label} pada ${context} berhasil diproses.`)}>
        <i className={`la ${current.icon}`}></i>Proses {current.label}
      </button>
    </div>
  );
}

export function ModuleActionWorkspace() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [message, setMessage] = useState("");
  const roles = useCurrentRoles();

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
      setMessage("");
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const trail = useMemo(() => findModuleTrail(`${pathname}${hash}`), [pathname, hash]);
  const current = trail[trail.length - 1];
  const parent = trail[trail.length - 2];
  const root = trail[0];

  if (!hash || !current || current.children?.length || !hasRoleAccess(current.roles, roles)) {
    return null;
  }

  return (
    <section className="module-action-workspace" aria-label={`Workspace ${current.label}`}>
      <div className="module-action-head">
        <div>
          <div className="module-action-context">
            {trail.slice(0, -1).map((node, index) => (
              <span key={node.id}>
                {index > 0 ? <i className="la la-angle-right"></i> : null}
                <a href={node.href}>{getNodeLabel(node)}</a>
              </span>
            ))}
          </div>
          <h3>{current.label}</h3>
          <p>{current.description}</p>
        </div>
        {parent ? (
          <a className="module-action-back" href={parent.href}>
            <i className="la la-angle-left"></i>
            Kembali ke {getNodeLabel(parent)}
          </a>
        ) : null}
      </div>
      <div className="module-action-grid">
        <div className="module-action-card">
          <ActionWorkspaceBody current={current} parent={parent} root={root} onDone={setMessage} />
          {message ? <div className="module-action-message" role="status"><i className="la la-check-circle"></i>{message}</div> : null}
        </div>
        <aside className="module-action-card module-action-side">
          <strong>Status Workspace</strong>
          <span>Aktif</span>
          <p>Panel ini mengikuti item leaf yang dipilih, jadi tombol hash tidak lagi berhenti sebagai navigasi kosong.</p>
        </aside>
      </div>
    </section>
  );
}
