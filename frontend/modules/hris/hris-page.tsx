import { getCatalogSnapshot } from "@/lib/spmi-catalog-api";
import { HrisEmployeeManager } from "@/components/hris/hris-employee-manager";
import { HrisPanelManager } from "@/components/hris/hris-panel-manager";
import { HrisModuleMenu, HrisStructureMap } from "@/components/hris/hris-module-menu";

export async function HrisPage() {
  const catalog = await getCatalogSnapshot();
  const hris = catalog.hris;

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>HRIS / Sumber Daya Manusia</h4>
            <p className="mb-0">Master pegawai, jabatan, kompetensi, dan eviden SDM Universitas Junrejo Indah.</p>
          </div>
        </div>
        <div className="col-sm-6 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
            <li className="breadcrumb-item active"><a href="/hris">HRIS</a></li>
          </ol>
        </div>
      </div>

      <HrisModuleMenu />

      <div className="row" id="hris-dashboard">
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

      <div className="row" id="hris-spmi">
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

      <HrisStructureMap />

      <div id="hris-pegawai-input">
        <HrisEmployeeManager initialEmployees={hris.employees} />
      </div>
      <HrisPanelManager
        employees={hris.employees}
        initialPositions={hris.positions}
        initialCompetencies={hris.competencies}
        initialDocuments={hris.documents}
      />
    </>
  );
}
