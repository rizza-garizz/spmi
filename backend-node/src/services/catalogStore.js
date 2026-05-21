const path = require("path");

const catalog = require(path.resolve(__dirname, "../../data/spmi-catalog.json"));
const { getInitialApproval } = require("./accessPolicy");

const STANDARD_CATEGORIES = [
  { key: "pendidikan", label: "Pendidikan", prefix: "PEND" },
  { key: "penelitian", label: "Penelitian", prefix: "PEN" },
  { key: "pengabdian", label: "Pengabdian", prefix: "PENG" },
  { key: "tata_kelola", label: "Tata Kelola", prefix: "TK" },
  { key: "sdm", label: "SDM", prefix: "SDM" },
  { key: "keuangan", label: "Keuangan", prefix: "KEU" },
  { key: "sarpras", label: "Sarpras", prefix: "SAR" },
];

const INTEGRATION_CONNECTORS = [
  {
    key: "siakad",
    domain: "SIAKAD",
    status: "discovery",
    endpoint: "https://xd.ingenio.id",
    owner: "Akademik",
    master_data: ["mahasiswa", "dosen", "kurikulum", "kelas", "krs", "nilai", "unit"],
    sync_direction: "inbound",
  },
  {
    key: "simpeg",
    domain: "SIMPEG",
    status: "planned",
    endpoint: null,
    owner: "SDM",
    master_data: ["pegawai", "dosen", "tendik", "jabatan", "unit"],
    sync_direction: "inbound",
  },
  {
    key: "keuangan",
    domain: "Keuangan",
    status: "planned",
    endpoint: null,
    owner: "Keuangan",
    master_data: ["tagihan", "pembayaran", "anggaran", "unit"],
    sync_direction: "inbound",
  },
  {
    key: "repository",
    domain: "Repository",
    status: "planned",
    endpoint: null,
    owner: "LPM",
    master_data: ["dokumen", "evidence", "versi", "metadata"],
    sync_direction: "bidirectional",
  },
  {
    key: "pddikti",
    domain: "PDDIKTI",
    status: "planned",
    endpoint: null,
    owner: "Akademik",
    master_data: ["mahasiswa", "dosen", "prodi", "aktivitas_kuliah", "nilai"],
    sync_direction: "outbound",
  },
  {
    key: "sso_iam",
    domain: "SSO/IAM",
    status: "planned",
    endpoint: null,
    owner: "TIK",
    master_data: ["user", "role", "scope_unit", "session", "audit_log"],
    sync_direction: "inbound",
  },
];

const standardCategoryAliases = {
  pkm: "pengabdian",
  tambahan: "tata_kelola",
  tata_pamong: "tata_kelola",
  tata_kelola: "tata_kelola",
  "tata kelola": "tata_kelola",
  pendidikan: "pendidikan",
  penelitian: "penelitian",
  pengabdian: "pengabdian",
  sdm: "sdm",
  keuangan: "keuangan",
  sarpras: "sarpras",
};

function normalizeStandardCategory(category) {
  return standardCategoryAliases[String(category || "").toLowerCase()] || "tata_kelola";
}

function getStandardPrefix(category) {
  return STANDARD_CATEGORIES.find((item) => item.key === normalizeStandardCategory(category))?.prefix || "STD";
}

function getNextStandardCode(category, standards = state.standards) {
  const normalized = normalizeStandardCategory(category);
  const prefix = getStandardPrefix(normalized);
  const nextNumber =
    standards
      .filter((item) => normalizeStandardCategory(item.category) === normalized)
      .map((item) => Number(String(item.code || "").match(new RegExp(`^STD-${prefix}-(\\d+)$`))?.[1] || 0))
      .reduce((max, value) => Math.max(max, value), 0) + 1;

  return `STD-${prefix}-${String(nextNumber).padStart(2, "0")}`;
}

function normalizeInitialStandards(standards) {
  const counters = new Map();

  return standards.map((item, index) => {
    const category = normalizeStandardCategory(item.category);
    const prefix = getStandardPrefix(category);
    const nextNumber = (counters.get(category) || 0) + 1;
    counters.set(category, nextNumber);

    return {
      id: `std-${index + 1}`,
      ...item,
      code: `STD-${prefix}-${String(nextNumber).padStart(2, "0")}`,
      category,
      version: item.version || "1.0",
      status: item.status || "aktif",
      deleted_at: item.deleted_at || null,
      revisions: item.revisions || [
        {
          version: item.version || "1.0",
          action: "initial",
          note: "Versi awal standar dari katalog.",
          changed_at: "2026-05-20T00:00:00.000Z",
          changed_by: "system",
        },
      ],
    };
  });
}

function approvalSeed(step = "draft", status = "draft") {
  return {
    step,
    status,
    history: [],
  };
}

const PPEPP_STAGE_DEFINITIONS = [
  {
    key: "penetapan",
    label: "Penetapan",
    description: "Pengesahan standar, kebijakan, pedoman, dan dokumen final.",
    deliverable: "Standar yang ditetapkan dan dipublikasikan",
  },
  {
    key: "pelaksanaan",
    label: "Pelaksanaan",
    description: "Implementasi standar di unit kerja dan pencatatan bukti digital.",
    deliverable: "Bukti implementasi dan log aktivitas",
  },
  {
    key: "evaluasi",
    label: "Evaluasi",
    description: "Audit mutu internal, survei kepuasan, dan rekap borang evaluasi.",
    deliverable: "Temuan, skor, dan ringkasan evaluasi",
  },
  {
    key: "pengendalian",
    label: "Pengendalian",
    description: "RTM, tindak lanjut, dan kontrol pelaksanaan perbaikan.",
    deliverable: "RTL aktif dan status penyelesaian",
  },
  {
    key: "peningkatan",
    label: "Peningkatan",
    description: "Revisi standar berdasarkan hasil evaluasi dan kebutuhan terbaru.",
    deliverable: "Revisi standar dan rencana peningkatan",
  },
];

const AMI_FINDING_CATEGORIES = {
  minor: "Minor",
  mayor: "Mayor",
  major: "Mayor",
  observasi: "Observasi",
  observation: "Observasi",
};

const DEFAULT_AMI_INSTRUMENTS = [
  {
    id: "AMI-INS-01",
    code: "STD-PEND-01",
    title: "Kesesuaian standar pendidikan dan pembelajaran",
    status: "not_checked",
    score: null,
    notes: "",
  },
  {
    id: "AMI-INS-02",
    code: "STD-TK-01",
    title: "Kelengkapan tata kelola dan dokumen mutu",
    status: "not_checked",
    score: null,
    notes: "",
  },
  {
    id: "AMI-INS-03",
    code: "STD-SDM-01",
    title: "Kecukupan SDM dan pembagian tugas",
    status: "not_checked",
    score: null,
    notes: "",
  },
];

function normalizeAmiFindingCategory(value) {
  return AMI_FINDING_CATEGORIES[String(value || "").toLowerCase()] || "Observasi";
}

function normalizeAmiFinding(finding = {}) {
  const category = normalizeAmiFindingCategory(finding.category || finding.severity);
  const createdAt = finding.created_at || new Date().toISOString();
  return {
    id: finding.id || Date.now(),
    title: finding.title || category,
    description: finding.description || "",
    category,
    severity: category.toLowerCase(),
    recommendation: finding.recommendation || "",
    root_cause: finding.root_cause || "",
    follow_up: {
      plan: finding.follow_up?.plan || finding.rtlPlan || finding.recommendation || "",
      status: finding.follow_up?.status || finding.rtlStatus || "open",
      due_date: finding.follow_up?.due_date || finding.dueDate || null,
      progress: Number(finding.follow_up?.progress ?? 0),
      evidence: Array.isArray(finding.follow_up?.evidence) ? finding.follow_up.evidence : [],
    },
    verification: {
      status: finding.verification?.status || "pending",
      verified_by: finding.verification?.verified_by || null,
      verified_at: finding.verification?.verified_at || null,
      notes: finding.verification?.notes || "",
    },
    created_at: createdAt,
  };
}

