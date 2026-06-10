const uatRoles = [
  ["LPM / BPM", "Master standar, AMI, PPEPP, dashboard, reporting"],
  ["Prodi", "Upload dokumen, indikator, PPEPP, tindak lanjut scope prodi"],
  ["Auditor", "Jadwal audit, instrumen, temuan, laporan AMI"],
  ["Unit Pendukung", "Dokumen unit, RTL, tindak lanjut temuan"],
  ["Pimpinan", "Dashboard KPI, RTM, laporan, monitoring lintas unit"],
];

const criticalScenarios = [
  "Login sesuai role dan hak akses",
  "Upload, preview, dan download dokumen",
  "Row-level access antar prodi/unit tidak bocor",
  "Buat, edit, nonaktifkan, dan revisi standar mutu",
  "Jalankan AMI: instrumen, temuan, tindak lanjut, verifikasi",
  "Generate laporan AMI",
  "Dashboard pimpinan dapat difilter dan diexport",
  "RTM dan RTL dapat dipantau sampai selesai",
];

const opsChecklist = [
  ["Backup Database", "Backup harian, retensi, enkripsi, restore drill"],
  ["Storage Dokumen", "Object storage private, MIME allowlist, versioning"],
  ["Monitoring Server", "Uptime, p95 response time, error rate, CPU/RAM/disk"],
  ["Alerting", "API down, 5xx spike, disk usage, backup gagal, upload gagal"],
  ["Change Freeze", "H-3 sampai H+14 pilot, hanya critical hotfix"],
  ["Pilot Issue Log", "Critical, Major, Minor, Improvement dengan PIC dan status"],
];

export default function GoLivePage() {
  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Go-Live Readiness Center</h4>
            <p className="mb-0">UAT, operasional production, monitoring, backup, dan freeze pilot.</p>
          </div>
        </div>
        <div className="col-sm-6 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
            <li className="breadcrumb-item active" aria-current="page">Go-Live</li>
          </ol>
        </div>
      </div>

      <div className="row" id="uat-checklist">
        {[
          ["Go-Live Score", "93.1", "bg-success"],
          ["Functional", "97%", "bg-primary"],
          ["UAT Status", "Ready", "bg-info"],
          ["Freeze", "Planned", "bg-warning"],
        ].map(([label, value, color]) => (
          <div className="col-xl-3 col-xxl-3 col-md-6 col-sm-6" key={label}>
            <div className={`widget-stat card ${color}`}>
              <div className="card-body p-4">
                <div className="media">
                  <span className="me-3"><i className="la la-clipboard-check"></i></span>
                  <div className="media-body text-white text-end">
                    <p className="mb-1 text-white">{label}</p>
                    <h3 className="text-white">{value}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row" id="operational-readiness">
        <div className="col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">UAT Per Role</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-responsive-sm">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Fokus UAT</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uatRoles.map(([role, focus]) => (
                      <tr key={role}>
                        <td><strong>{role}</strong></td>
                        <td>{focus}</td>
                        <td><span className="badge badge-warning">Planned</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Kriteria Kelulusan</h4>
            </div>
            <div className="card-body">
              <ul className="mb-0">
                <li>Functional pass rate minimal 95%.</li>
                <li>Tidak ada bug Critical.</li>
                <li>Bug Major maksimal 2 dan memiliki workaround tertulis.</li>
                <li>Semua role utama dapat menyelesaikan tugas harian tanpa bantuan developer.</li>
                <li>Approval dan row-level access tidak bocor antar prodi/unit.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Skenario Kritikal UAT</h4>
            </div>
            <div className="card-body">
              <div className="list-group">
                {criticalScenarios.map((item, index) => (
                  <div className="list-group-item d-flex justify-content-between align-items-center" key={item}>
                    <span>{index + 1}. {item}</span>
                    <span className="badge badge-light">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Runbook Operasional</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-responsive-sm">
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>Kontrol</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opsChecklist.map(([area, control]) => (
                      <tr key={area}>
                        <td><strong>{area}</strong></td>
                        <td>{control}</td>
                        <td><span className="badge badge-warning">Pending</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card border-primary">
            <div className="card-header">
              <h4 className="card-title">Pilot Freeze Procedure</h4>
            </div>
            <div className="card-body">
              <p className="mb-2">Freeze berlaku sejak H-3 pilot sampai H+14 pilot selesai.</p>
              <p className="mb-0 text-muted">
                Perubahan yang boleh masuk hanya bug Critical, security fix, dan data correction yang disetujui product owner kampus, LPM/BPM, dan tech lead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
