const path = require("path");

const catalog = require(path.resolve(__dirname, "../../../frontend/data/spmi-catalog.json"));

const state = {
  standards: catalog.standards.map((item, index) => ({
    id: `std-${index + 1}`,
    ...item,
  })),
  documents: catalog.documents.map((item) => ({
    id: item.id,
    code: `DOC-${String(item.id).padStart(3, "0")}`,
    title: item.title,
    type: item.type,
    status: item.status,
    current_version: "1.0",
    versions: [
      {
        id: item.id * 10,
        version_number: 1,
        file_name: `${item.title}.pdf`,
        file_path: `/mock-downloads/${item.id}`,
        file_size: 0,
        created_at: new Date().toISOString(),
      },
    ],
  })),
  audits: catalog.amiAudits.map((item) => ({
    id: item.id,
    audit_date: "2026-05-01",
    score: item.score,
    status: item.status,
    org_unit: item.org_unit,
    findings: [],
  })),
  meetings: catalog.rtmMeetings.map((item) => ({
    id: item.id,
    title: item.title,
    meeting_date: "2026-05-15",
    status: item.status,
    conclusion: item.status === "done" ? "Tindak lanjut disetujui." : null,
    actions:
      item.id === 1
        ? [
            {
              id: 101,
              action_item: "Finalisasi revisi SOP evaluasi pembelajaran lintas prodi.",
              due_date: "2026-05-20",
              status: "in_progress",
              progress: 65,
              owner_notes: "Draft revisi sudah direview LPM, menunggu sinkronisasi final.",
              unit: { name: "LPM" },
              updated_at: "2026-05-10T08:00:00.000Z",
            },
            {
              id: 102,
              action_item: "Lengkapi eviden tindak lanjut AMI untuk standar sarana.",
              due_date: "2026-05-24",
              status: "open",
              progress: 20,
              owner_notes: "Pengumpulan eviden dari fakultas masih berjalan.",
              unit: { name: "Fakultas Ilmu Komputer" },
              updated_at: "2026-05-09T09:30:00.000Z",
            },
          ]
        : [
            {
              id: 201,
              action_item: "Siapkan daftar prioritas temuan AMI untuk RTM berikutnya.",
              due_date: "2026-05-28",
              status: "open",
              progress: 10,
              owner_notes: "Belum ada pembaruan dari unit kerja.",
              unit: { name: "Program Studi Sistem Informasi" },
              updated_at: "2026-05-11T10:15:00.000Z",
            },
          ],
  })),
  indicators: [
    {
      id: 1,
      code: "IKU-1",
      name: "Kepuasan Pemangku Kepentingan",
      description: "Rata-rata skor kepuasan stakeholder internal dan eksternal.",
      target_value: 4,
      unit: "skor",
      source_type: "manual",
      standard: { id: 1, code: "STD-TAM-01", title: "Standar Tata Pamong" },
      latest_value: {
        actual_value: 3.82,
        period: "2026-Q1",
        status: "warning",
        notes: "Perlu penguatan follow up layanan.",
      },
      history: [
        { actual_value: 3.45, period: "2025-Q1", status: "warning", created_at: "2025-03-31" },
        { actual_value: 3.61, period: "2025-Q2", status: "warning", created_at: "2025-06-30" },
        { actual_value: 3.74, period: "2025-Q3", status: "warning", created_at: "2025-09-30" },
        { actual_value: 3.82, period: "2026-Q1", status: "warning", created_at: "2026-03-31" },
      ],
    },
    {
      id: 2,
      code: "IKU-2",
      name: "Ketercapaian Dokumen Mutu",
      description: "Persentase dokumen mutu aktif yang sudah terversi.",
      target_value: 100,
      unit: "%",
      source_type: "manual",
      standard: { id: 2, code: "STD-TAM-03", title: "Standar Sistem Informasi Mutu" },
      latest_value: {
        actual_value: 82.4,
        period: "2026-Q1",
        status: "warning",
        notes: "Masih ada dokumen belum diperbarui.",
      },
      history: [
        { actual_value: 65, period: "2025-Q1", status: "warning", created_at: "2025-03-31" },
        { actual_value: 71, period: "2025-Q2", status: "warning", created_at: "2025-06-30" },
        { actual_value: 76.5, period: "2025-Q3", status: "warning", created_at: "2025-09-30" },
        { actual_value: 82.4, period: "2026-Q1", status: "warning", created_at: "2026-03-31" },
      ],
    },
    {
      id: 3,
      code: "IKU-3",
      name: "Tindak Lanjut AMI",
      description: "Persentase temuan AMI yang sudah masuk fase tindak lanjut.",
      target_value: 100,
      unit: "%",
      source_type: "manual",
      standard: { id: 3, code: "STD-TAM-04", title: "Standar Audit Internal" },
      latest_value: {
        actual_value: 68,
        period: "2026-Q1",
        status: "warning",
        notes: "Perlu akselerasi penutupan temuan.",
      },
      history: [
        { actual_value: 48, period: "2025-Q1", status: "danger", created_at: "2025-03-31" },
        { actual_value: 57, period: "2025-Q2", status: "warning", created_at: "2025-06-30" },
        { actual_value: 63, period: "2025-Q3", status: "warning", created_at: "2025-09-30" },
        { actual_value: 68, period: "2026-Q1", status: "warning", created_at: "2026-03-31" },
      ],
    },
  ],
  ppeppCycles: catalog.ppeppCycles.map((item) => ({
    id: item.id,
    name: item.name,
    period: item.period,
    status: item.status,
  })),
  surveys: catalog.surveys.map((item) => ({
    id: item.id,
    title: item.title,
    target: item.target,
    status: "published",
  })),
  imports: catalog.imports.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    status: item.status,
  })),
};

