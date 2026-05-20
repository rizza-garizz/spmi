"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { clientApiRequest, dispatchAppEvent, hasApiBaseUrl } from "@/lib/spmi-session-client";

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
  const [employees, setEmployees] = useState(initialEmployees);
  const [editingEmployee, setEditingEmployee] = useState<HrisEmployee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

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
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setEditingEmployee(null);
              setShowForm((current) => !current);
            }}
          >
            {showForm ? "Tutup Form" : "Tambah Pegawai"}
          </button>
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
                    <select id="hris-type" name="type" className="form-control" defaultValue={editingEmployee?.type || "Dosen"}>
                      <option value="Dosen">Dosen</option>
                      <option value="Tendik">Tendik</option>
                      <option value="Dosen dengan Tugas Tambahan">Dosen dengan Tugas Tambahan</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label" htmlFor="hris-status">Status</label>
                    <select id="hris-status" name="status" className="form-control" defaultValue={editingEmployee?.status || "Aktif"}>
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                      <option value="Cuti">Cuti</option>
                      <option value="Berhenti">Berhenti</option>
                      <option value="Pensiun">Pensiun</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="hris-unit">Unit/Homebase</label>
                <input id="hris-unit" name="unit" className="form-control" placeholder="Program Studi Sistem Informasi" defaultValue={editingEmployee?.unit || ""} required />
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
                <button className="btn btn-light w-100 mt-2" type="button" onClick={() => setEditingEmployee(null)}>Batal Edit</button>
              ) : showForm ? (
                <button className="btn btn-light w-100 mt-2" type="button" onClick={() => setShowForm(false)}>Batal</button>
              ) : null}
              {message ? <p className="form-note mt-3">{message}</p> : null}
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
                  {employees.map((employee) => (
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
                  {employees.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-muted">Belum ada data pegawai.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
