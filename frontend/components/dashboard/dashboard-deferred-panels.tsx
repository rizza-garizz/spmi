"use client";

import { useEffect, useState } from "react";
import { SimpleTrendChart } from "@/components/charts/SimpleTrendChart";
import { RadarCriteriaChart } from "@/components/charts/RadarCriteriaChart";

type DashboardAccreditationCardProps = {
  accreditation: {
    score: number;
    predicate: string;
    insight: string;
    criteria: Array<{ label: string; score: number }>;
  };
};

function DeferredPlaceholder({ title }: { title: string }) {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">{title}</h4>
      </div>
      <div className="card-body">
        <div className="spmi-skeleton" style={{ minHeight: 180 }} aria-hidden="true"></div>
      </div>
    </div>
  );
}

export function DashboardAccreditationCard({ accreditation }: DashboardAccreditationCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <DeferredPlaceholder title="Analisis 9 Kriteria Akreditasi (BAN-PT)" />;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Analisis 9 Kriteria Akreditasi (BAN-PT)</h4>
      </div>
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-6">
            <RadarCriteriaChart scores={accreditation.criteria} />
          </div>
          <div className="col-md-6">
            <div className="text-center mb-4">
              <h2 className="text-primary mb-0" style={{ fontSize: "3rem" }}>{accreditation.score}</h2>
              <span className="badge badge-success">PREDIKAT: {accreditation.predicate}</span>
              <p className="mt-2 text-muted">Estimasi skor berdasarkan data capaian indikator saat ini.</p>
            </div>
            <div className="alert alert-outline-primary small">
              <i className="la la-info-circle me-2"></i>
              <strong>Insights:</strong> {accreditation.insight}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPerformanceTable({ performanceItems, institutionName }: { performanceItems: any[]; institutionName: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="row">
        <div className="col-xl-12 col-xxl-12 col-lg-12">
          <DeferredPlaceholder title={`Monitoring Capaian IKU ${institutionName}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-xl-12 col-xxl-12 col-lg-12">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Monitoring Capaian IKU {institutionName}</h4>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered verticle-middle table-responsive-sm">
                <thead>
                  <tr>
                    <th scope="col">Kode IKU</th>
                    <th scope="col">Indikator Mutu</th>
                    <th scope="col">Unit</th>
                    <th scope="col">Standar</th>
                    <th scope="col">Progress (Actual)</th>
                    <th scope="col">Tren (5 Periode)</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceItems.map((item: any) => {
                    const safeTarget = Number(item?.target ?? 0);
                    const safeActual = Number(item?.actual ?? 0);
                    const percentage = safeTarget > 0 ? Math.min((safeActual / safeTarget) * 100, 100) : 0;
                    const barColor = percentage >= 100 ? "success" : percentage > 50 ? "warning" : "danger";

                    return (
                      <tr key={item.code ?? item.name}>
                        <td><strong>{item.code ?? "-"}</strong></td>
                        <td>{item.name ?? "Indikator"}</td>
                        <td>
                          <strong>{item.prodi || item.fakultas || item.org_unit_code || "-"}</strong>
                          <br /><small className="text-muted">{item.period || "-"}</small>
                        </td>
                        <td><small>{item.standard?.code || "-"}<br />{item.standard?.title || ""}</small></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1" style={{ height: "10px" }}>
                              <div className={`progress-bar bg-${barColor}`} role="progressbar" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="ms-2">{safeActual}/{safeTarget}{item.unit ?? ""}</span>
                          </div>
                        </td>
                        <td style={{ width: "200px" }}>
                          <SimpleTrendChart data={Array.isArray(item.history) ? item.history : []} target={safeTarget} unit={item.unit ?? ""} />
                        </td>
                        <td>
                          <span className={`badge badge-${barColor}`}>{item.status ?? "No Data"}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {performanceItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center">Belum ada data indikator yang dipantau.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