function getCatalogSnapshot() {
  return {
    ...catalog,
    standards: state.standards,
    documents: state.documents,
    amiAudits: state.audits,
    rtmMeetings: state.meetings,
    ppeppCycles: state.ppeppCycles,
    surveys: state.surveys,
    imports: state.imports,
  };
}

function getDashboardSummary() {
  return {
    metrics: catalog.metrics,
    modules: catalog.dashboardModules,
    performance: state.indicators.map((item) => ({
      code: item.code,
      name: item.name,
      actual: item.latest_value?.actual_value ?? 0,
      target: item.target_value,
      unit: item.unit,
      status: item.latest_value?.status ?? "No Data",
      history: item.history.map((entry) => entry.actual_value),
    })),
  };
}

function addStandard(data) {
  const item = {
    id: `std-${Date.now()}`,
    code: data.code || `STD-${Date.now()}`,
    title: data.title,
    category: data.category,
    description: data.description || "",
  };
  state.standards.unshift(item);
  return item;
}

function addDocument(data) {
  const id = Date.now();
  const item = {
    id,
    code: data.code || `DOC-${id}`,
    title: data.title,
    type: data.type || "kebijakan",
    status: "draft",
    current_version: "1.0",
    versions: [
      {
        id: id * 10,
        version_number: 1,
        file_name: data.file_name || `${data.title || "document"}.pdf`,
        file_path: `/mock-downloads/${id}`,
        file_size: 0,
        created_at: new Date().toISOString(),
      },
    ],
  };
  state.documents.unshift(item);
  return item;
}

function addFinding(auditId, data) {
  const audit = state.audits.find((item) => String(item.id) === String(auditId));
  const finding = {
    id: Date.now(),
    description: data.description || "",
    severity: data.severity || "observation",
    recommendation: data.recommendation || "",
    root_cause: data.root_cause || "",
  };
  if (audit) {
    audit.findings = audit.findings || [];
    audit.findings.unshift(finding);
  }
  return finding;
}

function addMeeting(data) {
  const item = {
    id: Date.now(),
    title: data.title,
    meeting_date: data.meeting_date,
    status: "scheduled",
    conclusion: data.conclusion || null,
    actions: [],
  };
  state.meetings.unshift(item);
  return item;
}

