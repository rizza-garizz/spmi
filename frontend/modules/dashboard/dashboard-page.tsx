import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { getDashboardSummary } from "@/lib/spmi-catalog-api";
import { DashboardExportActions } from "@/components/dashboard/dashboard-export-actions";
import { DashboardAccreditationCard, DashboardPerformanceTable } from "@/components/dashboard/dashboard-deferred-panels";

const controlLinks = [
  { href: "/nilai", label: "Nilai & Rekap", scope: "Lihat skor, status, dan prioritas kerja.", icon: "la-bar-chart", roles: ["super_admin", "lpm", "admin_lpm", "auditor", "kaprodi", "sekprodi", "unit_kerja", "operator"] as const },
  { href: "/documents", label: "Dokumen", scope: "Masuk ke repository dokumen inti.", icon: "la-file-text", roles: ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja", "operator"] as const },
  { href: "/standards", label: "Standar", scope: "Kelola master data standar mutu.", icon: "la-book", roles: ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja", "operator"] as const },
  { href: "/settings", label: "Akses", scope: "Cek role dan seed user.", icon: "la-cog", roles: ["super_admin", "admin_lpm"] as const },
] as const;

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) || {};
  const selectedFilters = {
    fakultas: String(params.fakultas || ""),
    prodi: String(params.prodi || ""),
    tahun: String(params.tahun || ""),
    standar: String(params.standar || ""),
  };
  const summary = await getDashboardSummary(selectedFilters);
  const quickStats = summary.metrics ?? [];
  const performanceItems = Array.isArray(summary.performance) ? summary.performance : [];
  const standardAchievement = summary.standardAchievement ?? [];
  const kpi = summary.kpi ?? {
    total_indicators: performanceItems.length,
    average_achievement: 0,
    achieved: 0,
    warning: 0,
    risk: 0,
    executive_score: 0,
    predicate: "PERLU PEMBINAAN",
  };
  const accreditation = summary.accreditation ?? {
    score: kpi.executive_score,
    predicate: kpi.predicate || "PERLU PEMBINAAN",
    criteria: standardAchievement.map((item) => ({
      label: item.group,
      score: Number(Math.min((item.achievement || 0) / 25, 4).toFixed(2)),
    })),
    insight: "Belum ada data standar aktif di database untuk dianalisis.",
  };
  const cycle = summary.cycle ?? {
    academic_year: null,
    active_cycles: 0,
    phase: null,
    source: "SystemSetting",
  };
  const institutionName = summary.institution?.name || "Institusi";
  const filterOptions = summary.filterOptions ?? {
    faculties: [],
    studyPrograms: [],
    standards: [],
    years: [],
  };
  const exportRows = [
    ["Kode", "Indikator", "Standar", "Fakultas", "Prodi", "Periode", "Target", "Capaian", "Satuan", "Ketercapaian", "Status"],
    ...performanceItems.map((item: any) => [
      item.code,
      item.name,
      item.standard?.title || "",
      item.fakultas || "",
      item.prodi || "",
      item.period || "",
      item.target,
      item.actual,
      item.unit,
      `${item.achievement ?? 0}%`,
      item.status,
    ]),
  ];

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Strategic Command Center</h4>
            <p className="mb-0">Monitoring Kinerja Mutu dan Akreditasi.</p>
          </div>
        </div>
      </div>

      {/* Strategic Insights - UNGGUL Focus */}
      <div className="row" id="kpi-mutu">
        <div className="col-xl-3 col-lg-6 col-sm-6">
          <div className="widget-stat card bg-danger">
            <div className="card-body p-4">
              <div className="media">
                <span className="me-3"><i className="la la-graduation-cap fs-30 text-white"></i></span>
                <div className="media-body text-white text-end">
                  <p className="mb-1">Indikator Risiko</p>
                  <h3 className="text-white">{kpi.risk}</h3>
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
                  <p className="mb-1">Perlu Monitoring</p>
                  <h3 className="text-white">{kpi.warning}</h3>
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
                  <p className="mb-1">Rata-rata Capaian</p>
                  <h3 className="text-white">{kpi.average_achievement}%</h3>
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
                  <p className="mb-1">Indikator Tercapai</p>
                  <h3 className="text-white">{kpi.achieved}/{kpi.total_indicators}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form className="card mb-4" action="/dashboard" id="filter-eksekutif">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-xl-2 col-md-4">
              <label className="form-label">Fakultas</label>
              <select className="form-control" name="fakultas" defaultValue={selectedFilters.fakultas}>
                <option value="">Semua Fakultas</option>
                {filterOptions.faculties.map((unit) => <option key={unit.code} value={unit.code}>{unit.name}</option>)}
              </select>
            </div>
            <div className="col-xl-2 col-md-4">
              <label className="form-label">Prodi</label>
              <select className="form-control" name="prodi" defaultValue={selectedFilters.prodi}>
                <option value="">Semua Prodi</option>
                {filterOptions.studyPrograms.map((unit) => <option key={unit.code} value={unit.code}>{unit.name}</option>)}
              </select>
            </div>
            <div className="col-xl-2 col-md-4">
              <label className="form-label">Tahun</label>
              <select className="form-control" name="tahun" defaultValue={selectedFilters.tahun}>
                <option value="">Semua Tahun</option>
                {filterOptions.years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div className="col-xl-3 col-md-6">
              <label className="form-label">Standar</label>
              <select className="form-control" name="standar" defaultValue={selectedFilters.standar}>
                <option value="">Semua Standar</option>
                {filterOptions.standards.map((standard) => <option key={standard.code} value={standard.code}>{standard.code} - {standard.title}</option>)}
              </select>
            </div>
            <div className="col-xl-3 col-md-6 d-flex gap-2 mt-3 mt-xl-0">
              <button className="btn btn-primary" type="submit"><i className="la la-filter me-1"></i> Terapkan</button>
              <Link href="/dashboard" className="btn btn-light">Reset</Link>
              <span id="export-kpi">
                <DashboardExportActions rows={exportRows} institutionName={institutionName} kpi={kpi} />
              </span>
            </div>
          </div>
        </div>
      </form>

      <div className="row" id="analitik">
        <div className="col-xl-8 col-xxl-8 col-lg-8">
          <DashboardAccreditationCard accreditation={accreditation} />
        </div>
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
                  <h4 className="text-primary">{cycle.academic_year || "-"}</h4>
                  <span className="badge badge-info">Fase: {cycle.phase || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Grafik Ketercapaian Standar</h4>
            </div>
            <div className="card-body">
              <div className="row">
                {standardAchievement.map((item) => (
                  <div className="col-xl-3 col-md-6 mb-3" key={item.group}>
                    <div className="p-3 border rounded">
                      <div className="d-flex justify-content-between mb-2">
                        <strong>{item.group}</strong>
                        <span>{item.achievement}%</span>
                      </div>
                      <div className="progress" style={{ height: "10px" }}>
                        <div className={`progress-bar bg-${item.achievement >= 100 ? "success" : item.achievement >= 70 ? "warning" : "danger"}`} style={{ width: `${Math.min(item.achievement, 100)}%` }}></div>
                      </div>
                      <small className="text-muted">{item.total} indikator dipantau</small>
                    </div>
                  </div>
                ))}
                {standardAchievement.length === 0 && (
                  <div className="col-12 text-center text-muted">Belum ada data ketercapaian standar untuk filter ini.</div>
                )}
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

      <DashboardPerformanceTable performanceItems={performanceItems} institutionName={institutionName} />

      <div className="row">
        <div className="col-xl-12 col-xxl-12 col-lg-12">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="card-title">Status Operasi & Koneksi</h4>
              <span className="badge badge-success">{summary.source?.type === "database" ? "Database" : "Tidak Terhubung"}</span>
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
                        <span className={`badge badge-${summary.source?.type === "database" ? "success" : "warning"}`}>
                          {summary.source?.type === "database" ? "Live" : "Error"}
                        </span>
                      </td>
                      <td>{summary.source?.type === "database" ? `Terkoneksi ke tabel ${summary.source.tables.join(", ")}` : "Dashboard tidak memakai data cadangan."}</td>
                    </tr>
                    <tr>
                      <td>Total Indikator Aktif</td>
                      <td><span className="badge badge-primary">{performanceItems.length} indikator</span></td>
                      <td>Termuat dari tabel database dashboard</td>
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
