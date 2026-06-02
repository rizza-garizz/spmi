"use client";

import dynamic from "next/dynamic";

const HrisEmployeeManagerLazy = dynamic(
  () => import("@/components/hris/hris-employee-manager").then((module) => module.HrisEmployeeManager),
  {
    ssr: false,
    loading: () => <HrisManagerPlaceholder title="Master Pegawai" />,
  }
);

const HrisPanelManagerLazy = dynamic(
  () => import("@/components/hris/hris-panel-manager").then((module) => module.HrisPanelManager),
  {
    ssr: false,
    loading: () => <HrisManagerPlaceholder title="Area Kerja HRIS" />,
  }
);

function HrisManagerPlaceholder({ title }: { title: string }) {
  return (
    <div className="row">
      <div className="col-xl-12">
        <div className="hris-page-toolbar">
          <div>
            <span>Area Kerja</span>
            <strong>{title}</strong>
            <p>Memuat area kerja HRIS.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="spmi-skeleton" style={{ minHeight: 220 }} aria-hidden="true"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeferredHrisEmployeeManager(props: any) {
  return <HrisEmployeeManagerLazy {...props} />;
}

export function DeferredHrisPanelManager(props: any) {
  return <HrisPanelManagerLazy {...props} />;
}
