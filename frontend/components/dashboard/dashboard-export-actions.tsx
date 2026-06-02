"use client";

type ExportValue = string | number | null | undefined;

type DashboardExportActionsProps = {
  rows: ExportValue[][];
  institutionName: string;
  kpi: {
    total_indicators: number;
    average_achievement: number;
    achieved: number;
    risk: number;
  };
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadText(fileName: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function DashboardExportActions({ rows, institutionName, kpi }: DashboardExportActionsProps) {
  function exportCsv() {
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadText("dashboard-kpi-mutu.csv", "text/csv", csv);
  }

  function exportPdfHtml() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Dashboard KPI Mutu</title><style>body{font-family:Inter,Arial,sans-serif;color:#0f172a;padding:32px}h1{margin-bottom:4px}.kpi{display:flex;gap:12px;margin:20px 0}.kpi div{border:1px solid #e2e8f0;border-radius:12px;padding:12px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #e2e8f0;padding:8px;text-align:left}th{background:#f8fafc}</style></head><body><h1>Dashboard KPI Mutu</h1><p>${escapeHtml(institutionName)}</p><section class="kpi"><div>Total indikator: ${kpi.total_indicators}</div><div>Rata-rata: ${kpi.average_achievement}%</div><div>Tercapai: ${kpi.achieved}</div><div>Risiko: ${kpi.risk}</div></section><table>${rows.map((row, index) => `<tr>${row.map((value) => index === 0 ? `<th>${escapeHtml(String(value ?? ""))}</th>` : `<td>${escapeHtml(String(value ?? ""))}</td>`).join("")}</tr>`).join("")}</table><script>window.print()</script></body></html>`;
    downloadText("dashboard-kpi-mutu.pdf.html", "text/html", html);
  }

  return (
    <>
      <button className="btn btn-outline-primary" type="button" onClick={exportCsv}>Excel</button>
      <button className="btn btn-outline-primary" type="button" onClick={exportPdfHtml}>PDF</button>
    </>
  );
}
