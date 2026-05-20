import { getCatalogSnapshot, getStandards } from "@/lib/spmi-catalog-api";
import { CreateStandardForm } from "@/components/isian/standards/create-standard-form";
import { RoleGate } from "@/components/auth/RoleGate";
import { ProgressiveSection } from "@/components/support/progressive-section";

export async function StandardsPage() {
  const catalog = await getCatalogSnapshot();
  let standards: Array<any> = [];
  try {
    standards = await getStandards();
  } catch {
    standards = catalog.standards;
  }

  const standardsData = standards;

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Master Data Standar Mutu</h4>
            <p className="mb-0">Mengelola standar pendidikan, penelitian, PkM, dan standar tambahan.</p>
          </div>
        </div>
        <div className="col-sm-6 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item active"><a href="/standards">Standar</a></li>
          </ol>
        </div>
      </div>

      <div className="row">
        {/* Kategori Standar */}
        {catalog.standardCategories.map((category) => (
          <div className="col-xl-3 col-xxl-3 col-md-6 col-sm-6" key={category.key}>
            <div className="card text-center">
              <div className="card-body">
                <div className="text-primary mb-2">
                  <i className="la la-book" style={{ fontSize: "2rem" }}></i>
                </div>
                <h5 className="card-title">{category.label}</h5>
                <p className="card-text text-muted" style={{ fontSize: "0.8rem" }}>{category.scope}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Daftar Standar Mutu Tersedia</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered verticle-middle table-responsive-sm">
                  <thead>
                    <tr>
                      <th scope="col">Kode</th>
                      <th scope="col">Judul Standar</th>
                      <th scope="col">Kategori</th>
                      <th scope="col">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standardsData.map((standard) => (
                      <tr key={standard.id || standard.code}>
                        <td><strong>{standard.code ?? "-"}</strong></td>
                        <td>
                          {standard.title}
                          {standard.description && <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>{standard.description}</p>}
                        </td>
                        <td><span className="badge badge-primary">{standard.category}</span></td>
                        <td>
                          <RoleGate
                            allowedRoles={["admin_lpm"]}
                            fallback={<span className="text-muted">Read only</span>}
                          >
                            <span>
                              <a href="#" className="me-4" data-bs-toggle="tooltip" data-placement="top" title="Edit"><i className="fa fa-pencil color-muted"></i> </a>
                              <a href="#" data-bs-toggle="tooltip" data-placement="top" title="Hapus"><i className="fa fa-close color-danger"></i></a>
                            </span>
                          </RoleGate>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RoleGate allowedRoles={["admin_lpm"]}>
        <div className="row">
          <div className="col-xl-12 col-xxl-12 col-sm-12">
            <ProgressiveSection
              eyebrow="Master Data"
              title="Kelola Standar Mutu"
              description="Daftar standar tetap menjadi fokus utama. Form tambah dibuka hanya saat diperlukan."
              actionLabel="Tambah Standar"
            >
              <div className="card">
                <div className="card-body">
                  <CreateStandardForm
                    initialItems={standardsData}
                    categories={catalog.standardCategories}
                  />
                </div>
              </div>
            </ProgressiveSection>
          </div>
        </div>
      </RoleGate>
    </>
  );
}
