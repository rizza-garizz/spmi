"use client";

import { useEffect, useState } from "react";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { useToast } from "@/components/support/Toast";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

interface Document {
  id: number;
  code: string;
  title: string;
  type: string;
  status: string;
  org_unit_code?: string;
  document_date?: string;
  category?: string;
  owner?: string;
  metadata?: {
    tanggal?: string;
    unit?: string;
    kategori?: string;
    penanggung_jawab?: string;
  };
  current_version: string;
  versions: Array<{
    id: number;
    version_number: number;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type?: string | null;
    created_at: string;
  }>;
}

export function DocumentsPage() {
  const { showToast } = useToast();
  const roles = useCurrentRoles();
  const canUpload = hasRoleAccess(["admin_lpm", "kaprodi", "sekprodi", "unit_kerja"], roles);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    type: "kebijakan",
    document_date: "",
    category: "",
    owner: "",
    mutu_standard_id: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await clientApiRequest("/documents");
      const json = await res.json();
      setDocuments(parseApiPayload(json, []));
    } catch (err) {
      console.error("Gagal memuat dokumen", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await clientApiRequest("/catalog");
      const json = await res.json();
      const catalog = parseApiPayload(json, { documentTypes: [] as Array<{ value: string; label: string }> });
      setDocumentTypes(catalog.documentTypes ?? []);
    } catch (err) {
      console.error("Gagal memuat katalog dokumen", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCatalog();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast("Silakan pilih file terlebih dahulu.", "danger");
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append("code", formData.code);
    data.append("title", formData.title);
    data.append("type", formData.type);
    data.append("document_date", formData.document_date);
    data.append("category", formData.category || formData.type);
    data.append("owner", formData.owner);
    data.append("file", selectedFile);
    if (formData.mutu_standard_id) data.append("mutu_standard_id", formData.mutu_standard_id);

    try {
      const res = await clientApiRequest("/documents", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        showToast("Dokumen berhasil diunggah!");
        setFormData({ code: "", title: "", type: "kebijakan", document_date: "", category: "", owner: "", mutu_standard_id: "" });
        setSelectedFile(null);
        setShowUploadForm(false);
        fetchDocuments();
      } else {
        const errJson = await res.json();
        showToast(errJson.message || "Gagal mengunggah dokumen.", "danger");
      }
    } catch (err) {
      showToast("Koneksi ke server terputus.", "danger");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (versionId: number, fileName: string) => {
    try {
      const res = await clientApiRequest(`/documents/versions/${versionId}/download`);
      const json = await res.json();
      const downloadUrl = json.data?.download_url || json.download_url;
      if (downloadUrl) {
        const url = downloadUrl.startsWith("http") ? downloadUrl : `${API_URL}${downloadUrl}`;
        window.open(url, "_blank");
      } else {
        showToast(`Metadata unduhan ${fileName} belum tersedia.`, "warning");
      }
    } catch (err) {
      showToast("Gagal mengunduh file.", "danger");
    }
  };

  const handlePreview = async (versionId: number) => {
    try {
      const res = await clientApiRequest(`/documents/versions/${versionId}/preview`);
      const json = await res.json();
      const previewUrl = json.data?.preview_url;
      if (previewUrl) {
        const url = previewUrl.startsWith("http") ? previewUrl : `${API_URL}${previewUrl}`;
        window.open(url, "_blank");
      }
    } catch (err) {
      showToast("Gagal membuka preview file.", "danger");
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const haystack = [
      doc.code,
      doc.title,
      doc.type,
      doc.category,
      doc.owner,
      doc.org_unit_code,
      doc.metadata?.unit,
      doc.metadata?.kategori,
      doc.metadata?.penanggung_jawab,
    ].join(" ").toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCsv = () => {
    const rows = [
      ["Kode", "Judul", "Tipe", "Tanggal", "Kategori", "Penanggung Jawab", "Unit", "Versi"],
      ...filteredDocuments.map((doc) => [
        doc.code,
        doc.title,
        doc.type,
        doc.metadata?.tanggal || doc.document_date || "",
        doc.metadata?.kategori || doc.category || "",
        doc.metadata?.penanggung_jawab || doc.owner || "",
        doc.metadata?.unit || doc.org_unit_code || "",
        `v${doc.current_version}`,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "repository-dokumen-spmi.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Repository Dokumen SPMI</h4>
            <p className="mb-0">Pusat data Kebijakan, Pedoman, Standar, dan Bukti Pelaksanaan PPEPP.</p>
          </div>
        </div>
      </div>

      {canUpload ? (
        <div className="hris-page-toolbar">
          <div>
            <span>Repository</span>
            <strong>Kelola Dokumen SPMI</strong>
            <p>Daftar repository menjadi fokus utama. Upload dokumen baru dibuka saat diperlukan.</p>
          </div>
          <div className="hris-toolbar-actions">
            <button className="btn btn-outline-primary" type="button" onClick={exportCsv}>
              <i className="la la-file-excel-o me-1"></i> Export CSV
            </button>
            <button
              className={showUploadForm ? "btn btn-light" : "btn btn-primary"}
              type="button"
              onClick={() => setShowUploadForm((current) => !current)}
            >
              {showUploadForm ? "Tutup Form" : "Upload Dokumen"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="row">
        {/* Form Upload */}
        {canUpload && showUploadForm ? (
          <div className="col-xl-4 col-lg-5">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Upload Dokumen Baru</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleUpload}>
                  <div className="form-group mb-3">
                    <label className="form-label">Kode Dokumen</label>
                    <input 
                      type="text" className="form-control" placeholder="DOC-001" 
                      value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required 
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-label">Judul Dokumen</label>
                    <input 
                      type="text" className="form-control" placeholder="Kebijakan Mutu" 
                      value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required 
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-label">Tipe</label>
                    <select 
                      className="form-control" 
                      value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      {documentTypes.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-label">Tanggal Dokumen</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.document_date}
                      onChange={(e) => setFormData({...formData, document_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-label">Kategori</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="AMI / PPEPP / Standar"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-label">Penanggung Jawab</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="LPM / Prodi / Unit"
                      value={formData.owner}
                      onChange={(e) => setFormData({...formData, owner: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-label">File (PDF/Gambar)</label>
                    <input 
                      type="file" className="form-control" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={uploading}>
                    {uploading ? "Mengunggah..." : "Simpan Dokumen"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tabel List */}
        <div className={canUpload && showUploadForm ? "col-xl-8 col-lg-7" : "col-xl-12 col-lg-12"}>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Daftar Repository</h4>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-7 mb-2 mb-md-0">
                  <input
                    className="form-control"
                    placeholder="Cari kode, judul, unit, kategori, atau penanggung jawab..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-2 mb-md-0">
                  <select className="form-control" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                    <option value="">Semua tipe</option>
                    {documentTypes.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-light w-100" type="button" onClick={() => { setSearchTerm(""); setTypeFilter(""); }}>
                    Reset
                  </button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-responsive-sm">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Judul</th>
                      <th>Tipe</th>
                      <th>Metadata</th>
                      <th>Versi</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center">Memuat...</td></tr>
                    ) : paginatedDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.code}</td>
                        <td>
                          <strong>{doc.title}</strong>
                          <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>
                            Unit: {doc.metadata?.unit || doc.org_unit_code || "-"}
                          </p>
                        </td>
                        <td><span className="badge badge-outline-primary">{doc.type}</span></td>
                        <td>
                          <div style={{ fontSize: "0.82rem" }}>
                            <div>Tgl: {doc.metadata?.tanggal || doc.document_date || "-"}</div>
                            <div>Kategori: {doc.metadata?.kategori || doc.category || "-"}</div>
                            <div>PJ: {doc.metadata?.penanggung_jawab || doc.owner || "-"}</div>
                          </div>
                        </td>
                        <td>v{doc.current_version}</td>
                        <td>
                          <button 
                            className="btn btn-xs btn-outline-primary me-2"
                            onClick={() => handlePreview(doc.versions[0]?.id)}
                            disabled={!doc.versions[0]?.id}
                          >
                            <i className="la la-eye"></i> Preview
                          </button>
                          <button 
                            className="btn btn-xs btn-info"
                            onClick={() => handleDownload(doc.versions[0]?.id, doc.title)}
                            disabled={!doc.versions[0]?.id}
                          >
                            <i className="la la-download"></i> Unduh
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDocuments.length === 0 && !loading && (
                      <tr><td colSpan={6} className="text-center text-muted">Belum ada dokumen.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <small className="text-muted">
                  Menampilkan {paginatedDocuments.length} dari {filteredDocuments.length} dokumen
                </small>
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
        </div>
      </div>
    </>
  );
}
