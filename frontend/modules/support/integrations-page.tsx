import { getCatalogSnapshot, getIntegrations } from "@/lib/spmi-catalog-api";
import { NilaiCardGrid } from "@/components/nilai/core";

const checkLabels: Record<string, string> = {
  synchronization: "Sinkronisasi data",
  master_consistency: "Konsistensi master",
  duplicate_data: "Duplicate data",
  api_error_handling: "Error API handling",
  integration_logging: "Logging integrasi",
};

const statusLabels: Record<string, string> = {
  ok: "Aman",
  ready: "Siap",
  warning: "Perlu Review",
  planned: "Planned",
  failed: "Gagal",
  synced: "Synced",
  synced_with_warning: "Synced + Warning",
  checked: "Checked",
};

export async function IntegrationsPage() {
  const data = await getIntegrations();
  const catalog = await getCatalogSnapshot();
  const requiredSystems = ["SIAKAD", "SIMPEG", "Keuangan", "Repository", "PDDIKTI", "SSO/IAM"];
  const readinessSummary = data.sources.reduce(
    (acc, source) => {
      const status = source.readiness_status || source.last_status || source.status || "planned";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-panel">
          <span className="eyebrow">Support</span>
          <h1>Integrasi Sistem</h1>
          <p className="hero-copy">
            Peta koneksi sumber data yang akan menyuplai indikator, role, dan bukti mutu Universitas Junrejo Indah.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Readiness Integrasi</h2>
            <p>Persiapan koneksi lintas sistem dibuat sebagai checklist operasional sebelum API produksi disambungkan.</p>
          </div>
          <div className="section-tag">Integration control</div>
        </div>
        <div className="metric-grid">
          {requiredSystems.map((system) => (
            <article className="metric-card" key={system}>
              <span className="metric-label">{system}</span>
              <strong>{data.sources.find((item) => item.domain === system || item.domain.includes(system))?.readiness_status || "planned"}</strong>
              <p>Master, duplicate, API error, dan logging disiapkan.</p>
            </article>
          ))}
        </div>
        <div className="toolbar-panel">
          {Object.entries(readinessSummary).map(([status, total]) => (
            <span className="badge badge-light" key={status}>
              {statusLabels[status] || status}: {total}
            </span>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Peta SIAKAD ke SPMI</h2>
            <p>Referensi awal dari SIAKAD diterjemahkan menjadi jalur data yang akan masuk ke modul mutu.</p>
          </div>
          <div className="section-tag">SIAKAD discovery</div>
        </div>
        <NilaiCardGrid
          columns={3}
          items={(catalog.siakadIntegrationMap || []).map((item) => ({
            key: item.key,
            title: item.source,
            lines: [item.siakadData, item.spmiUse],
          }))}
        />
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Daftar Integrasi</h2>
            <p>Setiap sumber ditampilkan sebagai status koneksi yang mudah dipindai.</p>
          </div>
          <div className="section-tag">System map</div>
        </div>
        <NilaiCardGrid
          columns={3}
          items={data.sources.map((source) => ({
            key: source.key,
            title: source.domain,
            lines: [
              `Status: ${statusLabels[source.readiness_status || source.last_status || source.status] || source.status}`,
              `Owner: ${source.owner || "-"}`,
              `Arah: ${source.sync_direction || "-"}`,
            ],
          }))}
        />
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Checklist Teknis</h2>
            <p>Setiap connector punya pemeriksaan yang sama supaya sinkronisasi tidak berjalan acak.</p>
          </div>
          <div className="section-tag">API governance</div>
        </div>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Sistem</th>
                <th>Master Data</th>
                <th>Sinkronisasi</th>
                <th>Duplicate</th>
                <th>Error API</th>
                <th>Logging</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map((source) => {
                const checks = source.checks || {};
                return (
                  <tr key={source.key}>
                    <td>
                      <strong>{source.domain}</strong>
                      <p>{(source.master_data || []).join(", ")}</p>
                    </td>
                    {["master_consistency", "synchronization", "duplicate_data", "api_error_handling", "integration_logging"].map((key) => (
                      <td key={key}>
                        <span className="badge badge-light">
                          {statusLabels[checks[key]?.status || "planned"] || checks[key]?.status || "planned"}
                        </span>
                        <p>{checks[key]?.message || `${checkLabels[key]} belum dipetakan.`}</p>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
