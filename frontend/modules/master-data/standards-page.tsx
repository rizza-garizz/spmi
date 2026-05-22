import { getCatalogSnapshot, getStandards } from "@/lib/spmi-catalog-api";
import { CreateStandardForm } from "@/components/isian/standards/create-standard-form";
import { StandardsManager } from "@/components/isian/standards/standards-manager";
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

  const standardsData = Array.isArray(standards)
    ? standards
    : Array.isArray((standards as any)?.data)
      ? (standards as any).data
      : Array.isArray(catalog.standards)
        ? catalog.standards
        : [];
  const standardCategories = Array.isArray(catalog.standardCategories)
    ? catalog.standardCategories
    : [];

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Master Data Standar Mutu</h4>
            <p className="mb-0">Mengelola 7 kelompok standar, nomor otomatis, versi, dan riwayat revisi.</p>
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
        {standardCategories.map((category) => (
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
          <StandardsManager initialItems={standardsData} categories={standardCategories} />
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
                    categories={standardCategories}
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