function calculateAmiRecap(audit) {
  const findings = Array.isArray(audit.findings) ? audit.findings : [];
  const instruments = Array.isArray(audit.instruments) ? audit.instruments : [];
  const counts = findings.reduce(
    (acc, finding) => {
      const category = normalizeAmiFindingCategory(finding.category || finding.severity);
      if (category === "Mayor") acc.mayor += 1;
      if (category === "Minor") acc.minor += 1;
      if (category === "Observasi") acc.observasi += 1;
      return acc;
    },
    { minor: 0, mayor: 0, observasi: 0 }
  );
  const verified = findings.filter((finding) => finding.verification?.status === "verified").length;
  const openFollowUps = findings.filter((finding) => finding.follow_up?.status !== "done").length;
  const instrumentScore = instruments.length
    ? Math.round(
        instruments.reduce((sum, instrument) => sum + Number(instrument.score || 0), 0) / instruments.length
      )
    : 0;
  const score = Number(audit.score || instrumentScore || Math.max(0, 100 - counts.mayor * 12 - counts.minor * 6 - counts.observasi * 2));

  return {
    total_findings: findings.length,
    categories: counts,
    follow_up_open: openFollowUps,
    follow_up_done: findings.length - openFollowUps,
    verified,
    unverified: findings.length - verified,
    instrument_checked: instruments.filter((instrument) => instrument.status !== "not_checked").length,
    instrument_total: instruments.length,
    score,
  };
}

function buildAmiTimeline(item) {
  const existing = Array.isArray(item.timeline) ? item.timeline : [];
  if (existing.length) return existing;
  return [
    {
      at: item.created_at || "2026-05-20T00:00:00.000Z",
      actor: "system",
      action: "scheduled",
      note: "Audit dijadwalkan.",
    },
  ];
}

function normalizeAmiAudit(item) {
  const findings = Array.isArray(item.findings) ? item.findings : [];
  const instruments = Array.isArray(item.instruments) && item.instruments.length
    ? item.instruments
    : DEFAULT_AMI_INSTRUMENTS.map((instrument) => ({ ...instrument }));
  const audit = {
    ...item,
    title: item.title || `AMI ${item.org_unit?.name || "Unit"}`,
    scheduled_date: item.scheduled_date || item.audit_date || null,
    audit_date: item.audit_date || item.scheduled_date || null,
    auditor: item.auditor || {
      name: item.auditor_name || "Internal Auditor",
      email: item.auditor_email || "auditor@spmi.local",
      role: "auditor",
    },
    instruments,
    findings: findings.map((finding) => normalizeAmiFinding(finding)),
    timeline: buildAmiTimeline(item),
  };
  audit.recap = calculateAmiRecap(audit);
  audit.score = audit.recap.score;
  return audit;
}

function buildPpeppStages(source = {}) {
  const sourceStages = Array.isArray(source.stages) ? source.stages : [];
  return PPEPP_STAGE_DEFINITIONS.map((definition) => {
    const existing = sourceStages.find((item) => item.key === definition.key || item.name === definition.label) || {};
    const status = existing.status || (source.status === "closed" || source.status === "done" ? "completed" : "not_started");

    return {
      ...definition,
      status,
      progress: Number(existing.progress ?? (status === "completed" ? 100 : status === "in_progress" ? 50 : 0)),
      start_date: existing.start_date || null,
      due_date: existing.due_date || null,
      completed_at: existing.completed_at || null,
      notes: existing.notes || "",
      evidence: Array.isArray(existing.evidence) ? existing.evidence : [],
    };
  });
}

function buildPpeppTimeline(item) {
  const existing = Array.isArray(item.timeline) ? item.timeline : [];
  if (existing.length) return existing;

  return [
    {
      at: item.created_at || "2026-05-20T00:00:00.000Z",
      actor: "system",
      action: "created",
      stage: null,
      note: "Siklus PPEPP dibuat.",
    },
  ];
}

function calculatePpeppProgress(stages) {
  if (!stages.length) return 0;
  const total = stages.reduce((sum, stage) => sum + Number(stage.progress || 0), 0);
  return Math.round(total / stages.length);
}

function normalizePpeppCycle(item) {
  const stages = buildPpeppStages(item);
  return {
    ...item,
    current_stage: item.current_stage || stages.find((stage) => stage.status !== "completed")?.key || "peningkatan",
    stages,
    timeline: buildPpeppTimeline(item),
    progress: Number(item.progress ?? calculatePpeppProgress(stages)),
  };
}

const state = {
  standards: normalizeInitialStandards(catalog.standards),
  documents: catalog.documents.map((item) => ({
    id: item.id,
    code: `DOC-${String(item.id).padStart(3, "0")}`,
    title: item.title,
    type: item.type,
    status: item.status,
    org_unit_code: item.org_unit_code || (item.id % 2 === 0 ? "SI" : "LPM"),
    document_date: item.document_date || "2026-05-20",
    category: item.category || item.type,
    owner: item.owner || (item.id % 2 === 0 ? "Program Studi Sistem Informasi" : "LPM"),
    metadata: {
      tanggal: item.document_date || "2026-05-20",
      unit: item.org_unit_code || (item.id % 2 === 0 ? "SI" : "LPM"),
      kategori: item.category || item.type,
      penanggung_jawab: item.owner || (item.id % 2 === 0 ? "Program Studi Sistem Informasi" : "LPM"),
    },
    approval: approvalSeed(item.status === "approved" ? "approved" : "draft", item.status === "approved" ? "approved" : "draft"),
    current_version: "1.0",
    versions: [
      {
        id: item.id * 10,
        version_number: 1,
        file_name: `${item.title}.pdf`,
        file_path: `/mock-downloads/${item.id}`,
        file_size: 0,
        mime_type: "application/pdf",
        created_at: new Date().toISOString(),
      },
    ],
  })),
  audits: catalog.amiAudits.map((item) =>
    normalizeAmiAudit({
      id: item.id,
      audit_date: item.audit_date || "2026-05-01",
      scheduled_date: item.scheduled_date || "2026-05-01",
      score: item.score,
      status: item.status,
      org_unit: item.org_unit,
      org_unit_code: item.org_unit_code || "SI",
      approval: approvalSeed(item.status === "selesai" ? "approved" : "review_lpm", item.status === "selesai" ? "approved" : "in_review"),
      findings: item.findings || [],
      created_at: "2026-05-20T00:00:00.000Z",
    })
  ),
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
              org_unit_code: "LPM",
              approval: approvalSeed("review_lpm", "in_review"),
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
              org_unit_code: "FIKOM",
              approval: approvalSeed("review_fakultas", "in_review"),
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
              org_unit_code: "SI",
              approval: approvalSeed("review_prodi", "in_review"),
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
      org_unit_code: "SI",
      approval: approvalSeed("review_prodi", "in_review"),
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
      org_unit_code: "LPM",
      approval: approvalSeed("review_lpm", "in_review"),
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
      org_unit_code: "FIKOM",
      approval: approvalSeed("review_fakultas", "in_review"),
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
  ppeppCycles: catalog.ppeppCycles.map((item) =>
    normalizePpeppCycle({
      id: item.id,
      name: item.name,
      period: item.period,
      status: item.status,
      org_unit_code: item.org_unit_code || (item.id % 2 === 0 ? "FIKOM" : "SI"),
      approval: approvalSeed(item.status === "done" ? "approved" : "draft", item.status === "done" ? "approved" : "draft"),
      created_at: "2026-05-20T00:00:00.000Z",
    })
  ),
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
  integrations: INTEGRATION_CONNECTORS.map((connector) => ({
    ...connector,
    last_sync_at: null,
    last_status: connector.status === "discovery" ? "ready_for_mapping" : "planned",
    error_count: 0,
  })),
  integrationLogs: [],
  auditLogs: [],
  hris: {
    metrics: catalog.hris.metrics.map((item) => ({ ...item })),
    employees: catalog.hris.employees.map((item) => ({ ...item })),
    positions: catalog.hris.positions.map((item, index) => ({ id: item.id || `POS-${index + 1}`, ...item })),
    competencies: catalog.hris.competencies.map((item, index) => ({ id: item.id || `CMP-${index + 1}`, ...item })),
    documents: catalog.hris.documents.map((item, index) => ({ id: item.id || `DOC-HR-${index + 1}`, ...item })),
    spmiLinks: [...catalog.hris.spmiLinks],
  },
};

