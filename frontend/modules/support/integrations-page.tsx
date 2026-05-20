import { getCatalogSnapshot, getIntegrations } from "@/lib/spmi-catalog-api";
import { NilaiCardGrid } from "@/components/nilai/core";

export async function IntegrationsPage() {
  const data = await getIntegrations();
  const catalog = await getCatalogSnapshot();

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
            lines: [`Status: ${source.status}`],
          }))}
        />
      </section>
    </main>
  );
}
