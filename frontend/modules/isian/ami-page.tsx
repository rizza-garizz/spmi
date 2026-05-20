import { getAmiAudits } from "@/lib/spmi-catalog-api";
import { CreateAmiAuditForm } from "@/components/isian/ami/create-ami-audit-form";
import { ProgressiveSection } from "@/components/support/progressive-section";

export default async function AmiPage() {
  let audits: any[] = [];
  try {
    audits = (await getAmiAudits()).data;
  } catch {
    audits = [];
  }

  const total = audits.length;
  const selesai = audits.filter(a => a.status === "selesai").length;
  const berjalan = audits.filter(a => a.status === "berjalan").length;
  const terjadwal = audits.filter(a => a.status === "terjadwal").length;

  const stats = [
    { label: "Total Audit", value: total, icon: "la-check-circle", color: "bg-primary" },
    { label: "Selesai", value: selesai, icon: "la-check", color: "bg-success" },
    { label: "Sedang Berjalan", value: berjalan, icon: "la-refresh", color: "bg-warning" },
    { label: "Terjadwal", value: terjadwal, icon: "la-clock-o", color: "bg-info" },
  ];

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Audit Mutu Internal (AMI)</h4>
            <p className="mb-0">Evaluasi, temuan, dan status tindak lanjut Universitas Junrejo Indah.</p>
          </div>
        </div>
        <div className="col-sm-6 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item active"><a href="/ami">AMI</a></li>
          </ol>
        </div>
      </div>

      <div className="row">
        {stats.map((s, index) => (
          <div className="col-xl-3 col-xxl-3 col-md-6 col-sm-6" key={index}>
            <div className={`widget-stat card ${s.color}`}>
              <div className="card-body p-4">
                <div className="media">
                  <span className="me-3">
                    <i className={`la ${s.icon}`}></i>
                  </span>
                  <div className="media-body text-white text-right">
                    <p className="mb-1 text-white">{s.label}</p>
                    <h3 className="text-white">{s.value}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Daftar Audit Unit</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered verticle-middle table-responsive-sm">
                  <thead>
                    <tr>
                      <th scope="col">Unit Organisasi</th>
                      <th scope="col">Status</th>
                      <th scope="col">Temuan (K/T/S/R)</th>
                      <th scope="col">Skor</th>
                      <th scope="col">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((audit) => (
                      <tr key={audit.id}>
                        <td>
                          <strong>{audit.org_unit.name}</strong>
                          <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>Auditor: {audit.auditor} · {audit.scheduled_date}</p>
                        </td>
                        <td>
                          <span className={`badge badge-${audit.status === 'selesai' ? 'success' : audit.status === 'berjalan' ? 'warning' : 'info'}`}>
                            {audit.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {audit.findings ? (
                            <div className="d-flex gap-2">
                              <span className="badge badge-danger" title="Kritis">{audit.findings.kritis}</span>
                              <span className="badge badge-warning text-white" title="Tinggi">{audit.findings.tinggi}</span>
                              <span className="badge badge-info" title="Sedang">{audit.findings.sedang}</span>
                              <span className="badge badge-light" title="Rendah">{audit.findings.rendah}</span>
                            </div>
                          ) : "-"}
                        </td>
                        <td>
                          <h4 className="mb-0">{audit.score ? audit.score.toFixed(1) : "-"}</h4>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-primary">Detail</button>
                        </td>
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
        <div className="col-xl-12 col-xxl-12 col-sm-12">
          <ProgressiveSection
            eyebrow="Audit"
            title="Jadwalkan Audit Baru"
            description="Operator bisa fokus membaca daftar audit. Penjadwalan baru dibuka saat diperlukan."
            actionLabel="Jadwalkan Audit"
          >
            <div className="card">
              <div className="card-body">
                <CreateAmiAuditForm initialItems={audits} />
              </div>
            </div>
          </ProgressiveSection>
        </div>
      </div>
    </>
  );
}