function getCatalogSnapshot() {
  return {
    ...catalog,
    standardCategories: STANDARD_CATEGORIES.map(({ key, label }) => ({
      key,
      label,
      scope: catalog.standardCategories.find((item) => item.key === key)?.scope || "",
    })),
    standards: getActiveStandards(),
    documents: state.documents,
    amiAudits: state.audits,
    rtmMeetings: state.meetings,
    ppeppCycles: state.ppeppCycles,
    surveys: state.surveys,
    imports: state.imports,
    integrations: getIntegrations(),
    hris: state.hris,
  };
}

function getHrisSummary() {
  return state.hris;
}

function getHrisEmployeeProfile(employeeId) {
  const employee = state.hris.employees.find(
    (item) => String(item.id) === String(employeeId) || item.name === employeeId
  );

  if (!employee) {
    return null;
  }

  return {
    employee,
    positions: state.hris.positions.filter((item) => item.holder === employee.name),
    competencies: state.hris.competencies.filter((item) => item.employee === employee.name),
    documents: state.hris.documents.filter((item) => item.employee === employee.name),
  };
}

function findDuplicateValues(items, fields) {
  const duplicates = [];

  for (const field of fields) {
    const seen = new Map();
    for (const item of items) {
      const value = String(item[field] || "").trim().toLowerCase();
      if (!value) continue;
      if (seen.has(value)) {
        duplicates.push({
          field,
          value: item[field],
          ids: [seen.get(value), item.id || item.code || item.name].filter(Boolean),
        });
      } else {
        seen.set(value, item.id || item.code || item.name);
      }
    }
  }

  return duplicates;
}

function getIntegrationDataProfile(key) {
  const orgUnits = catalog.orgUnits || [];
  const employees = state.hris.employees || [];
  const documents = state.documents || [];
  const standards = getActiveStandards();

  const profiles = {
    siakad: {
      record_count: orgUnits.length + standards.length + state.ppeppCycles.length,
      master_sources: ["orgUnits", "standards", "ppeppCycles"],
      duplicates: [
        ...findDuplicateValues(orgUnits, ["code", "name"]),
        ...findDuplicateValues(standards, ["code", "title"]),
      ],
      missing_master: orgUnits.filter((item) => item.parent_code && !orgUnits.some((unit) => unit.code === item.parent_code)),
    },
    simpeg: {
      record_count: employees.length + state.hris.positions.length + state.hris.competencies.length,
      master_sources: ["hris.employees", "hris.positions", "hris.competencies"],
      duplicates: findDuplicateValues(employees, ["id", "employeeNumber", "nidn", "email"]),
      missing_master: employees.filter((item) => !item.unit || !item.email),
    },
    keuangan: {
      record_count: state.indicators.filter((item) => item.category === "keuangan").length,
      master_sources: ["indicators.keuangan", "standards.keuangan"],
      duplicates: findDuplicateValues(standards.filter((item) => item.category === "keuangan"), ["code", "title"]),
      missing_master: standards.filter((item) => item.category === "keuangan" && !item.description),
    },
    repository: {
      record_count: documents.length,
      master_sources: ["documents"],
      duplicates: findDuplicateValues(documents, ["code", "title"]),
      missing_master: documents.filter((item) => !item.metadata?.tanggal || !item.metadata?.unit || !item.metadata?.kategori),
    },
    pddikti: {
      record_count: orgUnits.filter((item) => item.type === "prodi").length + employees.filter((item) => item.nidn).length,
      master_sources: ["orgUnits.prodi", "hris.employees.nidn"],
      duplicates: [
        ...findDuplicateValues(orgUnits.filter((item) => item.type === "prodi"), ["code", "name"]),
        ...findDuplicateValues(employees.filter((item) => item.nidn), ["nidn"]),
      ],
      missing_master: employees.filter((item) => String(item.type || "").includes("Dosen") && !item.nidn),
    },
    sso_iam: {
      record_count: (catalog.seedUsers || []).length,
      master_sources: ["seedUsers", "roles", "orgUnits"],
      duplicates: findDuplicateValues(catalog.seedUsers || [], ["email"]),
      missing_master: (catalog.seedUsers || []).filter((item) => !item.role || !item.org_unit_code),
    },
  };

  return profiles[key] || {
    record_count: 0,
    master_sources: [],
    duplicates: [],
    missing_master: [],
  };
}

function buildIntegrationChecks(connector) {
  const profile = getIntegrationDataProfile(connector.key);
  const hasEndpoint = Boolean(connector.endpoint);
  const hasDuplicates = profile.duplicates.length > 0;
  const hasMissingMaster = profile.missing_master.length > 0;

  return {
    synchronization: {
      status: connector.last_sync_at ? "synced" : hasEndpoint ? "ready" : "planned",
      message: connector.last_sync_at
        ? `Terakhir sinkron ${connector.last_sync_at}`
        : hasEndpoint
          ? "Endpoint tersedia untuk uji sinkronisasi."
          : "Menunggu endpoint/API credential resmi.",
      record_count: profile.record_count,
      direction: connector.sync_direction,
    },
    master_consistency: {
      status: hasMissingMaster ? "warning" : "ok",
      message: hasMissingMaster
        ? `${profile.missing_master.length} data master perlu dilengkapi.`
        : "Data master inti konsisten.",
      sources: profile.master_sources,
    },
    duplicate_data: {
      status: hasDuplicates ? "warning" : "ok",
      message: hasDuplicates ? `${profile.duplicates.length} potensi duplicate ditemukan.` : "Tidak ada duplicate terdeteksi.",
      items: profile.duplicates.slice(0, 10),
    },
    api_error_handling: {
      status: "ok",
      message: "Timeout, retry, duplicate rejection, dan response 4xx/5xx disiapkan pada orchestration layer.",
      retry_policy: "3x retry, exponential backoff, circuit breaker saat gagal beruntun",
    },
    integration_logging: {
      status: "ok",
      message: "Setiap readiness check dan sync dicatat ke integrationLogs.",
      latest_log_id: state.integrationLogs.find((item) => item.service === connector.key)?.id || null,
    },
  };
}

function summarizeIntegrationReadiness(connector) {
  const checks = buildIntegrationChecks(connector);
  const statuses = Object.values(checks).map((item) => item.status);
  if (statuses.includes("failed")) return "failed";
  if (statuses.includes("warning")) return "warning";
  if (statuses.includes("planned")) return "planned";
  if (statuses.includes("ready")) return "ready";
  return "ok";
}

function getIntegrations() {
  return state.integrations.map((connector) => ({
    ...connector,
    checks: buildIntegrationChecks(connector),
    readiness_status: summarizeIntegrationReadiness(connector),
  }));
}

