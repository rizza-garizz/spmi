import { getPpeppCycles } from "@/lib/spmi-catalog-api";
import { RoleGate } from "@/components/auth/RoleGate";
import { CreatePpeppCycleForm } from "@/components/isian/ppepp/create-ppepp-cycle-form";
import { NilaiCardGrid } from "@/components/nilai/core";
import { ProgressiveSection } from "@/components/support/progressive-section";

export default async function PpeppPage() {
  let cycles: any[] = [];
  try {
    cycles = await getPpeppCycles();
  } catch {
    cycles = [];
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-panel">
          <span className="eyebrow">Workflow</span>
          <h1>PPEPP Tracker</h1>
          <p className="hero-copy">
            Mengikat pelaksanaan standar, evaluasi, pengendalian, dan peningkatan ke satu siklus
            mutu yang bisa ditelusuri per periode.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Siklus Berjalan</h2>
            <p>Daftar ini menunjukkan konteks periode kerja yang sedang dipantau.</p>
          </div>
          <div className="section-tag">Cycle view</div>
        </div>
        <NilaiCardGrid
          columns={3}
          items={(cycles.length > 0 ? cycles : [{ name: "Siklus 2025/2026" }]).map((cycle, index) => ({
            key: String(cycle.id ?? index),
            title: cycle.name,
            lines: [`${cycle.period ?? "yearly"} · ${cycle.status ?? "planned"}`],
          }))}
        />
      </section>

      <section className="section">
        <RoleGate
          allowedRoles={["admin_lpm", "kaprodi", "sekprodi", "unit_kerja"]}
          fallback={
            <div className="glass auth-card">
              <p className="hero-copy" style={{ marginTop: 0 }}>
                Role Anda berada pada mode baca. Penambahan siklus PPEPP hanya tersedia untuk admin/LPM, kaprodi, sekprodi, atau unit kerja.
              </p>
            </div>
          }
        >
          <ProgressiveSection
            eyebrow="Workflow"
            title="Kelola Siklus PPEPP"
            description="Siklus berjalan tetap mudah dipantau. Form tambah siklus dibuka hanya saat operator perlu membuat periode baru."
            actionLabel="Tambah Siklus"
          >
            <CreatePpeppCycleForm initialItems={cycles} />
          </ProgressiveSection>
        </RoleGate>
      </section>
    </main>
  );
}
