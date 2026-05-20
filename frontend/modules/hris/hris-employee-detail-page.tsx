import Link from "next/link";
import { notFound } from "next/navigation";
import { getHrisEmployeeProfile } from "@/lib/spmi-catalog-api";

type HrisEmployeeDetailPageProps = {
  employeeId: string;
};

function StatusBadge({ status }: { status: string }) {
  const className = status === "Valid" || status === "Aktif" || status === "Tervalidasi"
    ? "badge-success"
    : status === "Perlu Review" || status === "Cuti"
      ? "badge-warning"
      : "badge-danger";

  return <span className={`badge ${className}`}>{status}</span>;
}

export async function HrisEmployeeDetailPage({ employeeId }: HrisEmployeeDetailPageProps) {
  const profile = await getHrisEmployeeProfile(employeeId);

  if (!profile) {
    notFound();
  }

  const { employee, positions, competencies, documents } = profile;
  const validDocuments = documents.filter((item) => item.status === "Valid").length;
  const validatedCompetencies = competencies.filter((item) => item.status === "Tervalidasi").length;

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Profil Pegawai HRIS</h4>
            <p className="mb-0">Riwayat SDM, jabatan, kompetensi, dan dokumen eviden pegawai.</p>
          </div>
        </div>
        <div className="col-sm-6 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/dashboard">Dashboard</Link></li>
            <li className="breadcrumb-item"><Link href="/hris">HRIS</Link></li>
            <li className="breadcrumb-item active"><Link href={`/hris/${employee.id}`}>Profil Pegawai</Link></li>
          </ol>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-4 col-xxl-4 col-lg-5">
          <div className="card">
            <div className="card-body">
              <div className="media align-items-center mb-4">
                <span className="me-3 rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" style={{ width: 56, height: 56, fontSize: 24 }}>
                  <i className="la la-user-tie"></i>
                </span>
                <div className="media-body">
                  <h4 className="mb-1">{employee.name}</h4>
                  <p className="mb-0 text-muted">{employee.email}</p>
                </div>
              </div>

              <div className="list-group list-group-flush">
                <div className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Status</span>
                  <StatusBadge status={employee.status} />
                </div>
                <div className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Tipe</span>
                  <strong>{employee.type}</strong>
                </div>
                <div className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">NIP/Nomor</span>
                  <strong>{employee.employeeNumber}</strong>
                </div>
                <div className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">NIDN/NIDK</span>
                  <strong>{employee.nidn}</strong>
                </div>
                <div className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Unit</span>
                  <strong className="text-end">{employee.unit}</strong>
                </div>
                <div className="list-group-item px-0 d-flex justify-content-between">
                  <span className="text-muted">Pendidikan</span>
                  <strong>{employee.education}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-8 col-xxl-8 col-lg-7">
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="mb-1 text-muted">Jabatan Aktif</p>
                  <h3 className="mb-0">{positions.length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="mb-1 text-muted">Kompetensi Valid</p>
                  <h3 className="mb-0">{validatedCompetencies}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="mb-1 text-muted">Dokumen Valid</p>
                  <h3 className="mb-0">{validDocuments}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Keterhubungan SPMI</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="list-group-item">
                    <strong>Standar SDM</strong>
                    <p className="mb-0 text-muted">Profil ini menjadi sumber eviden kecukupan dosen/tendik, kualifikasi, dan jabatan.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="list-group-item">
                    <strong>AMI & Akreditasi</strong>
                    <p className="mb-0 text-muted">Dokumen dan kompetensi bisa dipakai untuk pembuktian saat audit mutu internal.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Riwayat Jabatan</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                {positions.map((position) => (
                  <div className="list-group-item" key={position.id || `${position.title}-${position.period}`}>
                    <strong>{position.title}</strong>
                    <div className="text-muted">{position.unit}</div>
                    <span className="badge badge-light mt-2">{position.period} · {position.status}</span>
                  </div>
                ))}
                {positions.length === 0 ? <p className="mb-0 text-muted">Belum ada riwayat jabatan.</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Kompetensi</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                {competencies.map((item) => (
                  <div className="list-group-item" key={item.id || `${item.name}-${item.year}`}>
                    <strong>{item.name}</strong>
                    <div className="text-muted">{item.category}</div>
                    <span className="badge badge-primary mt-2">{item.year} · {item.status}</span>
                  </div>
                ))}
                {competencies.length === 0 ? <p className="mb-0 text-muted">Belum ada data kompetensi.</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Dokumen Eviden</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                {documents.map((item) => (
                  <div className="list-group-item" key={item.id || `${item.title}-${item.type}`}>
                    <strong>{item.title}</strong>
                    <div className="text-muted">{item.type}</div>
                    <span className="mt-2 d-inline-block"><StatusBadge status={item.status} /></span>
                    {item.fileName ? <div className="text-muted mt-2" style={{ fontSize: "0.8rem" }}>File: {item.fileName}</div> : null}
                  </div>
                ))}
                {documents.length === 0 ? <p className="mb-0 text-muted">Belum ada dokumen SDM.</p> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
