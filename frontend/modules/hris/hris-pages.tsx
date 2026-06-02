import { getHrisSummary } from "@/lib/spmi-catalog-api";
import { HrisModuleMenu, HrisStructureMap } from "@/components/hris/hris-module-menu";
import { DeferredHrisEmployeeManager, DeferredHrisPanelManager } from "@/components/hris/deferred-hris-managers";

type EmployeeTypeFilter = "Dosen" | "Tendik" | "Dosen dengan Tugas Tambahan";

function HrisHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="row page-titles mx-0">
      <div className="col-sm-6 p-md-0">
        <div className="welcome-text">
          <h4>{title}</h4>
          <p className="mb-0">{subtitle}</p>
        </div>
      </div>
      <div className="col-sm-6 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
          <li className="breadcrumb-item"><a href="/hris">HRIS</a></li>
          <li className="breadcrumb-item active" aria-current="page">{title}</li>
        </ol>
      </div>
    </div>
  );
}

export async function HrisOverviewPage() {
  const hris = await getHrisSummary();

  return (
    <>
      <HrisHeader title="HRIS / Sumber Daya Manusia" subtitle="Ringkasan sumber daya manusia Universitas Junrejo Indah." />
      <HrisModuleMenu />
      <div className="row">
        {hris.metrics.map((metric, index) => (
          <div className="col-xl-3 col-xxl-3 col-md-6 col-sm-6" key={metric.label}>
            <div className={`widget-stat card ${["bg-success", "bg-info", "bg-warning", "bg-danger"][index % 4]}`}>
              <div className="card-body p-4">
                <div className="media">
                  <span className="me-3"><i className="la la-user-tie"></i></span>
                  <div className="media-body text-white text-end">
                    <p className="mb-1 text-white">{metric.label}</p>
                    <h3 className="text-white">{metric.value}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <HrisStructureMap />
    </>
  );
}

export async function HrisMasterStructurePage() {
  return (
    <>
      <HrisHeader title="Master SDM" subtitle="Struktur parent-child untuk data pegawai, dosen, tendik, dan tugas tambahan." />
      <HrisModuleMenu />
      <HrisStructureMap rootHref="/hris/master-sdm" />
    </>
  );
}

export async function HrisEmployeePage({ filterType }: { filterType?: EmployeeTypeFilter }) {
  const hris = await getHrisSummary();
  const title = filterType || "Master Pegawai";
  const employees = filterType
    ? hris.employees.filter((employee) => employee.type === filterType)
    : hris.employees;

  return (
    <>
      <HrisHeader title={title} subtitle="Kelola data pegawai dan identitas SDM." />
      <HrisModuleMenu />
      <DeferredHrisEmployeeManager initialEmployees={employees} />
    </>
  );
}

export async function HrisPositionPage({ structuralOnly = false }: { structuralOnly?: boolean }) {
  const hris = await getHrisSummary();
  const positions = structuralOnly
    ? hris.positions.filter((position) => !["Staff SDM", "Dosen Tetap"].includes(position.title))
    : hris.positions;

  return (
    <>
      <HrisHeader title={structuralOnly ? "Jabatan Struktural" : "Jabatan"} subtitle="Kelola jabatan aktif dan struktur penugasan SDM." />
      <HrisModuleMenu />
      {!structuralOnly ? <HrisStructureMap rootHref="/hris/jabatan" /> : null}
      <DeferredHrisPanelManager
        employees={hris.employees}
        initialPositions={positions}
        initialCompetencies={hris.competencies}
        initialDocuments={hris.documents}
        sections={["positions"]}
      />
    </>
  );
}

export async function HrisCompetencyPage({ category }: { category?: string }) {
  const hris = await getHrisSummary();

  return (
    <>
      <HrisHeader title={category || "Kompetensi"} subtitle="Kelola sertifikasi, pelatihan, dan kompetensi SDM." />
      <HrisModuleMenu />
      {!category ? <HrisStructureMap rootHref="/hris/kompetensi" /> : null}
      <DeferredHrisPanelManager
        employees={hris.employees}
        initialPositions={hris.positions}
        initialCompetencies={hris.competencies}
        initialDocuments={hris.documents}
        sections={["competencies"]}
        competencyCategory={category}
      />
    </>
  );
}

export async function HrisDocumentPage({ type, title }: { type?: string; title?: string }) {
  const hris = await getHrisSummary();

  return (
    <>
      <HrisHeader title={title || type || "Dokumen SDM"} subtitle="Kelola dokumen dan file eviden sumber daya manusia." />
      <HrisModuleMenu />
      {!type ? <HrisStructureMap rootHref="/hris/dokumen" /> : null}
      <DeferredHrisPanelManager
        employees={hris.employees}
        initialPositions={hris.positions}
        initialCompetencies={hris.competencies}
        initialDocuments={hris.documents}
        sections={["documents"]}
        documentType={type}
      />
    </>
  );
}

export async function HrisIntegrationPage({ focus }: { focus?: "standar" | "ami" }) {
  const hris = await getHrisSummary();

  return (
    <>
      <HrisHeader title={focus === "standar" ? "Standar SDM" : focus === "ami" ? "AMI & Akreditasi" : "Koneksi SPMI"} subtitle="Pemetaan HRIS sebagai sumber data dan eviden SPMI." />
      <HrisModuleMenu />
      {!focus ? <HrisStructureMap rootHref="/hris/integrasi-spmi" /> : null}
      <div className="row">
        <div className="col-xl-12 col-xxl-12 col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Koneksi HRIS ke SPMI</h4>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {hris.spmiLinks.map((item) => (
                  <li className="list-group-item" key={item}>
                    <i className="la la-check text-success me-2"></i>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