function getIntegrationReadiness() {
  const connectors = getIntegrations();
  const summary = connectors.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.readiness_status] = (acc[item.readiness_status] || 0) + 1;
      return acc;
    },
    { total: 0, ok: 0, ready: 0, warning: 0, planned: 0, failed: 0 }
  );

  return {
    systems: ["SIAKAD", "SIMPEG", "Keuangan", "Repository", "PDDIKTI", "SSO/IAM"],
    summary,
    connectors,
    latest_logs: state.integrationLogs.slice(0, 20),
  };
}

function appendIntegrationLog(service, status, message, metadata = {}) {
  const log = {
    id: `int-log-${Date.now()}-${state.integrationLogs.length + 1}`,
    service,
    status,
    message,
    metadata,
    syncedAt: new Date().toISOString(),
  };
  state.integrationLogs.unshift(log);
  return log;
}

function checkIntegration(service, actor = "system") {
  const connector = state.integrations.find((item) => item.key === service);
  if (!connector) return null;

  const checks = buildIntegrationChecks(connector);
  const readiness_status = summarizeIntegrationReadiness(connector);
  const log = appendIntegrationLog(service, readiness_status === "failed" ? "failed" : "checked", "Readiness check integrasi selesai.", {
    actor,
    readiness_status,
    duplicate_count: checks.duplicate_data.items.length,
    master_status: checks.master_consistency.status,
  });

  return {
    ...connector,
    checks,
    readiness_status,
    log,
  };
}

function syncIntegration(service, actor = "system") {
  const connector = state.integrations.find((item) => item.key === service);
  if (!connector) return null;

  const checks = buildIntegrationChecks(connector);
  const hasDuplicateWarning = checks.duplicate_data.status === "warning";
  const hasMissingMaster = checks.master_consistency.status === "warning";
  const status = hasDuplicateWarning || hasMissingMaster ? "synced_with_warning" : "synced";
  const now = new Date().toISOString();

  connector.last_sync_at = now;
  connector.last_status = status;
  connector.error_count = status === "synced" ? 0 : connector.error_count + 1;

  const log = appendIntegrationLog(service, status, "Sinkronisasi simulasi integrasi selesai.", {
    actor,
    duplicate_warning: hasDuplicateWarning,
    master_warning: hasMissingMaster,
    record_count: checks.synchronization.record_count,
  });

  return {
    ...connector,
    checks: buildIntegrationChecks(connector),
    readiness_status: summarizeIntegrationReadiness(connector),
    log,
  };
}

function getIntegrationLogs(service) {
  return state.integrationLogs.filter((item) => !service || item.service === service);
}

function addAuditLog(data = {}) {
  const entry = {
    id: `audit-${Date.now()}-${state.auditLogs.length + 1}`,
    actor_id: data.actor_id || null,
    actor_email: data.actor_email || "anonymous",
    role: data.role || null,
    action: data.action || "request",
    method: data.method || null,
    path: data.path || null,
    status_code: data.status_code || null,
    ip_address: data.ip_address || null,
    user_agent: data.user_agent || null,
    metadata: data.metadata || {},
    created_at: new Date().toISOString(),
  };
  state.auditLogs.unshift(entry);
  state.auditLogs = state.auditLogs.slice(0, 500);
  return entry;
}

function getAuditLogs(filters = {}) {
  const actor = String(filters.actor || "").toLowerCase();
  const action = String(filters.action || "").toLowerCase();
  return state.auditLogs.filter((item) => {
    if (actor && !String(item.actor_email || "").toLowerCase().includes(actor)) return false;
    if (action && !String(item.action || "").toLowerCase().includes(action)) return false;
    return true;
  });
}

const localTokenBlacklist = new Map();
const orgUnitIndex = new Map((catalog.orgUnits || []).map((item) => [item.code, item]));
const dashboardCache = new Map();
let dashboardCacheVersion = 0;

function bumpDashboardCache() {
  dashboardCacheVersion += 1;
  dashboardCache.clear();
}

function blacklistLocalToken(token, expiresAt) {
  localTokenBlacklist.set(token, expiresAt ? new Date(expiresAt).getTime() : Date.now() + 24 * 60 * 60 * 1000);
  return true;
}

function isLocalTokenBlacklisted(token) {
  const expiresAt = localTokenBlacklist.get(token);
  if (!expiresAt) return false;
  if (expiresAt < Date.now()) {
    localTokenBlacklist.delete(token);
    return false;
  }
  return true;
}

function getUnitWithParents(code) {
  const unit = orgUnitIndex.get(code);
  const parent = unit?.parent_code ? orgUnitIndex.get(unit.parent_code) : null;
  return { unit, parent };
}

function getStandardGroup(title = "") {
  const normalized = String(title).toLowerCase();
  if (normalized.includes("pendidikan") || normalized.includes("pembelajaran")) return "Pendidikan";
  if (normalized.includes("penelitian")) return "Penelitian";
  if (normalized.includes("pengabdian") || normalized.includes("pkm")) return "Pengabdian";
  if (normalized.includes("sdm") || normalized.includes("dosen")) return "SDM";
  if (normalized.includes("keuangan")) return "Keuangan";
  if (normalized.includes("sarana") || normalized.includes("sarpras")) return "Sarpras";
  return "Tata Kelola";
}

function getFilteredIndicators(filters = {}) {
  const normalizedYear = String(filters.tahun || filters.year || "").trim();
  const fakultas = String(filters.fakultas || "").trim();
  const prodi = String(filters.prodi || "").trim();
  const standar = String(filters.standar || filters.standard || "").trim().toLowerCase();

  return state.indicators.filter((item) => {
    const { unit, parent } = getUnitWithParents(item.org_unit_code);
    const latestPeriod = item.latest_value?.period || "";
    const standardCode = String(item.standard?.code || "").toLowerCase();
    const standardTitle = String(item.standard?.title || "").toLowerCase();

    if (normalizedYear && !latestPeriod.includes(normalizedYear)) return false;
    if (fakultas && item.org_unit_code !== fakultas && parent?.code !== fakultas) return false;
    if (prodi && item.org_unit_code !== prodi) return false;
    if (standar && standardCode !== standar && !standardTitle.includes(standar)) return false;

    return Boolean(unit || !fakultas || !prodi);
  });
}

function getIndicatorAchievement(item) {
  const actual = Number(item.latest_value?.actual_value ?? 0);
  const target = Number(item.target_value ?? 0);
  return target > 0 ? Math.min((actual / target) * 100, 100) : 0;
}

