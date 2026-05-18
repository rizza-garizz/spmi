import { getSurveys } from "@/lib/spmi-catalog-api";
import { CreateSurveyForm } from "@/components/isian/surveys/create-survey-form";
import { NilaiCardGrid } from "@/components/nilai/core";

export default async function SurveysPage() {
  let surveys: any[] = [];
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
        <NilaiCardGrid
          columns={3}
          items={(surveys.length > 0 ? surveys : [{ title: "Survei kepuasan mahasiswa", target: "mahasiswa" }]).map((survey, index) => ({
            key: String(survey.id ?? index),
            title: survey.title,
            lines: [survey.target ?? "-"],
          }))}
        />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Tambah Survei</h2>
            <p>Input baru bisa ditambahkan tanpa mengubah pola tampilan yang sudah seragam.</p>
          </div>
        </div>
        <CreateSurveyForm />
      </section>
    </main>
  );
}
