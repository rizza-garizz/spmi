import { getCatalogSnapshot, getSurveys } from "@/lib/spmi-catalog-api";
import { CreateSurveyForm } from "@/components/isian/surveys/create-survey-form";
import { ProgressiveSection } from "@/components/support/progressive-section";
import { ManagedCardGrid } from "@/components/support/managed-card-grid";

export default async function SurveysPage() {
  let surveys: any[] = [];
  const catalog = await getCatalogSnapshot();
  try {
    surveys = (await getSurveys()).data;
  } catch {
    surveys = [];
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-panel">
          <span className="eyebrow">Insight</span>
          <h1>Survei Pemangku Kepentingan</h1>
          <p className="hero-copy">
            Modul untuk dosen, tendik, mahasiswa, alumni, dan mitra sebagai input evaluasi mutu.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Daftar Survei</h2>
            <p>Survei dipetakan per target agar evaluasi lebih mudah dipresentasikan.</p>
          </div>
          <div className="section-tag">Stakeholder view</div>
        </div>
        <ManagedCardGrid
          columns={3}
          exportName="daftar-survei.csv"
          searchPlaceholder="Cari survei atau target responden..."
          items={(surveys.length > 0 ? surveys : [{ title: "Survei kepuasan mahasiswa", target: "mahasiswa" }]).map((survey, index) => ({
            key: String(survey.id ?? index),
            title: survey.title,
            lines: [survey.target ?? "-"],
          }))}
        />
      </section>

      <section className="section">
        <ProgressiveSection
          eyebrow="Insight"
          title="Kelola Survei"
          description="Daftar survei tetap bersih. Form survei baru dibuka hanya saat tim akan membuat instrumen."
          actionLabel="Tambah Survei"
        >
          <CreateSurveyForm initialItems={surveys} surveyTargets={catalog.surveyTargets} />
        </ProgressiveSection>
      </section>
    </main>
  );
}