function getDashboardSummary(filters = {}) {
  const cacheKey = JSON.stringify({
    version: dashboardCacheVersion,
    fakultas: filters.fakultas || "",
    prodi: filters.prodi || "",
    tahun: filters.tahun || filters.year || "",
    standar: filters.standar || filters.standard || "",
  });
  if (dashboardCache.has(cacheKey)) {
    return dashboardCache.get(cacheKey);
  }

  const indicators = getFilteredIndicators(filters);
  const totalIndicators = indicators.length;
  const achievementValues = indicators.map(getIndicatorAchievement);
  const averageAchievement = totalIndicators
    ? achievementValues.reduce((sum, value) => sum + value, 0) / totalIndicators
    : 0;
  const achieved = achievementValues.filter((value) => value >= 100).length;
  const warning = achievementValues.filter((value) => value >= 50 && value < 100).length;
  const risk = achievementValues.filter((value) => value < 50).length;
  const standardAchievement = Object.values(
    indicators.reduce((acc, item) => {
      const group = getStandardGroup(item.standard?.title);
      if (!acc[group]) acc[group] = { group, total: 0, sum: 0 };
      acc[group].total += 1;
      acc[group].sum += getIndicatorAchievement(item);
      return acc;
    }, {})
  ).map((item) => ({
    group: item.group,
    total: item.total,
    achievement: item.total ? Number((item.sum / item.total).toFixed(1)) : 0,
  }));

  const summary = {
    metrics: catalog.metrics,
    modules: catalog.dashboardModules,
    kpi: {
      total_indicators: totalIndicators,
      average_achievement: Number(averageAchievement.toFixed(1)),
      achieved,
      warning,
      risk,
      executive_score: Math.round(averageAchievement * 4),
    },
    filters: {
      fakultas: filters.fakultas || "",
      prodi: filters.prodi || "",
      tahun: filters.tahun || filters.year || "",
      standar: filters.standar || filters.standard || "",
    },
    standardAchievement,
    performance: indicators.map((item) => {
      const { unit, parent } = getUnitWithParents(item.org_unit_code);
      return {
      code: item.code,
      name: item.name,
      actual: item.latest_value?.actual_value ?? 0,
      target: item.target_value,
      unit: item.unit,
      status: item.latest_value?.status ?? "No Data",
      period: item.latest_value?.period ?? "-",
      standard: item.standard,
      org_unit_code: item.org_unit_code,
      prodi: unit?.type === "prodi" ? unit.name : "",
      fakultas: parent?.name || (unit?.type === "fakultas" ? unit.name : ""),
      achievement: Number(getIndicatorAchievement(item).toFixed(1)),
      history: item.history.map((entry) => entry.actual_value),
    };
    }),
  };
  dashboardCache.set(cacheKey, summary);
  return summary;
}

function paginateItems(items, query = {}, defaultLimit = 25) {
  const page = Math.max(1, Number(query.page || 1) || 1);
  const limit = Math.min(Math.max(1, Number(query.limit || defaultLimit) || defaultLimit), 250);
  const total = items.length;
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    meta: {
      total,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
      has_next: start + limit < total,
    },
  };
}

