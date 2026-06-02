"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";
import { useSpmiCatalogOptions } from "@/lib/use-spmi-catalog-options";

type HrisEmployee = {
  id: string;
  name: string;
  employeeNumber: string;
  nidn: string;
  type: string;
  status: string;
  unit: string;
  position: string;
  functionalPosition: string;
  education: string;
  email: string;
};

export function HrisEmployeeManager({ initialEmployees }: { initialEmployees: HrisEmployee[] }) {
  const [employees, setEmployees] = useState(Array.isArray(initialEmployees) ? initialEmployees : []);
  const catalog = useSpmiCatalogOptions();
  const [editingEmployee, setEditingEmployee] = useState<HrisEmployee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const typeOptions = useMemo(() => Array.from(new Set(employees.map((employee) => employee.type).filter(Boolean))).sort(), [employees]);
  const statusOptions = useMemo(() => Array.from(new Set(employees.map((employee) => employee.status).filter(Boolean))).sort(), [employees]);
  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const haystack = [
      employee.name,
      employee.email,
      employee.employeeNumber,
      employee.nidn,
      employee.type,
      employee.status,
      employee.unit,
      employee.position,
      employee.functionalPosition,
    ].join(" ").toLowerCase();
    return (
      haystack.includes(searchTerm.toLowerCase()) &&
      (!typeFilter || employee.type === typeFilter) &&
      (!statusFilter || employee.status === statusFilter)
    );
  }), [employees, searchTerm, statusFilter, typeFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = useMemo(() => filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize), [currentPage, filteredEmployees]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function resetFilters() {
    setSearchTerm("");
    setTypeFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  }

  function exportCsv() {
    if (filteredEmployees.length === 0) {
      setMessage("Tidak ada data pegawai untuk diekspor.");
      return;
    }

    const rows = [
      ["Nama", "NIP", "NIDN", "Email", "Tipe", "Status", "Unit", "Jabatan", "Jabatan Fungsional", "Pendidikan"],
      ...filteredEmployees.map((employee) => [
        employee.name,
        employee.employeeNumber,
        employee.nidn,
        employee.email,
        employee.type,
        employee.status,
        employee.unit,
        employee.position,
        employee.functionalPosition,
        employee.education,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "master-pegawai-hris.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      employeeNumber: String(formData.get("employeeNumber") || ""),
      nidn: String(formData.get("nidn") || ""),
      type: String(formData.get("type") || "Dosen"),
      status: String(formData.get("status") || "Aktif"),
      unit: String(formData.get("unit") || ""),
      position: String(formData.get("position") || ""),
      functionalPosition: String(formData.get("functionalPosition") || ""),
      education: String(formData.get("education") || ""),
      email: String(formData.get("email") || ""),
    };

    if (!payload.name.trim() || !payload.employeeNumber.trim() || !payload.email.trim() || !payload.unit || !payload.position.trim()) {
      setMessage("Nama, NIP, email, unit/homebase, dan jabatan wajib lengkap.");
      return;
    }
    const duplicateEmployee = employees.some((employee) =>
      employee.id !== editingEmployee?.id &&
      (employee.employeeNumber.toLowerCase() === payload.employeeNumber.toLowerCase() ||
        employee.email.toLowerCase() === payload.email.toLowerCase())
    );
    if (duplicateEmployee) {
      setMessage("NIP atau email sudah digunakan pegawai lain.");
      return;
    }

    if (!hasApiBaseUrl()) {
      setMessage("API belum dikonfigurasi. Data tidak ditulis agar tetap sinkron.");
      return;
    }

    try {
      const response = await clientApiRequest(editingEmployee ? `/hris/employees/${editingEmployee.id}` : "/hris/employees", {
        method: editingEmployee ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setMessage("Gagal menyimpan pegawai ke backend.");
        return;
      }

      const result = (await response.json()) as { data?: HrisEmployee } | HrisEmployee;
      const employee = "data" in result && result.data ? result.data : result;
      setEmployees((current) => (
        editingEmployee
          ? current.map((item) => (item.id === editingEmployee.id ? employee as HrisEmployee : item))
          : [employee as HrisEmployee, ...current]
      ));
      setMessage(editingEmployee ? "Pegawai berhasil diperbarui di backend HRIS." : "Pegawai berhasil disimpan ke backend HRIS.");
      setEditingEmployee(null);
      setShowForm(false);
      dispatchAppEvent("spmi-data-changed");
      form.reset();
    } catch {
      setMessage("Gagal terhubung ke backend HRIS.");
    }
  }

  async function handleDelete(employee: HrisEmployee) {
    if (!window.confirm(`Hapus ${employee.name} beserta relasi HRIS-nya?`)) {
      return;
    }

    if (!hasApiBaseUrl()) {
      setMessage("API belum dikonfigurasi. Data tidak dihapus agar tetap sinkron.");
      return;
    }

    try {
      const response = await clientApiRequest(`/hris/employees/${employee.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setMessage("Gagal menghapus pegawai dari backend.");
        return;
      }

      setEmployees((current) => current.filter((item) => item.id !== employee.id));
      setMessage("Pegawai berhasil dihapus dari backend HRIS.");
      dispatchAppEvent("spmi-data-changed");
      if (editingEmployee?.id === employee.id) {
        setEditingEmployee(null);
      }
    } catch {
      setMessage("Gagal terhubung ke backend HRIS.");
    }
  }

  return (
    <div className="row">
      <div className="col-xl-12">
        <div className="hris-page-toolbar">
          <div>
            <span>Area Kerja</span>
            <strong>Master Pegawai</strong>
            <p>Kelola data pegawai dari satu tabel. Form hanya muncul saat dibutuhkan.</p>
          </div>
          <div className="hris-toolbar-actions">
            <button className="btn btn-outline-primary" type="button" onClick={exportCsv} disabled={filteredEmployees.length === 0}>
              <i className="la la-file-excel-o me-1"></i> Export CSV
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setEditingEmployee(null);
                setMessage("");
                setShowForm((current) => !current);
              }}
            >
              {showForm ? "Tutup Form" : "Tambah Pegawai"}
            </button>
          </div>
        </div>
      </div>

      {showForm || editingEmployee ? <div className="col-xl-4 col-xxl-4 col-lg-5">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">{editingEmployee ? "Edit Pegawai" : "Tambah Pegawai"}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} key={editingEmployee?.id || "create-employee"}>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="hris-name">Nama</label>
                <input id="hris-name" name="name" className="form-control" placeholder="Nama pegawai" defaultValue={editingEmployee?.name || ""} required />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="hris-number">NIP/Nomor Pegawai</label>
                <input id="hris-number" name="employeeNumber" className="form-control" placeholder="1987..." defaultValue={editingEmployee?.employeeNumber || ""} required />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="hris-email">Email</label>
                <input id="hris-email" name="email" className="form-control" type="email" placeholder="pegawai@junrejoindah.ac.id" defaultValue={editingEmployee?.email || ""} required />
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label" htmlFor="hris-type">Tipe</label>
                    <select id="hris-type" name="type" className="form-control" defaultValue={editingEmployee?.type || typeOptions[0] || "Dosen"}>
                      {(typeOptions.length ? typeOptions : ["Dosen", "Tendik", "Dosen dengan Tugas Tambahan"]).map((type) => (
                        <option value={type} key={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label" htmlFor="hris-status">Status</label>
                    <select id="hris-status" name="status" className="form-control" defaultValue={editingEmployee?.status || statusOptions[0] || "Aktif"}>
                      {(statusOptions.length ? statusOptions : ["Aktif", "Nonaktif", "Cuti", "Berhenti", "Pensiun"]).map((status) => (
                        <option value={status} key={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="hris-unit">Unit/Homebase</label>
                <select id="hris-unit" name="unit" className="form-control" defaultValue={editingEmployee?.unit || ""} required>
                  <option value="">Pilih unit/homebase</option>
                  {catalog.orgUnits.map((unit) => (
                    <option key={unit.code} value={unit.name}>{unit.name} · {unit.type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="hris-position">Jabatan</label>
                <input id="hris-position" name="position" className="form-control" placeholder="Dosen Tetap / Staff SDM" defaultValue={editingEmployee?.position || ""} required />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="hris-functional">Jabatan Fungsional</label>
                <input id="hris-functional" name="functionalPosition" className="form-control" placeholder="Lektor / -" defaultValue={editingEmployee?.functionalPosition || ""} />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="hris-nidn">NIDN/NIDK</label>
                <input id="hris-nidn" name="nidn" className="form-control" placeholder="0700000000 / -" defaultValue={editingEmployee?.nidn || ""} />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="hris-education">Pendidikan</label>
                <input id="hris-education" name="education" className="form-control" placeholder="S2 Informatika" defaultValue={editingEmployee?.education || ""} />
              </div>
              <button className="btn btn-primary w-100" type="submit">{editingEmployee ? "Update Pegawai" : "Simpan Pegawai"}</button>
              {editingEmployee ? (
                <button className="btn btn-light w-100 mt-2" type="button" onClick={() => { setEditingEmployee(null); setMessage(""); }}>Batal Edit</button>
              ) : showForm ? (
                <button className="btn btn-light w-100 mt-2" type="button" onClick={() => { setShowForm(false); setMessage(""); }}>Batal</button>
              ) : null}
            </form>
          </div>
        </div>
      </div> : null}

      <div className={showForm || editingEmployee ? "col-xl-8 col-xxl-8 col-lg-7" : "col-xl-12"}>
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Master Pegawai</h4>
          </div>
          <div className="card-body">
            {message ? (
              <div className="alert alert-info" role="status">
                {message}
              </div>
            ) : null}
            <div className="row mb-3">
              <div className="col-md-5 mb-2 mb-md-0">
                <input
                  className="form-control"
                  placeholder="Cari nama, NIP, email, unit, atau jabatan..."
                  value={searchTerm}
                  onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="col-md-3 mb-2 mb-md-0">
                <select className="form-control" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setCurrentPage(1); }}>
                  <option value="">Semua tipe</option>
                  {typeOptions.map((type) => (
                    <option value={type} key={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 mb-2 mb-md-0">
                <select className="form-control" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}>
                  <option value="">Semua status</option>
                  {statusOptions.map((status) => (
                    <option value={status} key={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <button className="btn btn-light w-100" type="button" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-bordered table-responsive-sm">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>NIP/NIDN</th>
                    <th>Tipe</th>
                    <th>Unit</th>
                    <th>Jabatan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <strong>{employee.name}</strong>
                        <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>{employee.email}</p>
                      </td>
                      <td>
                        <span>{employee.employeeNumber}</span>
                        <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>NIDN: {employee.nidn}</p>
                      </td>
                      <td><span className="badge badge-info">{employee.type}</span></td>
                      <td>{employee.unit}</td>
                      <td>
                        {employee.position}
                        <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>{employee.functionalPosition}</p>
                      </td>
                      <td><span className="badge badge-success">{employee.status}</span></td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-2" type="button" onClick={() => {
                          setEditingEmployee(employee);
                          setMessage("");
                          setShowForm(false);
                        }}>
                          Edit
                        </button>
                        <Link className="btn btn-sm btn-outline-primary me-2" href={`/hris/${encodeURIComponent(employee.id)}`}>
                          Detail
                        </Link>
                        <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handleDelete(employee)}>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-muted">Belum ada data pegawai.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <small className="text-muted">
                Menampilkan {paginatedEmployees.length} dari {filteredEmployees.length} pegawai
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
  );
}
