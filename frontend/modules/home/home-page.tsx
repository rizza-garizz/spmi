import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { businessProcessFlow, moduleRegistry } from "@/lib/module-registry";

const cardColors = ["bg-primary", "bg-success", "bg-info", "bg-warning", "bg-danger", "bg-dark"] as const;
const coreModules = moduleRegistry
  .flatMap((section) => section.children)
  .filter((node) => ["/organization", "/standards", "/indicators", "/ppepp", "/ami", "/rtl", "/nilai", "/dashboard"].includes(node.href))
  .map((node, index) => ({ ...node, color: cardColors[index % cardColors.length] }));

export async function HomePage() {
  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Selamat Datang di SPMI Universitas Junrejo Indah</h4>
            <p className="mb-0">Pintu masuk utama untuk seluruh kegiatan kerja mutu harian.</p>
          </div>
        </div>
        <div className="col-sm-6 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item active"><a href="/">Beranda</a></li>
          </ol>
        </div>
      </div>

      <div className="row">
        {/* Welcome Card */}
        <div className="col-xl-12 col-xxl-12 col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Alur Kerja Utama SPMI</h4>
            </div>
            <div className="card-body">
              <p>Mulai dari master data, tetapkan standar, jalankan PPEPP, evaluasi lewat AMI, kendalikan RTL/RTM, lalu tutup dengan peningkatan dan pelaporan.</p>
              <div className="business-flow-strip" aria-label="Alur proses bisnis SPMI">
                {businessProcessFlow.map((step) => (
                  <a href={step.href} key={step.step}>
                    <strong>{step.step}</strong>
                    <span>{step.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Core Modules Grid */}
        {coreModules.map((item) => (
          <RoleGate key={item.href} allowedRoles={[...item.roles]}>
            <div className="col-xl-4 col-xxl-4 col-md-6 col-sm-6">
              <div className={`widget-stat card ${item.color}`}>
                <div className="card-body">
                  <div className="media">
                    <span className="me-3">
                      <i className={`la ${item.icon}`}></i>
                    </span>
                    <div className="media-body text-white text-right">
                      <p className="mb-1 text-white">{item.label}</p>
                      <h3 className="text-white">Akses</h3>
                    </div>
                  </div>
                  <div className="mt-3 text-white">
                    <p style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: 15, minHeight: "40px" }}>
                      {item.description}
                    </p>
                    <Link href={item.href as any} className="btn btn-light btn-sm text-dark">
                      Buka Modul
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </RoleGate>
        ))}
      </div>

      {/* Value Pillars Row */}
      <div className="row">
        <div className="col-xl-4 col-xxl-4 col-md-12">
          <div className="card text-white bg-dark">
            <div className="card-header">
              <h5 className="card-title text-white">Ringkas</h5>
            </div>
            <div className="card-body mb-0">
              <p className="card-text">User diarahkan mengikuti urutan kerja mutu: master data, standar, PPEPP, evaluasi, pengendalian, peningkatan.</p>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-xxl-4 col-md-12">
          <div className="card text-white bg-dark">
            <div className="card-header">
              <h5 className="card-title text-white">Jelas</h5>
            </div>
            <div className="card-body mb-0">
              <p className="card-text">Dashboard diposisikan sebagai monitoring pimpinan, bukan awal proses operasional.</p>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-xxl-4 col-md-12">
          <div className="card text-white bg-dark">
            <div className="card-header">
              <h5 className="card-title text-white">Operasional</h5>
            </div>
            <div className="card-body mb-0">
              <p className="card-text">RTL dan RTM muncul setelah AMI supaya tindak lanjut terasa sebagai kelanjutan proses, bukan menu terpisah.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
