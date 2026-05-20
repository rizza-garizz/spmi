import { CreateImportForm } from "@/components/isian/imports/create-import-form";
import { AoaMigrationForm } from "@/components/isian/imports/aoa-migration-form";
import { getCatalogSnapshot, getDashboardSummary, getImports } from "@/lib/spmi-catalog-api";
import { NilaiCardGrid } from "@/components/nilai/core";
import { ProgressiveSection } from "@/components/support/progressive-section";

export default async function ImportsPage() {
  let summary = { metrics: [] as Array<{ label: string; value: number }> };
  let imports = { data: [] as Array<{ id: number; type: string; title: string; status: string }> };
  const catalog = await getCatalogSnapshot();

  try {
    summary = await getDashboardSummary();
    imports = await getImports();
  } catch {
    //
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-panel">
          <span className="eyebrow">Import</span>
          <h1>LKPT, LKPS, dan KKM</h1>
          <p className="hero-copy">
            Upload spreadsheet dan instrumen evaluasi ke portal SPMI untuk memulai proses olah data,
            validasi, dan tracking status import.
          </p>
        </div>
      </section>

      <section className="section">
        <ProgressiveSection
          eyebrow="Data Ingest"
          title="Upload Import"
          description="Riwayat dan ringkasan tetap terlihat lebih dulu. Upload spreadsheet dibuka saat operator sudah siap mengirim data."
          actionLabel="Upload Data"
        >
          <CreateImportForm initialItems={imports.data} importTypes={catalog.importTypes} />
        </ProgressiveSection>
      </section>

      <section className="section">
        <ProgressiveSection
          eyebrow="Safe Migration"
          title="Migrasi AOA"
          description="Preview migrasi dibuat terpisah agar proses validasi tidak bercampur dengan dashboard utama."
          actionLabel="Buka Migrasi"
        >
          <AoaMigrationForm />
        </ProgressiveSection>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Ringkasan Mutu</h2>
            <p>Angka ini menjaga ringkasan tetap informatif walau backend belum lengkap.</p>
          </div>
        </div>
        <NilaiCardGrid
          columns={4}
          items={(summary.metrics.length > 0
            ? summary.metrics
            : [
                { label: "Standar aktif", value: 0 },
                { label: "Dokumen aktif", value: 0 },
                { label: "RTL berjalan", value: 0 },
                { label: "Temuan audit", value: 0 },
              ]
          ).map((metric) => ({
            key: metric.label,
            title: metric.label,
            lines: [metric.value],
          }))}
        />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Riwayat Import</h2>
            <p>Riwayat ini menunjukkan bagaimana status import akan terlihat di UI.</p>
          </div>
        </div>
        <NilaiCardGrid
          columns={3}
          items={(imports.data.length > 0
            ? imports.data
            : [
                { id: 1, type: "lkpt", title: "Import LKPT", status: "processed" },
                { id: 2, type: "lkps", title: "Import LKPS", status: "queued" },
              ]
          ).map((item) => ({
            key: String(item.id),
            title: item.title,
            lines: [`${item.type} · ${item.status}`],
          }))}
        />
      </section>
    </main>
  );
}
