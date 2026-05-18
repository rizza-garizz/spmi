import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { getDashboardSummary } from "@/lib/spmi-catalog-api";
import { fallbackMetrics } from "@/lib/spmi-catalog-data";
import { SimpleTrendChart } from "@/components/charts/SimpleTrendChart";
import { RadarCriteriaChart } from "@/components/charts/RadarCriteriaChart";

const controlLinks = [
  { href: "/nilai", label: "Nilai & Rekap", scope: "Lihat skor, status, dan prioritas kerja.", icon: "la-bar-chart", roles: ["admin_lpm", "auditor", "kaprodi", "sekprodi", "unit_kerja"] as const },
  { href: "/documents", label: "Dokumen", scope: "Masuk ke repository dokumen inti.", icon: "la-file-text", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] as const },
  { href: "/standards", label: "Standar", scope: "Kelola master data standar mutu.", icon: "la-book", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] as const },
  { href: "/settings", label: "Akses", scope: "Cek role dan seed user.", icon: "la-cog", roles: ["admin_lpm"] as const },
] as const;

export async function DashboardPage() {
  const summary = await getDashboardSummary();
  const quickStats = summary.metrics ?? fallbackMetrics;
  const performanceItems = Array.isArray(summary.performance) ? summary.performance : [];

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Strategic Command Center</h4>
            <p className="mb-0">Monitoring Kinerja Mutu Internasional & Akreditasi Unggul.</p>
          </div>
        </div>
      </div>

      {/* Strategic Insights - UNGGUL Focus */}
      <div className="row">
        <div className="col-xl-3 col-lg-6 col-sm-6">
          <div className="widget-stat card bg-danger">
            <div className="card-body p-4">
              <div className="media">
                <span className="me-3"><i className="la la-graduation-cap fs-30 text-white"></i></span>
                <div className="media-body text-white text-end">
                  <p className="mb-1">Accreditation Risk</p>
                  <h3 className="text-white">2 Prodi</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-sm-6">
          <div className="widget-stat card bg-warning">
            <div className="card-body p-4">
              <div className="media">
                <span className="me-3"><i className="la la-exclamation-circle fs-30 text-white"></i></span>
                <div className="media-body text-white text-end">
                  <p className="mb-1">Active AMI Findings</p>
                  <h3 className="text-white">14 Cases</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-sm-6">
          <div className="widget-stat card bg-success">
            <div className="card-body p-4">
              <div className="media">
                <span className="me-3"><i className="la la-chart-line fs-30 text-white"></i></span>
                <div className="media-body text-white text-end">
                  <p className="mb-1">IKU Completion</p>
                  <h3 className="text-white">82.4%</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-lg-6 col-sm-6">
          <div className="widget-stat card bg-info">
            <div className="card-body p-4">
              <div className="media">
                <span className="me-3"><i className="la la-users fs-30 text-white"></i></span>
                <div className="media-body text-white text-end">
                  <p className="mb-1">Stakeholder Satisfaction</p>
                  <h3 className="text-white">3.82 / 4.0</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Main Banner / Welcome */}
        <div className="col-xl-8 col-xxl-8 col-lg-8">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Analisis 9 Kriteria Akreditasi (BAN-PT)</h4>
            </div>
            <div className="card-body">
               <div className="row align-items-center">
                  <div className="col-md-6">
                    <RadarCriteriaChart 
                      scores={[
                        { label: "C1: VMTS", score: 4.0 },
                        { label: "C2: Tata Pamong", score: 3.5 },
                        { label: "C3: Mahasiswa", score: 3.8 },
                        { label: "C4: SDM", score: 2.5 },
                        { label: "C5: Keuangan", score: 3.0 },
                        { label: "C6: Pendidikan", score: 3.9 },
                        { label: "C7: Penelitian", score: 2.1 },
                        { label: "C8: PkM", score: 2.8 },
                        { label: "C9: Luaran", score: 3.2 },
                      ]} 
                    />
                  </div>
                  <div className="col-md-6">
                    <div className="text-center mb-4">
                        <h2 className="text-primary mb-0" style={{fontSize: '3rem'}}>368</h2>
                        <span className="badge badge-success">PREDIKAT: UNGGUL</span>
                        <p className="mt-2 text-muted">Estimasi skor berdasarkan data capaian indikator saat ini.</p>
                    </div>
                    <div className="alert alert-outline-primary small">
                       <i className="la la-info-circle me-2"></i>
                       <strong>Insights:</strong> Kriteria SDM (C4) dan Penelitian (C7) masih di bawah target 3.0. Prioritaskan peningkatan publikasi dosen.
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Metrik Cepat</h4>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {quickStats.slice(0, 4).map((metric) => (
                  <li className="list-group-item d-flex justify-content-between align-items-center" key={metric.label}>
                    {metric.label}
                    <span className="badge badge-primary badge-pill">{metric.value}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-light rounded text-center">
                  <h6 className="mb-1 text-dark">Siklus Berjalan</h6>
                  <h4 className="text-primary">2025/2026</h4>
                  <span className="badge badge-info">Fase: Pelaksanaan (P2)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <h4 className="mb-4">Akses Cepat (Fast Lane)</h4>
        </div>
        {controlLinks.map((item) => (
          <RoleGate key={item.href} allowedRoles={[...item.roles]}>
            <div className="col-xl-3 col-xxl-3 col-md-6 col-sm-6">
              <div className="card text-center">
                <div className="card-body">
                  <div className="text-primary mb-3">
                    <i className={`la ${item.icon}`} style={{ fontSize: "3rem" }}></i>
                  </div>
                  <h5 className="card-title">{item.label}</h5>
                  <p className="card-text">{item.scope}</p>
                  <Link href={item.href} className="btn btn-primary btn-sm">Buka Modul</Link>
                </div>
              </div>
            </div>
          </RoleGate>
        ))}
      </div>

      <div className="row">
        <div className="col-xl-12 col-xxl-12 col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Monitoring Capaian IKU (Benchmark IPB)</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered verticle-middle table-responsive-sm">
                  <thead>
                    <tr>
                      <th scope="col">Kode IKU</th>
                      <th scope="col">Indikator Mutu</th>
                      <th scope="col">Progress (Actual)</th>
                      <th scope="col">Tren (5 Periode)</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceItems.map((item: any) => {
                      const safeTarget = Number(item?.target ?? 0);
                      const safeActual = Number(item?.actual ?? 0);
                      const percentage = safeTarget > 0 ? Math.min((safeActual / safeTarget) * 100, 100) : 0;
                      const barColor = percentage >= 100 ? "success" : percentage > 50 ? "warning" : "danger";
                      
                      return (
                        <tr key={item.code ?? item.name}>
                          <td><strong>{item.code ?? "-"}</strong></td>
                          <td>{item.name ?? "Indikator"}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1" style={{ height: "10px" }}>
                                <div className={`progress-bar bg-${barColor}`} role="progressbar" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span className="ms-2">{safeActual}/{safeTarget}{item.unit ?? ""}</span>
                            </div>
                          </td>
                          <td style={{ width: '200px' }}>
                            <SimpleTrendChart data={Array.isArray(item.history) ? item.history : []} target={safeTarget} unit={item.unit ?? ""} />
                          </td>
                          <td>
                            <span className={`badge badge-${barColor}`}>{item.status ?? "No Data"}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {performanceItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center">Belum ada data indikator yang dipantau.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12 col-xxl-12 col-lg-12">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="card-title">Status Operasi & Koneksi</h4>
              <span className="badge badge-success">{process.env.NEXT_PUBLIC_API_URL ? "Node API" : "Data Cadangan (JSON)"}</span>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered verticle-middle table-responsive-sm">
                  <thead>
                    <tr>
                      <th scope="col">Komponen</th>
                      <th scope="col">Status</th>
                      <th scope="col">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Database Source</td>
                      <td>
                        <span className={`badge badge-${process.env.NEXT_PUBLIC_API_URL ? "success" : "warning"}`}>
                          {process.env.NEXT_PUBLIC_API_URL ? "Live" : "Mock"}
                        </span>
                      </td>
                      <td>{process.env.NEXT_PUBLIC_API_URL ? "Terkoneksi ke Node API" : "Menggunakan data spmi-catalog.json"}</td>
                    </tr>
                    <tr>
                      <td>Total Indikator Aktif</td>
                      <td><span className="badge badge-primary">{performanceItems.length} indikator</span></td>
                      <td>Termuat dari database/katalog sinkronisasi</td>
                    </tr>
                    <tr>
                      <td>Fokus Halaman</td>
                      <td><span className="badge badge-info">Dashboard Ringkas</span></td>
                      <td>Fokus UI ke navigasi operasional, detail pindah ke halaman nilai.</td>
                    </tr>
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
