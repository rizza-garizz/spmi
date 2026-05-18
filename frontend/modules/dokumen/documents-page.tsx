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
  current_version: string;
  versions: Array<{
    id: number;
    version_number: number;
    file_name: string;
    file_path: string;
    file_size: number;
    created_at: string;
  }>;
}

export function DocumentsPage() {
  const { showToast } = useToast();
  const roles = useCurrentRoles();
  const canUpload = hasRoleAccess(["admin_lpm", "kaprodi", "sekprodi", "unit_kerja"], roles);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    type: "kebijakan",
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

  useEffect(() => {
    fetchDocuments();
  }, []);

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
    data.append("file", selectedFile);
    if (formData.mutu_standard_id) data.append("mutu_standard_id", formData.mutu_standard_id);

    try {
      const res = await clientApiRequest("/documents", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        showToast("Dokumen berhasil diunggah!");
        setFormData({ code: "", title: "", type: "kebijakan", mutu_standard_id: "" });
        setSelectedFile(null);
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
      const res = await clientApiRequest(`/documents/versions/${versionId}`);
      const json = await res.json();
      const downloadUrl = json.data?.download_url || json.download_url;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
      }
    } catch (err) {
      alert("Gagal mengunduh file.");
    }
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

      <div className="row">
        {/* Form Upload */}
        {canUpload ? (
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
                      <option value="kebijakan">Kebijakan</option>
                      <option value="manual">Manual</option>
                      <option value="standar">Standar</option>
                      <option value="sop">SOP</option>
                      <option value="laporan_ami">Laporan AMI</option>
                      <option value="laporan_rtm">Laporan RTM</option>
                      <option value="bukti">Bukti Pelaksanaan</option>
                    </select>
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
        <div className={canUpload ? "col-xl-8 col-lg-7" : "col-xl-12 col-lg-12"}>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Daftar Repository</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-responsive-sm">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Judul</th>
                      <th>Tipe</th>
                      <th>Versi</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center">Memuat...</td></tr>
                    ) : documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.code}</td>
                        <td>{doc.title}</td>
                        <td><span className="badge badge-outline-primary">{doc.type}</span></td>
                        <td>v{doc.current_version}</td>
                        <td>
                          <button 
                            className="btn btn-xs btn-info"
                            onClick={() => handleDownload(doc.versions[0]?.id, doc.title)}
                          >
                            <i className="la la-download"></i> Unduh
                          </button>
                        </td>
                      </tr>
                    ))}
                    {documents.length === 0 && !loading && (
                      <tr><td colSpan={5} className="text-center text-muted">Belum ada dokumen.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