function getDocumentsPage(query = {}, user = null, canRead = () => true) {
  const keyword = String(query.q || query.search || "").trim().toLowerCase();
  const type = String(query.type || "").trim();
  const unit = String(query.unit || query.org_unit_code || "").trim();
  const filtered = state.documents.filter((item) => {
    if (user && !canRead(item)) return false;
    if (type && item.type !== type) return false;
    if (unit && item.org_unit_code !== unit) return false;
    if (keyword) {
      const haystack = `${item.code || ""} ${item.title || ""} ${item.type || ""} ${item.owner || ""}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });

  return paginateItems(filtered, query, 25);
}

function getOrgScaleReport() {
  const orgUnits = catalog.orgUnits || [];
  const facultyCount = orgUnits.filter((item) => item.type === "fakultas").length;
  const studyProgramCount = orgUnits.filter((item) => item.type === "prodi").length;
  const maxChildren = orgUnits.reduce((max, unit) => {
    const count = orgUnits.filter((item) => item.parent_code === unit.code).length;
    return Math.max(max, count);
  }, 0);

  return {
    total_units: orgUnits.length,
    faculties: facultyCount,
    study_programs: studyProgramCount,
    max_children_per_unit: maxChildren,
    indexed_lookup: true,
  };
}

function measurePerformance(label, fn) {
  const started = process.hrtime.bigint();
  const result = fn();
  const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  return {
    label,
    duration_ms: Number(durationMs.toFixed(3)),
    status: durationMs <= 150 ? "ok" : durationMs <= 500 ? "warning" : "slow",
    result,
  };
}

function getPerformanceReport() {
  const dashboard = measurePerformance("dashboard_summary", () => getDashboardSummary({}));
  const documents = measurePerformance("documents_page_25", () => getDocumentsPage({ page: 1, limit: 25 }));
  const orgScale = getOrgScaleReport();
  const concurrentUsersEstimate = Math.max(25, Math.min(500, orgScale.study_programs * 15 + orgScale.faculties * 25));

  return {
    generated_at: new Date().toISOString(),
    checks: {
      loading_dashboard: {
        status: dashboard.status,
        duration_ms: dashboard.duration_ms,
        indicator_count: dashboard.result.performance.length,
        cache_enabled: true,
      },
      slow_query_guard: {
        status: dashboard.duration_ms < 150 && documents.duration_ms < 150 ? "ok" : "warning",
        dashboard_duration_ms: dashboard.duration_ms,
        documents_duration_ms: documents.duration_ms,
      },
      many_documents: {
        status: documents.status,
        duration_ms: documents.duration_ms,
        total_documents: state.documents.length,
        page_size: documents.result.meta.limit,
        pagination_enabled: true,
      },
      multi_user: {
        status: "ready",
        stateless_api: true,
        jwt_auth: true,
        estimated_concurrent_users: concurrentUsersEstimate,
      },
      many_org_units: {
        status: "ready",
        ...orgScale,
      },
    },
  };
}

function getDashboardExport(format = "excel", filters = {}) {
  const summary = getDashboardSummary(filters);
  const rows = [
    ["Kode", "Indikator", "Standar", "Fakultas", "Prodi", "Periode", "Target", "Capaian", "Satuan", "Ketercapaian", "Status"],
    ...summary.performance.map((item) => [
      item.code,
      item.name,
      item.standard?.title || "",
      item.fakultas,
      item.prodi,
      item.period,
      item.target,
      item.actual,
      item.unit,
      `${item.achievement}%`,
      item.status,
    ]),
  ];

  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  if (format === "pdf") {
    return {
      file_name: "dashboard-kpi-mutu.pdf.html",
      mime_type: "text/html",
      content: `<!doctype html><html><head><meta charset="utf-8"><title>Dashboard KPI Mutu</title><style>body{font-family:Arial,sans-serif;color:#0f172a;padding:32px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #e2e8f0;padding:8px;text-align:left}th{background:#f8fafc}h1{margin-bottom:4px}.kpi{display:flex;gap:12px;margin:20px 0}.kpi div{border:1px solid #e2e8f0;padding:12px;border-radius:12px}</style></head><body><h1>Dashboard KPI Mutu</h1><p>Universitas Junrejo Indah</p><section class="kpi"><div>Total: ${summary.kpi.total_indicators}</div><div>Rata-rata: ${summary.kpi.average_achievement}%</div><div>Tercapai: ${summary.kpi.achieved}</div><div>Risiko: ${summary.kpi.risk}</div></section><table>${rows.map((row, index) => `<tr>${row.map((value) => index === 0 ? `<th>${value}</th>` : `<td>${value}</td>`).join("")}</tr>`).join("")}</table><script>window.print()</script></body></html>`,
    };
  }

  return {
    file_name: "dashboard-kpi-mutu.csv",
    mime_type: "text/csv",
    content: csv,
  };
}

function addStandard(data) {
  const category = normalizeStandardCategory(data.category);
  const code = getNextStandardCode(category);
  const item = {
    id: `std-${Date.now()}`,
    code,
    title: data.title,
    category,
    description: data.description || "",
    status: data.status || "aktif",
    version: data.version || "1.0",
    deleted_at: null,
    revisions: [
      {
        version: data.version || "1.0",
        action: "created",
        note: data.revision_note || "Standar dibuat.",
        changed_at: new Date().toISOString(),
        changed_by: data.changed_by || "system",
      },
    ],
  };
  state.standards.unshift(item);
  return item;
}

function getActiveStandards() {
  return state.standards.filter((item) => !item.deleted_at && item.status !== "deleted");
}

function bumpMinorVersion(version) {
  const [major, minor] = String(version || "1.0").split(".").map((part) => Number(part) || 0);
  return `${major}.${minor + 1}`;
}

function updateStandard(standardId, data) {
  const standard = state.standards.find(
    (item) => !item.deleted_at && (String(item.id) === String(standardId) || item.code === standardId)
  );
  if (!standard) return null;

  const previous = {
    code: standard.code,
    title: standard.title,
    category: standard.category,
    description: standard.description,
    status: standard.status,
    version: standard.version || "1.0",
  };

  const nextCategory = data.category ? normalizeStandardCategory(data.category) : standard.category;
  const categoryChanged = nextCategory !== standard.category;
  const nextVersion = data.version || bumpMinorVersion(standard.version);

  Object.assign(standard, {
    title: data.title || standard.title,
    code: categoryChanged ? getNextStandardCode(nextCategory) : standard.code,
    category: nextCategory,
    description: data.description ?? standard.description,
    status: data.status || standard.status || "aktif",
    version: nextVersion,
  });

  standard.revisions = [
    {
      version: standard.version,
      action: "updated",
      note: data.revision_note || "Standar diperbarui.",
      changed_at: new Date().toISOString(),
      changed_by: data.changed_by || "system",
      previous,
    },
    ...(standard.revisions || []),
  ];

  return standard;
}

function deleteStandard(standardId, data = {}) {
  const standard = state.standards.find(
    (item) => !item.deleted_at && (String(item.id) === String(standardId) || item.code === standardId)
  );
  if (!standard) return null;

  standard.status = "deleted";
  standard.deleted_at = new Date().toISOString();
  standard.version = data.version || bumpMinorVersion(standard.version);
  standard.revisions = [
    {
      version: standard.version,
      action: "deactivated",
      note: data.revision_note || "Standar dinonaktifkan.",
      changed_at: new Date().toISOString(),
      changed_by: data.changed_by || "system",
    },
    ...(standard.revisions || []),
  ];
  return standard;
}

function getStandardRevisions(standardId) {
  const standard = state.standards.find((item) => String(item.id) === String(standardId) || item.code === standardId);
  return standard?.revisions || null;
}

function addDocument(data, user) {
  const id = Date.now();
  const item = {
    id,
    code: data.code || `DOC-${id}`,
    title: data.title,
    type: data.type || "kebijakan",
    status: "draft",
    org_unit_code: data.org_unit_code || null,
    document_date: data.document_date || data.tanggal || new Date().toISOString().slice(0, 10),
    category: data.category || data.kategori || data.type || "kebijakan",
    owner: data.owner || data.penanggung_jawab || user?.name || user?.email || "system",
    metadata: {
      tanggal: data.document_date || data.tanggal || new Date().toISOString().slice(0, 10),
      unit: data.org_unit_code || null,
      kategori: data.category || data.kategori || data.type || "kebijakan",
      penanggung_jawab: data.owner || data.penanggung_jawab || user?.name || user?.email || "system",
    },
    approval: getInitialApproval(user),
    current_version: "1.0",
    versions: [
      {
        id: id * 10,
        version_number: 1,
        file_name: data.file_name || `${data.title || "document"}.pdf`,
        file_path: data.file_path || `/mock-downloads/${id}`,
        file_size: Number(data.file_size || 0),
        mime_type: data.mime_type || null,
        created_at: new Date().toISOString(),
        uploaded_by: user?.email || null,
      },
    ],
  };
  state.documents.unshift(item);
  return item;
}

function findDocument(documentId) {
  return state.documents.find((item) => String(item.id) === String(documentId) || item.code === documentId) || null;
}

function findDocumentVersion(versionId) {
  for (const document of state.documents) {
    const version = (document.versions || []).find((item) => String(item.id) === String(versionId));
    if (version) return { document, version };
  }
  return null;
}

function findDuplicateDocument(data) {
  const orgCode = data.org_unit_code || null;
  return state.documents.find((item) => {
    const sameCode = data.code && item.code === data.code;
    const sameIdentity =
      item.title?.toLowerCase() === String(data.title || "").toLowerCase() &&
      item.type === (data.type || "kebijakan") &&
      (item.org_unit_code || null) === orgCode;
    return sameCode || sameIdentity;
  }) || null;
}

function hasDuplicateFile(document, data) {
  const fileName = data.file_name || "";
  const fileSize = Number(data.file_size || 0);
  return (document.versions || []).some(
    (version) => version.file_name === fileName && Number(version.file_size || 0) === fileSize
  );
}

function addDocumentVersion(documentId, data, user) {
  const document = findDocument(documentId);
  if (!document) return null;
  if (hasDuplicateFile(document, data)) {
    return { duplicate: true, document };
  }

  const versionNumber = (document.versions || []).reduce((max, item) => Math.max(max, Number(item.version_number || 0)), 0) + 1;
  const version = {
    id: Number(`${Date.now()}${versionNumber}`),
    version_number: versionNumber,
    file_name: data.file_name || `${document.title}-v${versionNumber}.pdf`,
    file_path: data.file_path || `/mock-downloads/${document.id}/v${versionNumber}`,
    file_size: Number(data.file_size || 0),
    mime_type: data.mime_type || null,
    created_at: new Date().toISOString(),
    uploaded_by: user?.email || null,
    notes: data.notes || "",
  };

  document.versions.unshift(version);
  document.current_version = `${versionNumber}.0`;
  document.status = data.status || document.status;
  return { document, version };
}

function addFinding(auditId, data) {
  const audit = state.audits.find((item) => String(item.id) === String(auditId));
  const finding = normalizeAmiFinding({
    id: Date.now(),
    title: data.title || data.category || data.severity || "Temuan AMI",
    description: data.description || "",
    category: data.category || data.severity || "observasi",
    recommendation: data.recommendation || "",
    root_cause: data.root_cause || "",
    follow_up: {
      plan: data.follow_up_plan || data.rencana_tindak_lanjut || data.recommendation || "",
      status: data.follow_up_status || data.status_rtl || "open",
      due_date: data.due_date || data.tenggat || null,
      progress: Number(data.progress || 0),
      evidence: [],
    },
  });
  if (audit) {
    audit.findings = audit.findings || [];
    audit.findings.unshift(finding);
    audit.recap = calculateAmiRecap(audit);
    audit.score = audit.recap.score;
    audit.timeline.unshift({
      at: new Date().toISOString(),
      actor: data.changed_by || "system",
      action: "finding_created",
      note: `${finding.category}: ${finding.description}`,
    });
  }
  return finding;
}

function addMeeting(data, user) {
  const item = {
    id: Date.now(),
    title: data.title,
    meeting_date: data.meeting_date,
    status: "scheduled",
    conclusion: data.conclusion || null,
    org_unit_code: data.org_unit_code || null,
    approval: getInitialApproval(user),
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

function addPpeppCycle(data, user) {
  const item = normalizePpeppCycle({
    id: Date.now(),
    name: data.name || `Siklus ${new Date().getFullYear()}`,
    period: data.period || "yearly",
    status: data.status || "planned",
    org_unit_code: data.org_unit_code || null,
    approval: getInitialApproval(user),
    academic_year_start: data.academic_year_start || null,
    academic_year_end: data.academic_year_end || null,
    created_at: new Date().toISOString(),
  });
  state.ppeppCycles.unshift(item);
  return item;
}

function findPpeppCycle(cycleId) {
  return state.ppeppCycles.find((item) => String(item.id) === String(cycleId));
}

function updatePpeppStage(cycleId, stageKey, data, user) {
  const cycle = findPpeppCycle(cycleId);
  if (!cycle) return null;

  const stage = cycle.stages.find((item) => item.key === stageKey || item.label.toLowerCase() === String(stageKey).toLowerCase());
  if (!stage) return null;

  const nextStatus = data.status || stage.status;
  const rawProgress = Number.isFinite(Number(data.progress)) ? Number(data.progress) : stage.progress;
  const nextProgress = nextStatus === "completed" ? 100 : Math.min(100, Math.max(0, Number(rawProgress || 0)));

  stage.status = nextStatus;
  stage.progress = nextProgress;
  stage.start_date = data.start_date ?? stage.start_date;
  stage.due_date = data.due_date ?? stage.due_date;
  stage.completed_at = nextStatus === "completed" ? data.completed_at || new Date().toISOString() : data.completed_at ?? stage.completed_at;
  stage.notes = data.notes ?? stage.notes;

  cycle.current_stage = cycle.stages.find((item) => item.status !== "completed")?.key || stage.key;
  cycle.progress = calculatePpeppProgress(cycle.stages);
  cycle.status = cycle.progress >= 100 ? "closed" : cycle.progress > 0 ? "running" : cycle.status;
  cycle.timeline.unshift({
    at: new Date().toISOString(),
    actor: user?.email || user?.username || "system",
    action: "stage_updated",
    stage: stage.key,
    status: stage.status,
    progress: stage.progress,
    note: data.notes || `${stage.label} diperbarui.`,
  });

  return cycle;
}

function addPpeppEvidence(cycleId, stageKey, data, user) {
  const cycle = findPpeppCycle(cycleId);
  if (!cycle) return null;

  const stage = cycle.stages.find((item) => item.key === stageKey || item.label.toLowerCase() === String(stageKey).toLowerCase());
  if (!stage) return null;

  const evidence = {
    id: `EV-PPEPP-${Date.now()}`,
    title: data.title || data.file_name || "Bukti PPEPP",
    file_name: data.file_name || null,
    file_path: data.file_path || null,
    file_size: Number(data.file_size || 0),
    notes: data.notes || "",
    uploaded_at: new Date().toISOString(),
    uploaded_by: user?.email || user?.username || "system",
  };

  stage.evidence.unshift(evidence);
  if (stage.status === "not_started") {
    stage.status = "in_progress";
    stage.progress = Math.max(stage.progress, 25);
  }

  cycle.progress = calculatePpeppProgress(cycle.stages);
  cycle.status = cycle.progress >= 100 ? "closed" : "running";
  cycle.timeline.unshift({
    at: evidence.uploaded_at,
    actor: evidence.uploaded_by,
    action: "evidence_uploaded",
    stage: stage.key,
    note: evidence.title,
  });

  return { cycle, stage, evidence };
}

function addAmiAudit(data, user) {
  const item = normalizeAmiAudit({
    id: Date.now(),
    title: data.title || data.name || "Audit Mutu Internal",
    audit_date: data.audit_date || null,
    scheduled_date: data.scheduled_date || data.audit_date || null,
    score: Number(data.score || 0),
    status: data.status || "terjadwal",
    org_unit: {
      name: data.org_unit_name || `Unit ${data.org_unit_id || "Lokal"}`,
    },
    org_unit_code: data.org_unit_code || null,
    auditor: {
      name: data.auditor_name || data.auditor || user?.name || "Internal Auditor",
      email: data.auditor_email || user?.email || "auditor@spmi.local",
      role: "auditor",
    },
    approval: getInitialApproval(user),
    findings: data.finding_summary
      ? [
          {
            id: Date.now() + 1,
            title: "Temuan awal",
            description: data.finding_summary,
            category: data.finding_category || "observasi",
            recommendation: "",
            root_cause: "",
          },
        ]
      : [],
    created_at: new Date().toISOString(),
  });
  state.audits.unshift(item);
  return item;
}

function updateAmiAssignment(auditId, data, user) {
  const audit = state.audits.find((item) => String(item.id) === String(auditId));
  if (!audit) return null;

  audit.title = data.title || audit.title;
  audit.scheduled_date = data.scheduled_date || data.audit_date || audit.scheduled_date;
  audit.audit_date = data.audit_date || audit.audit_date || audit.scheduled_date;
  audit.status = data.status || audit.status;
  audit.auditor = {
    ...audit.auditor,
    name: data.auditor_name || data.auditor || audit.auditor?.name || "Internal Auditor",
    email: data.auditor_email || audit.auditor?.email || "auditor@spmi.local",
    role: "auditor",
  };
  audit.timeline.unshift({
    at: new Date().toISOString(),
    actor: user?.email || "system",
    action: "assignment_updated",
    note: `Auditor ${audit.auditor.name}, jadwal ${audit.scheduled_date || "-"}.`,
  });
  audit.recap = calculateAmiRecap(audit);
  return audit;
}

function updateAmiInstrument(auditId, instrumentId, data, user) {
  const audit = state.audits.find((item) => String(item.id) === String(auditId));
  if (!audit) return null;

  const instrument = audit.instruments.find((item) => String(item.id) === String(instrumentId));
  if (!instrument) return null;

  instrument.status = data.status || instrument.status;
  instrument.score = data.score === undefined ? instrument.score : Number(data.score);
  instrument.notes = data.notes ?? instrument.notes;
  instrument.checked_at = new Date().toISOString();
  instrument.checked_by = user?.email || "system";
  audit.timeline.unshift({
    at: instrument.checked_at,
    actor: instrument.checked_by,
    action: "instrument_checked",
    note: instrument.title,
  });
  audit.recap = calculateAmiRecap(audit);
  audit.score = audit.recap.score;
  return audit;
}

function updateAmiFindingFollowUp(auditId, findingId, data, user) {
  const audit = state.audits.find((item) => String(item.id) === String(auditId));
  if (!audit) return null;

  const finding = audit.findings.find((item) => String(item.id) === String(findingId));
  if (!finding) return null;

  finding.follow_up = {
    ...finding.follow_up,
    plan: data.plan || data.follow_up_plan || finding.follow_up.plan,
    status: data.status || data.follow_up_status || finding.follow_up.status,
    due_date: data.due_date ?? finding.follow_up.due_date,
    progress: Number(data.progress ?? finding.follow_up.progress ?? 0),
    evidence: finding.follow_up.evidence || [],
  };
  if (data.evidence_title || data.file_name) {
    finding.follow_up.evidence.unshift({
      id: `AMI-EV-${Date.now()}`,
      title: data.evidence_title || data.file_name,
      file_name: data.file_name || null,
      uploaded_at: new Date().toISOString(),
      uploaded_by: user?.email || "system",
    });
  }
  audit.timeline.unshift({
    at: new Date().toISOString(),
    actor: user?.email || "system",
    action: "follow_up_updated",
    note: finding.title,
  });
  audit.recap = calculateAmiRecap(audit);
  return audit;
}

function verifyAmiFinding(auditId, findingId, data, user) {
  const audit = state.audits.find((item) => String(item.id) === String(auditId));
  if (!audit) return null;

  const finding = audit.findings.find((item) => String(item.id) === String(findingId));
  if (!finding) return null;

  finding.verification = {
    status: data.status || "verified",
    verified_by: user?.email || "system",
    verified_at: new Date().toISOString(),
    notes: data.notes || "",
  };
  if (finding.verification.status === "verified") {
    finding.follow_up.status = "done";
    finding.follow_up.progress = 100;
  }
  audit.timeline.unshift({
    at: finding.verification.verified_at,
    actor: finding.verification.verified_by,
    action: "finding_verified",
    note: finding.title,
  });
  audit.recap = calculateAmiRecap(audit);
  return audit;
}

function addIndicator(data, user) {
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
    org_unit_code: data.org_unit_code || null,
    approval: getInitialApproval(user),
    latest_value: null,
    history: [],
  };
  state.indicators.unshift(item);
  bumpDashboardCache();
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
  bumpDashboardCache();
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

function refreshHrisMetrics() {
  const total = state.hris.employees.length;
  const lecturers = state.hris.employees.filter((item) => item.type.includes("Dosen") && item.status === "Aktif").length;
  const staff = state.hris.employees.filter((item) => item.type === "Tendik" && item.status === "Aktif").length;
  const certified = state.hris.competencies.filter((item) => item.category === "Sertifikasi" && item.status === "Tervalidasi").length;

  state.hris.metrics = [
    { label: "Total Pegawai", value: total },
    { label: "Dosen Aktif", value: lecturers },
    { label: "Tendik Aktif", value: staff },
    { label: "Sertifikasi Dosen", value: certified },
  ];
}

function addHrisEmployee(data) {
  const item = {
    id: `EMP-${Date.now()}`,
    name: data.name || "Pegawai Baru",
    employeeNumber: data.employeeNumber || data.employee_number || `HR-${Date.now()}`,
    nidn: data.nidn || "-",
    type: data.type || "Dosen",
    status: data.status || "Aktif",
    unit: data.unit || "Unit Kerja",
    position: data.position || "Pegawai",
    functionalPosition: data.functionalPosition || data.functional_position || "-",
    education: data.education || "-",
    email: data.email || "-",
  };

  state.hris.employees.unshift(item);
  refreshHrisMetrics();
  return item;
}

function updateHrisEmployee(employeeId, data) {
  const employee = state.hris.employees.find((item) => String(item.id) === String(employeeId));
  if (!employee) {
    return null;
  }

  const previousName = employee.name;
  Object.assign(employee, {
    name: data.name || employee.name,
    employeeNumber: data.employeeNumber || data.employee_number || employee.employeeNumber,
    nidn: data.nidn || employee.nidn,
    type: data.type || employee.type,
    status: data.status || employee.status,
    unit: data.unit || employee.unit,
    position: data.position || employee.position,
    functionalPosition: data.functionalPosition || data.functional_position || employee.functionalPosition,
    education: data.education || employee.education,
    email: data.email || employee.email,
  });

  if (employee.name !== previousName) {
    state.hris.positions.forEach((item) => {
      if (item.holder === previousName) item.holder = employee.name;
    });
    state.hris.competencies.forEach((item) => {
      if (item.employee === previousName) item.employee = employee.name;
    });
    state.hris.documents.forEach((item) => {
      if (item.employee === previousName) item.employee = employee.name;
    });
  }

  refreshHrisMetrics();
  return employee;
}

function deleteHrisEmployee(employeeId) {
  const index = state.hris.employees.findIndex((item) => String(item.id) === String(employeeId));
  if (index === -1) {
    return null;
  }

  const [employee] = state.hris.employees.splice(index, 1);
  state.hris.positions = state.hris.positions.filter((item) => item.holder !== employee.name);
  state.hris.competencies = state.hris.competencies.filter((item) => item.employee !== employee.name);
  state.hris.documents = state.hris.documents.filter((item) => item.employee !== employee.name);
  refreshHrisMetrics();
  return employee;
}

function addHrisPosition(data) {
  const item = {
    id: `POS-${Date.now()}`,
    title: data.title || "Jabatan Baru",
    unit: data.unit || "Unit Kerja",
    holder: data.holder || "Belum ditetapkan",
    period: data.period || String(new Date().getFullYear()),
    status: data.status || "Aktif",
  };

  state.hris.positions.unshift(item);
  return item;
}

function updateHrisPosition(positionId, data) {
  const position = state.hris.positions.find((item) => String(item.id) === String(positionId));
  if (!position) {
    return null;
  }

  Object.assign(position, {
    title: data.title || position.title,
    unit: data.unit || position.unit,
    holder: data.holder || position.holder,
    period: data.period || position.period,
    status: data.status || position.status,
  });
  return position;
}

function deleteHrisPosition(positionId) {
  const index = state.hris.positions.findIndex((item) => String(item.id) === String(positionId));
  if (index === -1) {
    return null;
  }

  const [position] = state.hris.positions.splice(index, 1);
  return position;
}

function addHrisCompetency(data) {
  const item = {
    id: `CMP-${Date.now()}`,
    employee: data.employee || "Pegawai",
    category: data.category || "Kompetensi",
    name: data.name || "Kompetensi Baru",
    year: Number(data.year || new Date().getFullYear()),
    status: data.status || "Tervalidasi",
  };

  state.hris.competencies.unshift(item);
  refreshHrisMetrics();
  return item;
}

function updateHrisCompetency(competencyId, data) {
  const competency = state.hris.competencies.find((item) => String(item.id) === String(competencyId));
  if (!competency) {
    return null;
  }

  Object.assign(competency, {
    employee: data.employee || competency.employee,
    category: data.category || competency.category,
    name: data.name || competency.name,
    year: Number(data.year || competency.year),
    status: data.status || competency.status,
  });
  refreshHrisMetrics();
  return competency;
}

function deleteHrisCompetency(competencyId) {
  const index = state.hris.competencies.findIndex((item) => String(item.id) === String(competencyId));
  if (index === -1) {
    return null;
  }

  const [competency] = state.hris.competencies.splice(index, 1);
  refreshHrisMetrics();
  return competency;
}

function addHrisDocument(data) {
  const item = {
    id: `DOC-HR-${Date.now()}`,
    employee: data.employee || "Pegawai",
    type: data.type || "Dokumen SDM",
    title: data.title || "Dokumen Baru",
    status: data.status || "Valid",
    fileName: data.fileName || data.file_name || null,
    filePath: data.filePath || data.file_path || null,
    fileSize: Number(data.fileSize || data.file_size || 0),
  };

  state.hris.documents.unshift(item);
  return item;
}

function updateHrisDocument(documentId, data) {
  const document = state.hris.documents.find((item) => String(item.id) === String(documentId));
  if (!document) {
    return null;
  }

  Object.assign(document, {
    employee: data.employee || document.employee,
    type: data.type || document.type,
    title: data.title || document.title,
    status: data.status || document.status,
    fileName: data.fileName || data.file_name || document.fileName || null,
    filePath: data.filePath || data.file_path || document.filePath || null,
    fileSize: Number(data.fileSize || data.file_size || document.fileSize || 0),
  });
  return document;
}

function deleteHrisDocument(documentId) {
  const index = state.hris.documents.findIndex((item) => String(item.id) === String(documentId));
  if (index === -1) {
    return null;
  }

  const [document] = state.hris.documents.splice(index, 1);
  return document;
}

module.exports = {
  state,
  getCatalogSnapshot,
  getDashboardSummary,
  getDashboardExport,
  getDocumentsPage,
  getPerformanceReport,
  getHrisSummary,
  getHrisEmployeeProfile,
  getIntegrations,
  getIntegrationReadiness,
  getIntegrationLogs,
  checkIntegration,
  syncIntegration,
  addAuditLog,
  getAuditLogs,
  blacklistLocalToken,
  isLocalTokenBlacklisted,
  addStandard,
  getActiveStandards,
  getStandardRevisions,
  updateStandard,
  deleteStandard,
  getNextStandardCode,
  addDocument,
  addDocumentVersion,
  findDocument,
  findDocumentVersion,
  findDuplicateDocument,
  hasDuplicateFile,
  addFinding,
  addMeeting,
  updateMeetingAction,
  addPpeppCycle,
  updatePpeppStage,
  addPpeppEvidence,
  addAmiAudit,
  updateAmiAssignment,
  updateAmiInstrument,
  updateAmiFindingFollowUp,
  verifyAmiFinding,
  addIndicator,
  addIndicatorValue,
  addSurvey,
  addImport,
  addHrisEmployee,
  updateHrisEmployee,
  deleteHrisEmployee,
  addHrisPosition,
  updateHrisPosition,
  deleteHrisPosition,
  addHrisCompetency,
  updateHrisCompetency,
  deleteHrisCompetency,
  addHrisDocument,
  updateHrisDocument,
  deleteHrisDocument,
};
