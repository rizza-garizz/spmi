"use client";

import { useState, type FormEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

type HrisEmployeeOption = {
  id: string;
  name: string;
};

type HrisPosition = {
  id?: string;
  title: string;
  unit: string;
  holder: string;
  period: string;
  status: string;
};

type HrisCompetency = {
  id?: string;
  employee: string;
  category: string;
  name: string;
  year: number;
  status: string;
};

type HrisDocument = {
  id?: string;
  employee: string;
  type: string;
  title: string;
  status: string;
  fileName?: string | null;
  filePath?: string | null;
  fileSize?: number;
};

type HrisPanelManagerProps = {
  employees: HrisEmployeeOption[];
  initialPositions: HrisPosition[];
  initialCompetencies: HrisCompetency[];
  initialDocuments: HrisDocument[];
};

function getPayload<T>(result: { data?: T } | T) {
  return result && typeof result === "object" && "data" in result && result.data ? result.data : result;
}

function EmployeeSelect({ id, name, employees }: { id: string; name: string; employees: HrisEmployeeOption[] }) {
  return (
    <select id={id} name={name} className="form-control" required>
      {employees.map((employee) => (
        <option value={employee.name} key={employee.id}>{employee.name}</option>
      ))}
      {employees.length === 0 ? <option value="">Belum ada pegawai</option> : null}
    </select>
  );
}

export function HrisPanelManager({
  employees,
  initialPositions,
  initialCompetencies,
  initialDocuments,
}: HrisPanelManagerProps) {
  const [positions, setPositions] = useState(initialPositions);
  const [competencies, setCompetencies] = useState(initialCompetencies);
  const [documents, setDocuments] = useState(initialDocuments);
  const [editingPosition, setEditingPosition] = useState<HrisPosition | null>(null);
  const [editingCompetency, setEditingCompetency] = useState<HrisCompetency | null>(null);
  const [editingDocument, setEditingDocument] = useState<HrisDocument | null>(null);
  const [message, setMessage] = useState("");

  async function submitRecord<T>(
    event: FormEvent<HTMLFormElement>,
    endpoint: string,
    method: "POST" | "PUT",
    onSaved: (item: T) => void,
    successMessage: string
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    if (!hasApiBaseUrl()) {
      setMessage("API belum dikonfigurasi. Data tidak ditulis agar tetap sinkron.");
      return;
    }

    try {
      const response = await clientApiRequest(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setMessage("Gagal menyimpan data HRIS ke backend.");
        return;
      }

      const result = (await response.json()) as { data?: T } | T;
      onSaved(getPayload(result) as T);
      setMessage(successMessage);
      dispatchAppEvent("spmi-data-changed");
      form.reset();
    } catch {
      setMessage("Gagal terhubung ke backend HRIS.");
    }
  }

  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);

    if (!hasApiBaseUrl()) {
      setMessage("API belum dikonfigurasi. Data tidak ditulis agar tetap sinkron.");
      return;
    }

    try {
      const response = await clientApiRequest(editingDocument ? `/hris/documents/${editingDocument.id}` : "/hris/documents", {
        method: editingDocument ? "PUT" : "POST",
        body: payload,
      });

      if (!response.ok) {
        setMessage("Gagal menyimpan dokumen SDM ke backend.");
        return;
      }

      const result = (await response.json()) as { data?: HrisDocument } | HrisDocument;
      const document = getPayload(result) as HrisDocument;
      setDocuments((current) => (
        editingDocument
          ? current.map((item) => (item.id === editingDocument.id ? document : item))
          : [document, ...current]
      ));
      setEditingDocument(null);
      setMessage(editingDocument ? "Dokumen SDM berhasil diperbarui di HRIS." : "Dokumen SDM berhasil disimpan ke HRIS.");
      dispatchAppEvent("spmi-data-changed");
      form.reset();
    } catch {
      setMessage("Gagal terhubung ke backend HRIS.");
    }
  }

  async function deleteRecord(endpoint: string, onDeleted: () => void, successMessage: string) {
    if (!window.confirm("Hapus data HRIS ini?")) {
      return;
    }

    if (!hasApiBaseUrl()) {
      setMessage("API belum dikonfigurasi. Data tidak dihapus agar tetap sinkron.");
      return;
    }

    try {
      const response = await clientApiRequest(endpoint, { method: "DELETE" });
      if (!response.ok) {
        setMessage("Gagal menghapus data HRIS dari backend.");
        return;
      }

      onDeleted();
      setMessage(successMessage);
      dispatchAppEvent("spmi-data-changed");
    } catch {
      setMessage("Gagal terhubung ke backend HRIS.");
    }
  }

  return (
    <>
      <div className="row">
        <div className="col-xl-4 col-xxl-4 col-lg-4" id="hris-jabatan">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">{editingPosition ? "Edit Jabatan" : "Input Jabatan"}</h4>
            </div>
            <div className="card-body">
              <form
                key={editingPosition?.id || "create-position"}
                onSubmit={(event) => submitRecord<HrisPosition>(
                  event,
                  editingPosition ? `/hris/positions/${editingPosition.id}` : "/hris/positions",
                  editingPosition ? "PUT" : "POST",
                  (item) => {
                    setPositions((current) => (
                      editingPosition
                        ? current.map((position) => (position.id === editingPosition.id ? item : position))
                        : [item, ...current]
                    ));
                    setEditingPosition(null);
                  },
                  editingPosition ? "Jabatan berhasil diperbarui di HRIS." : "Jabatan berhasil disimpan ke HRIS."
                )}
              >
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-position-title">Nama Jabatan</label>
                  <input id="hris-position-title" name="title" className="form-control" placeholder="Kaprodi / Dekan / Staff SDM" defaultValue={editingPosition?.title || ""} required />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-position-holder">Pejabat</label>
                  <select id="hris-position-holder" name="holder" className="form-control" defaultValue={editingPosition?.holder || employees[0]?.name || ""} required>
                    {employees.map((employee) => (
                      <option value={employee.name} key={employee.id}>{employee.name}</option>
                    ))}
                    {employees.length === 0 ? <option value="">Belum ada pegawai</option> : null}
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-position-unit">Unit</label>
                  <input id="hris-position-unit" name="unit" className="form-control" placeholder="Fakultas / Prodi / Biro" defaultValue={editingPosition?.unit || ""} required />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label" htmlFor="hris-position-period">Periode</label>
                      <input id="hris-position-period" name="period" className="form-control" placeholder="2025-2029" defaultValue={editingPosition?.period || ""} required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label" htmlFor="hris-position-status">Status</label>
                      <select id="hris-position-status" name="status" className="form-control" defaultValue={editingPosition?.status || "Aktif"}>
                        <option value="Aktif">Aktif</option>
                        <option value="Nonaktif">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary w-100" type="submit">{editingPosition ? "Update Jabatan" : "Simpan Jabatan"}</button>
                {editingPosition ? (
                  <button className="btn btn-light w-100 mt-2" type="button" onClick={() => setEditingPosition(null)}>Batal Edit</button>
                ) : null}
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-xxl-4 col-lg-4" id="hris-kompetensi">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">{editingCompetency ? "Edit Kompetensi" : "Input Kompetensi"}</h4>
            </div>
            <div className="card-body">
              <form
                key={editingCompetency?.id || "create-competency"}
                onSubmit={(event) => submitRecord<HrisCompetency>(
                  event,
                  editingCompetency ? `/hris/competencies/${editingCompetency.id}` : "/hris/competencies",
                  editingCompetency ? "PUT" : "POST",
                  (item) => {
                    setCompetencies((current) => (
                      editingCompetency
                        ? current.map((competency) => (competency.id === editingCompetency.id ? item : competency))
                        : [item, ...current]
                    ));
                    setEditingCompetency(null);
                  },
                  editingCompetency ? "Kompetensi berhasil diperbarui di HRIS." : "Kompetensi berhasil disimpan ke HRIS."
                )}
              >
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-competency-employee">Pegawai</label>
                  <select id="hris-competency-employee" name="employee" className="form-control" defaultValue={editingCompetency?.employee || employees[0]?.name || ""} required>
                    {employees.map((employee) => (
                      <option value={employee.name} key={employee.id}>{employee.name}</option>
                    ))}
                    {employees.length === 0 ? <option value="">Belum ada pegawai</option> : null}
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-competency-name">Nama Kompetensi</label>
                  <input id="hris-competency-name" name="name" className="form-control" placeholder="Sertifikasi Pendidik / OBE" defaultValue={editingCompetency?.name || ""} required />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label" htmlFor="hris-competency-category">Kategori</label>
                      <select id="hris-competency-category" name="category" className="form-control" defaultValue={editingCompetency?.category || "Sertifikasi"}>
                        <option value="Sertifikasi">Sertifikasi</option>
                        <option value="Pelatihan">Pelatihan</option>
                        <option value="Kompetensi">Kompetensi</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label" htmlFor="hris-competency-year">Tahun</label>
                      <input id="hris-competency-year" name="year" className="form-control" type="number" min="2000" placeholder="2026" defaultValue={editingCompetency?.year || ""} required />
                    </div>
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-competency-status">Status</label>
                  <select id="hris-competency-status" name="status" className="form-control" defaultValue={editingCompetency?.status || "Tervalidasi"}>
                    <option value="Tervalidasi">Tervalidasi</option>
                    <option value="Perlu Review">Perlu Review</option>
                    <option value="Kedaluwarsa">Kedaluwarsa</option>
                  </select>
                </div>
                <button className="btn btn-primary w-100" type="submit">{editingCompetency ? "Update Kompetensi" : "Simpan Kompetensi"}</button>
                {editingCompetency ? (
                  <button className="btn btn-light w-100 mt-2" type="button" onClick={() => setEditingCompetency(null)}>Batal Edit</button>
                ) : null}
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-xxl-4 col-lg-4" id="hris-dokumen">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">{editingDocument ? "Edit Dokumen" : "Input Dokumen"}</h4>
            </div>
            <div className="card-body">
              <form
                key={editingDocument?.id || "create-document"}
                onSubmit={submitDocument}
              >
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-document-employee">Pegawai</label>
                  <select id="hris-document-employee" name="employee" className="form-control" defaultValue={editingDocument?.employee || employees[0]?.name || ""} required>
                    {employees.map((employee) => (
                      <option value={employee.name} key={employee.id}>{employee.name}</option>
                    ))}
                    {employees.length === 0 ? <option value="">Belum ada pegawai</option> : null}
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-document-title">Judul Dokumen</label>
                  <input id="hris-document-title" name="title" className="form-control" placeholder="SK Kaprodi / Sertifikat Pendidik" defaultValue={editingDocument?.title || ""} required />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-document-type">Jenis Dokumen</label>
                  <select id="hris-document-type" name="type" className="form-control" defaultValue={editingDocument?.type || "SK Jabatan"}>
                    <option value="SK Jabatan">SK Jabatan</option>
                    <option value="Sertifikat">Sertifikat</option>
                    <option value="SK Pengangkatan">SK Pengangkatan</option>
                    <option value="Ijazah">Ijazah</option>
                    <option value="Surat Tugas">Surat Tugas</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-document-status">Status</label>
                  <select id="hris-document-status" name="status" className="form-control" defaultValue={editingDocument?.status || "Valid"}>
                    <option value="Valid">Valid</option>
                    <option value="Perlu Review">Perlu Review</option>
                    <option value="Kedaluwarsa">Kedaluwarsa</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="hris-document-file">File Eviden</label>
                  <input id="hris-document-file" name="file" className="form-control" type="file" />
                  {editingDocument?.fileName ? <p className="form-note mt-2">File saat ini: {editingDocument.fileName}</p> : null}
                </div>
                <button className="btn btn-primary w-100" type="submit">{editingDocument ? "Update Dokumen" : "Simpan Dokumen"}</button>
                {editingDocument ? (
                  <button className="btn btn-light w-100 mt-2" type="button" onClick={() => setEditingDocument(null)}>Batal Edit</button>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>

      {message ? <div className="alert alert-info">{message}</div> : null}

      <div className="row">
        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Jabatan Aktif</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                {positions.map((position) => (
                  <div className="list-group-item" key={position.id || `${position.title}-${position.holder}`}>
                    <strong>{position.title}</strong>
                    <div className="text-muted">{position.holder}</div>
                    <span className="badge badge-light mt-2">{position.unit} · {position.period}</span>
                    <div className="mt-2">
                      <button className="btn btn-sm btn-outline-secondary me-2" type="button" onClick={() => setEditingPosition(position)}>Edit</button>
                      {position.id ? (
                        <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteRecord(`/hris/positions/${position.id}`, () => setPositions((current) => current.filter((item) => item.id !== position.id)), "Jabatan berhasil dihapus dari HRIS.")}>Hapus</button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Kompetensi & Sertifikasi</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                {competencies.map((item) => (
                  <div className="list-group-item" key={item.id || `${item.employee}-${item.name}`}>
                    <strong>{item.name}</strong>
                    <div className="text-muted">{item.employee}</div>
                    <span className="badge badge-primary mt-2">{item.category} · {item.year} · {item.status}</span>
                    <div className="mt-2">
                      <button className="btn btn-sm btn-outline-secondary me-2" type="button" onClick={() => setEditingCompetency(item)}>Edit</button>
                      {item.id ? (
                        <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteRecord(`/hris/competencies/${item.id}`, () => setCompetencies((current) => current.filter((competency) => competency.id !== item.id)), "Kompetensi berhasil dihapus dari HRIS.")}>Hapus</button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Dokumen SDM</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                {documents.map((item) => (
                  <div className="list-group-item" key={item.id || `${item.employee}-${item.title}`}>
                    <strong>{item.title}</strong>
                    <div className="text-muted">{item.employee}</div>
                    <span className={`badge mt-2 ${item.status === "Valid" ? "badge-success" : "badge-warning"}`}>
                      {item.type} · {item.status}
                    </span>
                    {item.fileName ? <div className="text-muted mt-2" style={{ fontSize: "0.8rem" }}>File: {item.fileName}</div> : null}
                    <div className="mt-2">
                      <button className="btn btn-sm btn-outline-secondary me-2" type="button" onClick={() => setEditingDocument(item)}>Edit</button>
                      {item.id ? (
                        <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteRecord(`/hris/documents/${item.id}`, () => setDocuments((current) => current.filter((document) => document.id !== item.id)), "Dokumen SDM berhasil dihapus dari HRIS.")}>Hapus</button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