function updateMeetingAction(meetingId, actionId, data) {
  const meeting = state.meetings.find((item) => String(item.id) === String(meetingId));
  if (!meeting) {
    return null;
  }

  const action = meeting.actions?.find((item) => String(item.id) === String(actionId));
  if (!action) {
    return null;
  }

  const nextStatus = data.status || action.status;
  const rawProgress = Number.isFinite(Number(data.progress)) ? Number(data.progress) : action.progress ?? 0;
  const nextProgress = Math.min(100, Math.max(0, rawProgress));

  action.status = nextStatus;
  action.progress = nextStatus === "done" ? 100 : nextProgress;
  action.owner_notes = data.owner_notes ?? action.owner_notes ?? null;
  action.updated_at = new Date().toISOString();

  return {
    meeting_id: meeting.id,
    meeting: { title: meeting.title },
    ...action,
  };
}

function addPpeppCycle(data) {
  const item = {
    id: Date.now(),
    name: data.name || `Siklus ${new Date().getFullYear()}`,
    period: data.period || "yearly",
    status: data.status || "planned",
    academic_year_start: data.academic_year_start || null,
    academic_year_end: data.academic_year_end || null,
  };
  state.ppeppCycles.unshift(item);
  return item;
}

function addAmiAudit(data) {
  const item = {
    id: Date.now(),
    audit_date: data.audit_date || null,
    score: Number(data.score || 0),
    status: data.status || "draft",
    org_unit: {
      name: data.org_unit_name || `Unit ${data.org_unit_id || "Lokal"}`,
    },
    findings: data.finding_summary
      ? [
          {
            id: Date.now() + 1,
            description: data.finding_summary,
            severity: "observation",
            recommendation: "",
            root_cause: "",
          },
        ]
      : [],
  };
  state.audits.unshift(item);
  return item;
}

function addIndicator(data) {
  const item = {
    id: Date.now(),
    code: data.code,
    name: data.name,
    description: data.description || "",
    target_value: Number(data.target_value || 0),
    unit: data.unit || "%",
    source_type: data.source_type || "manual",
    standard: data.mutu_standard_id
      ? { id: data.mutu_standard_id, code: String(data.mutu_standard_id), title: "Standar terkait" }
      : null,
    latest_value: null,
    history: [],
  };
  state.indicators.unshift(item);
  return item;
}

function addIndicatorValue(indicatorId, data) {
  const indicator = state.indicators.find((item) => String(item.id) === String(indicatorId));
  if (!indicator) {
    return null;
  }

  const actual = Number(data.actual_value || 0);
  const status = actual >= indicator.target_value ? "success" : actual > indicator.target_value * 0.5 ? "warning" : "danger";
  const value = {
    actual_value: actual,
    period: data.period,
    status,
    notes: data.notes || "",
    created_at: new Date().toISOString(),
  };

  indicator.latest_value = value;
  indicator.history.unshift(value);
  return value;
}

function addSurvey(data) {
  const item = {
    id: Date.now(),
    title: data.title || "Survei Baru",
    target: data.target || "mahasiswa",
    status: data.status || "draft",
    ppepp_cycle_id: data.ppepp_cycle_id || null,
  };

  state.surveys.unshift(item);
  return item;
}

function addImport(data) {
  const item = {
    id: Date.now(),
    type: data.type || "lkpt",
    title: data.title || "Import Baru",
    status: data.status || "queued",
    file_name: data.file_name || "mock-import.xlsx",
  };

  state.imports.unshift(item);
  return item;
}

module.exports = {
  state,
  getCatalogSnapshot,
  getDashboardSummary,
  addStandard,
  addDocument,
  addFinding,
  addMeeting,
  updateMeetingAction,
  addPpeppCycle,
  addAmiAudit,
  addIndicator,
  addIndicatorValue,
  addSurvey,
  addImport,
};
