"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Aktif");
  const [unit, setUnit] = useState("Semua Unit");
  const [period, setPeriod] = useState("2026/2027");
  const [primaryText, setPrimaryText] = useState("");
  const [secondaryText, setSecondaryText] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>, message: string) {
    event.preventDefault();
    onDone(message);
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

  if (["identitas", "metadata"].includes(actionKey)) {
    return (
      <form className="module-action-form module-action-form-grid" onSubmit={(event) => handleSubmit(event, `${current.label} ${context} berhasil disimpan sebagai draft tervalidasi.`)}>
        <label>
          Kode
          <input value={primaryText} onChange={(event) => setPrimaryText(event.target.value)} placeholder="Kode otomatis/manual" />
        </label>
        <label>
          Nama
          <input value={secondaryText} onChange={(event) => setSecondaryText(event.target.value)} placeholder={`Nama ${context}`} />
        </label>
        <label>
          Penanggung jawab
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option>LPM</option>
            <option>Fakultas</option>
            <option>Prodi</option>
            <option>Unit</option>
          </select>
        </label>
        <button type="submit" className="module-action-primary"><i className="la la-save"></i>Simpan {current.label}</button>
      </form>
    );
  }

  if (actionKey === "lampiran") {
    return (
      <form className="module-action-form" onSubmit={(event) => handleSubmit(event, attachmentName ? `Lampiran ${attachmentName} siap diunggah untuk ${context}.` : "Pilih file lampiran terlebih dahulu.")}>
        <label>
          File lampiran
          <input type="file" onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? "")} />
        </label>
        <button type="submit" className="module-action-primary"><i className="la la-upload"></i>Upload Lampiran</button>
      </form>
    );
  }

  if (["draft", "review", "catatan-approval", "revisi"].includes(actionKey)) {
    return (
      <form className="module-action-form" onSubmit={(event) => handleSubmit(event, `${current.label} untuk ${context} berhasil disimpan.`)}>
        <label>
          Catatan
          <textarea value={primaryText} onChange={(event) => setPrimaryText(event.target.value)} placeholder={`Tulis catatan ${current.label.toLowerCase()}`} rows={4} />
        </label>
        <button type="submit" className="module-action-primary"><i className="la la-save"></i>Simpan {current.label}</button>
      </form>
    );
  }

  if (actionKey === "submit") {
    return (
      <form className="module-action-form" onSubmit={(event) => handleSubmit(event, `${context} berhasil dikirim ke workflow approval.`)}>
        <label className="module-action-check">
          <input type="checkbox" required />
          <span>Saya sudah memeriksa kelengkapan data dan lampiran.</span>
        </label>
        <button type="submit" className="module-action-primary"><i className="la la-paper-plane"></i>Submit ke Approval</button>
      </form>
    );
  }

  if (actionKey === "status-pengajuan") {
    return (
      <form className="module-action-form" onSubmit={(event) => handleSubmit(event, `Status ${context} diperbarui menjadi ${status}.`)}>
        <label>
          Status pengajuan
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>Draft</option>
            <option>Diajukan</option>
            <option>Direview</option>
            <option>Disetujui</option>
            <option>Perlu Revisi</option>
          </select>
        </label>
        <button type="submit" className="module-action-primary"><i className="la la-sync"></i>Update Status</button>
      </form>
    );
  }

  if (actionKey === "keputusan") {
    return (
      <form className="module-action-form module-action-form-grid" onSubmit={(event) => handleSubmit(event, `Keputusan ${status} untuk ${context} berhasil dicatat.`)}>
        <label>
          Keputusan
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>Setujui</option>
            <option>Minta Revisi</option>
            <option>Tolak</option>
          </select>
        </label>
        <label>
          Catatan
          <input value={primaryText} onChange={(event) => setPrimaryText(event.target.value)} placeholder="Catatan keputusan" />
        </label>
        <button type="submit" className="module-action-primary"><i className="la la-check-double"></i>Simpan Keputusan</button>
      </form>
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

  if (actionKey === "versi-aktif") {
    return (
      <div className="module-action-detail">
        <div className="module-action-version"><strong>Versi 1.1</strong><span>Aktif sejak 24 Mei 2026</span></div>
        <button type="button" className="module-action-primary" onClick={() => onDone(`Versi aktif ${context} berhasil dikonfirmasi.`)}><i className="la la-check"></i>Tetapkan Versi Aktif</button>
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

  if (!hash || !current || current.children?.length) {
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
