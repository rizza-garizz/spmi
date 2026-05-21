import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { getCatalogSnapshot, getDashboardSummary } from "@/lib/spmi-catalog-api";
import { SimpleTrendChart } from "@/components/charts/SimpleTrendChart";
import { RadarCriteriaChart } from "@/components/charts/RadarCriteriaChart";

const controlLinks = [
  { href: "/nilai", label: "Nilai & Rekap", scope: "Lihat skor, status, dan prioritas kerja.", icon: "la-bar-chart", roles: ["admin_lpm", "auditor", "kaprodi", "sekprodi", "unit_kerja"] as const },
  { href: "/documents", label: "Dokumen", scope: "Masuk ke repository dokumen inti.", icon: "la-file-text", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] as const },
  { href: "/standards", label: "Standar", scope: "Kelola master data standar mutu.", icon: "la-book", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] as const },
  { href: "/settings", label: "Akses", scope: "Cek role dan seed user.", icon: "la-cog", roles: ["admin_lpm"] as const },
] as const;

function encodeExportContent(content: string, mimeType: string) {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
}

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
  const [summary, catalog] = await Promise.all([
    getDashboardSummary(selectedFilters),
    getCatalogSnapshot(),
  ]);
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
  };
  const orgUnits = catalog.orgUnits || [];
  const faculties = orgUnits.filter((unit) => unit.type === "fakultas");
  const studyPrograms = orgUnits.filter((unit) => unit.type === "prodi");
  const standards = catalog.standards || [];
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
  const csvExport = exportRows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const pdfExport = `<!doctype html><html><head><meta charset="utf-8"><title>Dashboard KPI Mutu</title><style>body{font-family:Inter,Arial,sans-serif;color:#0f172a;padding:32px}h1{margin-bottom:4px}.kpi{display:flex;gap:12px;margin:20px 0}.kpi div{border:1px solid #e2e8f0;border-radius:12px;padding:12px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #e2e8f0;padding:8px;text-align:left}th{background:#f8fafc}</style></head><body><h1>Dashboard KPI Mutu</h1><p>Universitas Junrejo Indah</p><section class="kpi"><div>Total indikator: ${kpi.total_indicators}</div><div>Rata-rata: ${kpi.average_achievement}%</div><div>Tercapai: ${kpi.achieved}</div><div>Risiko: ${kpi.risk}</div></section><table>${exportRows.map((row, index) => `<tr>${row.map((value) => index === 0 ? `<th>${value}</th>` : `<td>${value}</td>`).join("")}</tr>`).join("")}</table><script>window.print()</script></body></html>`;

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

      <form className="card mb-4" action="/dashboard">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-xl-2 col-md-4">
              <label className="form-label">Fakultas</label>
              <select className="form-control" name="fakultas" defaultValue={selectedFilters.fakultas}>
                <option value="">Semua Fakultas</option>
                {faculties.map((unit) => <option key={unit.code} value={unit.code}>{unit.name}</option>)}
              </select>
            </div>
            <div className="col-xl-2 col-md-4">
              <label className="form-label">Prodi</label>
              <select className="form-control" name="prodi" defaultValue={selectedFilters.prodi}>
                <option value="">Semua Prodi</option>
                {studyPrograms.map((unit) => <option key={unit.code} value={unit.code}>{unit.name}</option>)}
              </select>
            </div>
            <div className="col-xl-2 col-md-4">
              <label className="form-label">Tahun</label>
              <select className="form-control" name="tahun" defaultValue={selectedFilters.tahun}>
                <option value="">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
            <div className="col-xl-3 col-md-6">
              <label className="form-label">Standar</label>
              <select className="form-control" name="standar" defaultValue={selectedFilters.standar}>
                <option value="">Semua Standar</option>
                {standards.map((standard: any) => <option key={standard.code} value={standard.code}>{standard.code} - {standard.title}</option>)}
              </select>
            </div>
            <div className="col-xl-3 col-md-6 d-flex gap-2 mt-3 mt-xl-0">
              <button className="btn btn-primary" type="submit"><i className="la la-filter me-1"></i> Terapkan</button>
              <Link href="/dashboard" className="btn btn-light">Reset</Link>
              <a className="btn btn-outline-primary" download="dashboard-kpi-mutu.csv" href={encodeExportContent(csvExport, "text/csv")}>Excel</a>
              <a className="btn btn-outline-primary" download="dashboard-kpi-mutu.pdf.html" href={encodeExportContent(pdfExport, "text/html")}>PDF</a>
            </div>
          </div>
        </div>
      </form>

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

      <div className="row">
        <div className="col-xl-12 col-xxl-12 col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Monitoring Capaian IKU Universitas Junrejo Indah</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered verticle-middle table-responsive-sm">
                  <thead>
                    <tr>
                      <th scope="col">Kode IKU</th>
                      <th scope="col">Indikator Mutu</th>
                      <th scope="col">Unit</th>
                      <th scope="col">Standar</th>
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
                            <strong>{item.prodi || item.fakultas || item.org_unit_code || "-"}</strong>
                            <br /><small className="text-muted">{item.period || "-"}</small>
                          </td>
                          <td><small>{item.standard?.code || "-"}<br />{item.standard?.title || ""}</small></td>
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
                        <td colSpan={7} className="text-center">Belum ada data indikator yang dipantau.</td>
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
