import { getCatalogSnapshot, getDashboardSummary, getAmiAudits, getImports, getRtmMeetings, getSurveys } from "@/lib/spmi-catalog-api";

export async function NilaiPage() {
  const [catalog, summary, auditsResult, importsResult, meetingsResult, surveysResult] = await Promise.all([
    getCatalogSnapshot(),
    getDashboardSummary(),
    getAmiAudits().catch(() => ({ data: [] as any[] })),
    getImports().catch(() => ({ data: [] as Array<{ id: number; type: string; title: string; status: string }> })),
    getRtmMeetings().catch(() => ({ data: [] as any[] })),
    getSurveys().catch(() => ({ data: [] as any[] })),
  ]);

  const audits = auditsResult.data;
  const imports = importsResult.data;
  const meetings = meetingsResult.data;
  const surveys = surveysResult.data;

  const quickStats = summary.metrics ?? [];
  const modules = summary.modules ?? [];

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Nilai & Rekap</h4>
            <p className="mb-0">Ringkasan skor, status, dan prioritas kerja mutu.</p>
          </div>
        </div>
        <div className="col-sm-6 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item active"><a href="/nilai">Nilai</a></li>
          </ol>
        </div>
      </div>

      <div className="row" id="rekap-mutu">
        {/* Ringkasan Utama */}
        <div className="col-xl-12">
          <h4 className="mb-4">Ringkasan Utama <span className="badge badge-info ms-2">{process.env.NEXT_PUBLIC_API_URL ? "Live source" : "Data cadangan"}</span></h4>
        </div>
        {quickStats.map((metric, index) => (
          <div className="col-xl-3 col-xxl-3 col-md-6 col-sm-6" key={`qs-${index}`}>
            <div className="widget-stat card bg-primary">
              <div className="card-body p-4">
                <div className="media">
                  <span className="me-3"><i className="la la-bar-chart"></i></span>
                  <div className="media-body text-white">
                    <p className="mb-1 text-white">{metric.label}</p>
                    <h3 className="text-white">{metric.value}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row" id="evaluasi-diri">
        {/* Matriks Penilaian - Diadopsi dari Legacy */}
        <div className="col-xl-12 col-xxl-12 col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Matriks Penilaian & Pencapaian (Diadopsi dari Sistem Lama)</h4>
            </div>
            <div className="card-body">
              <p>Perbandingan skor Target Program Studi vs Nilai Tercapai pada setiap instrumen.</p>
              <div className="row mt-4">
                {[
                  { label: "A. Kondisi Eksternal", target: 4, actual: 3.5 },
                  { label: "B. Profil Unit Pengelola", target: 4, actual: 4.0 },
                  { label: "C.1. Visi, Misi, Tujuan", target: 4, actual: 3.8 },
                  { label: "C.2. Tata Pamong & Kerjasama", target: 3.5, actual: 3.0 },
                  { label: "C.3. Mahasiswa", target: 4, actual: 4.0 },
                  { label: "C.4. Sumber Daya Manusia", target: 3.5, actual: 3.2 },
                  { label: "C.5. Keuangan & Sarpras", target: 4, actual: 3.9 },
                  { label: "C.6. Pendidikan", target: 4, actual: 3.7 },
                  { label: "C.7. Penelitian", target: 3, actual: 3.0 },
                  { label: "C.8. Pengabdian Masyarakat", target: 3, actual: 2.8 },
                  { label: "C.9. Luaran Tridharma", target: 4, actual: 3.5 },
                  { label: "D. Analisis Pengembangan", target: 4, actual: 3.6 },
                ].map((item) => {
                  const targetPct = (item.target / 4) * 100;
                  const actualPct = (item.actual / 4) * 100;
                  const isMet = item.actual >= item.target;

                  return (
                    <div className="col-xl-6 col-xxl-6 col-md-6 mb-4" key={item.label}>
                      <div className="d-flex justify-content-between mb-2">
                        <strong className="text-dark">{item.label}</strong>
                        <div className="d-flex gap-3">
                          <span className="text-muted">Target: {item.target.toFixed(1)}</span>
                          <span className={isMet ? "text-success font-weight-bold" : "text-danger font-weight-bold"}>
                            Realisasi: {item.actual.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="progress" style={{ height: "12px", backgroundColor: "#f0f0f0", position: "relative" }}>
                        <div className="progress-bar bg-light" style={{ width: `${targetPct}%`, opacity: 0.5, position: "absolute", height: "100%" }}></div>
                        <div className={`progress-bar ${isMet ? 'bg-success' : 'bg-danger'}`} style={{ width: `${actualPct}%`, position: "absolute", height: "100%" }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row" id="prioritas-kerja">
        {/* Skor dan Status */}
        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Skor & Status</h4>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>AMI</strong><br/>
                    <small>{audits[0]?.org_unit?.name ?? "Belum ada audit"}</small>
                  </div>
                  <span className="badge badge-primary">Skor: {audits[0]?.score ?? 0}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>RTM</strong><br/>
                    <small>{meetings[0]?.title ?? "Belum ada RTM"}</small>
                  </div>
                  <span className="badge badge-warning">{meetings[0]?.status ?? "-"}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Survei</strong><br/>
                    <small>{surveys[0]?.title ?? "Belum ada survei"}</small>
                  </div>
                  <span className="badge badge-info">{surveys[0]?.target ?? "-"}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Prioritas Kerja */}
        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Prioritas Kerja</h4>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <i className="la la-check text-success me-2"></i> Upload dokumen standar
                </li>
                <li className="list-group-item">
                  <i className="la la-check text-success me-2"></i> Catat AMI & temuan per unit
                </li>
                <li className="list-group-item">
                  <i className="la la-check text-success me-2"></i> Generate RTM dan RTL
                </li>
              </ul>
              <p className="mt-3 text-muted"><small>Urutan kerja ini menjaga alur SPMI tetap konsisten.</small></p>
            </div>
          </div>
        </div>

        {/* Repository Dokumen (Preview) */}
        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Grup Dokumen</h4>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                {catalog.documentGroups.slice(0, 6).map((item) => (
                    <span className="badge badge-outline-primary mb-2 me-2" key={item}>{item}</span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Status PPEPP</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered verticle-middle table-responsive-sm">
                  <thead>
                    <tr>
                      <th scope="col">Tahap</th>
                      <th scope="col">Deskripsi</th>
                      <th scope="col">Deliverable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.ppeppSteps.map((step, index) => (
                      <tr key={`${step.name}-${index}`}>
                        <td><strong>{step.name}</strong></td>
                        <td>{step.description}</td>
                        <td><span className="badge badge-light text-dark">{step.deliverable}</span></td>
                      </tr>
                    ))}
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
