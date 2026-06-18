const path = require("path");

const catalog = require(path.resolve(__dirname, "../../data/spmi-catalog.json"));
const prisma = require("../lib/prisma");
const env = require("../config/env");
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
    const evidence = Array.isArray(existing.evidence) && existing.evidence.length
      ? existing.evidence
      : source.seed_evidence
        ? [
            {
              id: `EV-${source.id}-${definition.key}`,
              title: `Evidence ${definition.label}`,
              file_name: `${definition.key}-${source.id}.pdf`,
              file_path: `/mock-evidence/ppepp/${source.id}/${definition.key}.pdf`,
              file_size: 0,
              notes: `Bukti awal tahap ${definition.label}.`,
              uploaded_by: "system",
              created_at: source.created_at || new Date().toISOString(),
            },
          ]
        : [];

    return {
      ...definition,
      status,
      progress: Number(existing.progress ?? (status === "completed" ? 100 : status === "in_progress" ? 50 : 0)),
      start_date: existing.start_date || null,
      due_date: existing.due_date || null,
      completed_at: existing.completed_at || null,
      notes: existing.notes || "",
      evidence,
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

const initialStandards = normalizeInitialStandards(catalog.standards);

function findInitialStandardReference(code, fallbackIndex = 0) {
  return toStandardReference(initialStandards.find((item) => item.code === code) || initialStandards[fallbackIndex]);
}

function findInitialStandardReferenceForData(data = {}, fallbackIndex = 0) {
  const source = data.standard && typeof data.standard === "object" ? data.standard : data;
  const candidates = [
    source.id,
    source.code,
    source.title,
    data.standard_id,
    data.standardId,
    data.standar_id,
    data.standard_code,
    data.standardCode,
    data.standar,
    typeof data.standard === "string" ? data.standard : null,
  ]
    .filter(Boolean)
    .map((value) => normalizeComparable(value));

  let standard = initialStandards.find((item) =>
    candidates.some((candidate) =>
      [item.id, item.code, item.title].some((value) => normalizeComparable(value) === candidate)
    )
  );

  if (!standard && (data.category || data.type)) {
    const normalizedCategory = normalizeStandardCategory(data.category || data.type);
    standard = initialStandards.find((item) => normalizeStandardCategory(item.category) === normalizedCategory);
  }

  return toStandardReference(standard || initialStandards[fallbackIndex]);
}

function getSeedDocumentStandardCode(item = {}) {
  const text = normalizeComparable(`${item.type || ""} ${item.category || ""} ${item.title || ""}`);
  if (text.includes("ami") || text.includes("audit") || text.includes("rtl") || text.includes("rtm")) return "STD-TK-04";
  if (text.includes("ppepp") || text.includes("sistem informasi mutu")) return "STD-TK-03";
  if (text.includes("pembelajaran") || text.includes("pendidikan")) return "STD-PEND-01";
  return "STD-TK-01";
}

const state = {
  standards: initialStandards,
  documents: catalog.documents.map((item) => ({
    id: item.id,
    code: `DOC-${String(item.id).padStart(3, "0")}`,
    title: item.title,
    type: item.type,
    status: item.status,
    org_unit_code: item.org_unit_code || (item.id % 2 === 0 ? "SI" : "LPM"),
    standard: findInitialStandardReferenceForData({ ...item, standard_code: getSeedDocumentStandardCode(item) }, item.id % 2 === 0 ? 0 : 1),
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
  ].map((item, index) => ({
    ...item,
    standard: findInitialStandardReferenceForData(item, index),
  })),
  ppeppCycles: catalog.ppeppCycles.map((item) =>
    normalizePpeppCycle({
      id: item.id,
      name: item.name,
      period: item.period,
      status: item.status,
      standard: findInitialStandardReference(item.standard_code || (item.id % 2 === 0 ? "STD-PEND-02" : "STD-PEND-01"), item.id % 2 === 0 ? 1 : 0),
      org_unit_code: item.org_unit_code || (item.id % 2 === 0 ? "FIKOM" : "SI"),
      approval: approvalSeed(item.status === "done" ? "approved" : "draft", item.status === "done" ? "approved" : "draft"),
      created_at: "2026-05-20T00:00:00.000Z",
      seed_evidence: true,
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
  accreditation: {
    instruments: [
      {
        id: "INS-001",
        code: "BAN-PT-APT-4.0",
        name: "APT BAN-PT 4.0",
        agency: "BAN-PT",
        level: "Perguruan Tinggi",
        criteria_count: 9,
        status: "aktif",
      },
      {
        id: "INS-002",
        code: "LAM-APS-9K",
        name: "APS LAM 9 Kriteria",
        agency: "LAM",
        level: "Program Studi",
        criteria_count: 9,
        status: "aktif",
      },
    ],
    criteria: [
      { id: "K-001", instrument_id: "INS-002", code: "K1", title: "Visi, Misi, Tujuan, dan Strategi", weight: 8, evidence_required: 6, standard_codes: ["STD-TAM-01"] },
      { id: "K-002", instrument_id: "INS-002", code: "K2", title: "Tata Pamong, Tata Kelola, dan Kerja Sama", weight: 10, evidence_required: 8, standard_codes: ["STD-TAM-01", "STD-TAM-04"] },
      { id: "K-003", instrument_id: "INS-002", code: "K3", title: "Mahasiswa", weight: 10, evidence_required: 7, standard_codes: ["STD-PEND-01"] },
      { id: "K-004", instrument_id: "INS-002", code: "K4", title: "Sumber Daya Manusia", weight: 12, evidence_required: 9, standard_codes: ["STD-PEND-04", "STD-SDM-01"] },
      { id: "K-005", instrument_id: "INS-002", code: "K5", title: "Keuangan, Sarana, dan Prasarana", weight: 10, evidence_required: 7, standard_codes: ["STD-PEND-05"] },
      { id: "K-006", instrument_id: "INS-002", code: "K6", title: "Pendidikan", weight: 14, evidence_required: 10, standard_codes: ["STD-PEND-01", "STD-PEND-02", "STD-PEND-03"] },
      { id: "K-007", instrument_id: "INS-002", code: "K7", title: "Penelitian", weight: 10, evidence_required: 7, standard_codes: ["STD-LIT-01", "STD-LIT-03"] },
      { id: "K-008", instrument_id: "INS-002", code: "K8", title: "Pengabdian kepada Masyarakat", weight: 8, evidence_required: 6, standard_codes: ["STD-PKM-01"] },
      { id: "K-009", instrument_id: "INS-002", code: "K9", title: "Luaran dan Capaian Tridharma", weight: 18, evidence_required: 11, standard_codes: ["STD-PEND-01", "STD-LIT-03", "STD-PKM-01"] },
    ],
    periods: [
      {
        id: "AKR-PER-001",
        name: "APS Sistem Informasi 2026",
        type: "APS",
        agency: "LAM",
        instrument_id: "INS-002",
        org_unit_code: "SI",
        start_date: "2026-06-01",
        due_date: "2026-10-31",
        status: "berjalan",
        progress: 46,
      },
      {
        id: "AKR-PER-002",
        name: "APT Universitas 2027",
        type: "APT",
        agency: "BAN-PT",
        instrument_id: "INS-001",
        org_unit_code: "UNIV",
        start_date: "2026-08-01",
        due_date: "2027-03-31",
        status: "draft",
        progress: 18,
      },
    ],
    assessments: [
      {
        id: "AKR-ASM-001",
        period_id: "AKR-PER-001",
        org_unit_code: "SI",
        lkps_progress: 42,
        led_progress: 35,
        evidence_progress: 58,
        review_progress: 28,
        readiness_status: "warning",
        score_projection: 312,
        predicate_projection: "BAIK SEKALI",
        risk_level: "kuning",
      },
      {
        id: "AKR-ASM-002",
        period_id: "AKR-PER-002",
        org_unit_code: "UNIV",
        lkps_progress: 20,
        led_progress: 12,
        evidence_progress: 24,
        review_progress: 0,
        readiness_status: "risk",
        score_projection: 226,
        predicate_projection: "BAIK",
        risk_level: "merah",
      },
    ],
    teamMembers: [
      { id: "AKR-TIM-001", period_id: "AKR-PER-001", name: "Ketua Program Studi", role: "KAPRODI", responsibility: "Koordinator penyusunan APS", email: "kaprodi@spmi.local" },
      { id: "AKR-TIM-002", period_id: "AKR-PER-001", name: "LPM Mutu", role: "ADMIN_AKREDITASI", responsibility: "Validasi instrumen dan review akhir", email: "lpm@spmi.local" },
      { id: "AKR-TIM-003", period_id: "AKR-PER-001", name: "Operator SPMI", role: "OPERATOR", responsibility: "Input LKPS dan dokumen bukti", email: "operator@spmi.local" },
    ],
    tasks: [
      { id: "AKR-TSK-001", period_id: "AKR-PER-001", title: "Validasi tabel LKPS mahasiswa dan lulusan", category: "LKPS", assignee: "operator@spmi.local", priority: "high", status: "in_progress", due_date: "2026-07-05", progress: 60, notes: "Menunggu sinkronisasi data lulusan dari SIAKAD." },
      { id: "AKR-TSK-002", period_id: "AKR-PER-001", title: "Lengkapi narasi LED K6 Pendidikan", category: "LED", assignee: "kaprodi@spmi.local", priority: "high", status: "blocked", due_date: "2026-07-10", progress: 35, notes: "Butuh bukti evaluasi RPS dan tindak lanjut PPEPP." },
      { id: "AKR-TSK-003", period_id: "AKR-PER-001", title: "Review bukti HRIS dosen tersertifikasi", category: "BUKTI", assignee: "lpm@spmi.local", priority: "medium", status: "done", due_date: "2026-06-28", progress: 100, notes: "Bukti valid untuk K4." },
    ],
    milestones: [
      { id: "AKR-MIL-001", period_id: "AKR-PER-001", title: "Kick-off APS Teknik Informatika", phase: "persiapan", owner: "lpm@spmi.local", start_date: "2026-06-20", due_date: "2026-06-25", status: "done", progress: 100, notes: "Tim, instrumen, dan pembagian tugas awal selesai." },
      { id: "AKR-MIL-002", period_id: "AKR-PER-001", title: "Finalisasi LKPS dan bukti kuantitatif", phase: "lkps", owner: "operator@spmi.local", start_date: "2026-06-26", due_date: "2026-07-20", status: "in_progress", progress: 58, notes: "Fokus sinkronisasi SIAKAD dan HRIS." },
      { id: "AKR-MIL-003", period_id: "AKR-PER-001", title: "Review LED dan simulasi asesmen internal", phase: "review", owner: "kaprodi@spmi.local", start_date: "2026-07-21", due_date: "2026-08-15", status: "planned", progress: 10, notes: "Menunggu draft LED lengkap dan bukti valid." },
    ],
    risks: [
      { id: "AKR-RSK-001", period_id: "AKR-PER-001", title: "Sinkronisasi data lulusan SIAKAD terlambat", category: "integrasi", owner: "operator@spmi.local", probability: 4, impact: 5, level: "high", status: "open", mitigation: "Jalankan preview SIAKAD mingguan dan siapkan template manual fallback.", due_date: "2026-07-12", notes: "Berdampak ke LKPS mahasiswa dan lulusan." },
      { id: "AKR-RSK-002", period_id: "AKR-PER-001", title: "Bukti RTL AMI tata kelola belum valid", category: "bukti", owner: "lpm@spmi.local", probability: 3, impact: 4, level: "medium", status: "mitigating", mitigation: "Minta unit mengunggah keputusan RTM dan bukti penutupan RTL.", due_date: "2026-07-18", notes: "Terkait K2 tata kelola." },
      { id: "AKR-RSK-003", period_id: "AKR-PER-001", title: "Narasi LED K6 belum sinkron dengan LKPS", category: "led", owner: "kaprodi@spmi.local", probability: 3, impact: 5, level: "high", status: "open", mitigation: "Review silang LED K6 dengan tabel kurikulum dan bukti RPS.", due_date: "2026-07-25", notes: "Menjadi catatan review internal." },
    ],
    evidence: [
      { id: "AKR-EVD-001", period_id: "AKR-PER-001", criteria_code: "K4", title: "Rekap dosen tetap dan sertifikasi pendidik", source_module: "HRIS", status: "valid", file_name: "rekap-dosen-sertifikasi.pdf", linked_lkps_entry_id: "LKPS-ENT-002", linked_led_content_id: "LED-CNT-001", notes: "Sumber HRIS kompetensi." },
      { id: "AKR-EVD-002", period_id: "AKR-PER-001", criteria_code: "K6", title: "Dokumen standar kurikulum dan evaluasi pembelajaran", source_module: "SPMI", status: "valid", file_name: "standar-kurikulum.pdf", linked_lkps_entry_id: null, linked_led_content_id: "LED-CNT-002", notes: "Terkait standar kurikulum." },
      { id: "AKR-EVD-003", period_id: "AKR-PER-001", criteria_code: "K2", title: "Temuan AMI dan tindak lanjut tata kelola", source_module: "AMI", status: "perlu_revisi", file_name: "rtl-ami-tata-kelola.pdf", linked_lkps_entry_id: null, linked_led_content_id: null, notes: "Butuh bukti penutupan RTL." },
    ],
    lkpsSections: [
      { id: "LKPS-SEC-001", code: "T1", title: "Profil Mahasiswa", criteria_code: "K3", source_module: "SIAKAD", required_fields: ["tahun", "pendaftar", "diterima", "aktif"] },
      { id: "LKPS-SEC-002", code: "T2", title: "Dosen Tetap Program Studi", criteria_code: "K4", source_module: "HRIS", required_fields: ["nama", "nidn", "jabatan", "pendidikan"] },
      { id: "LKPS-SEC-003", code: "T3", title: "Kurikulum dan Mata Kuliah", criteria_code: "K6", source_module: "SIAKAD", required_fields: ["kode_mk", "nama_mk", "sks", "semester"] },
      { id: "LKPS-SEC-004", code: "T4", title: "Luaran Tridharma", criteria_code: "K9", source_module: "SPMI", required_fields: ["jenis", "tahun", "jumlah", "tautan_bukti"] },
    ],
    lkpsEntries: [
      { id: "LKPS-ENT-001", period_id: "AKR-PER-001", section_id: "LKPS-SEC-001", label: "Mahasiswa aktif 2026", value: 842, unit: "mahasiswa", status: "draft", source_module: "SIAKAD", notes: "Menunggu sinkronisasi final SIAKAD." },
      { id: "LKPS-ENT-002", period_id: "AKR-PER-001", section_id: "LKPS-SEC-002", label: "Dosen tetap tersertifikasi", value: 18, unit: "dosen", status: "valid", source_module: "HRIS", notes: "Diambil dari HRIS kompetensi sertifikasi." },
      { id: "LKPS-ENT-003", period_id: "AKR-PER-001", section_id: "LKPS-SEC-004", label: "Publikasi dosen 3 tahun terakhir", value: 64, unit: "luaran", status: "perlu_review", source_module: "SPMI", notes: "Perlu validasi link bukti." },
    ],
    ledSections: [
      { id: "LED-SEC-001", criteria_code: "K1", title: "Analisis VMTS", guidance: "Jelaskan keterkaitan VMTS, strategi, indikator, dan evaluasi ketercapaian." },
      { id: "LED-SEC-002", criteria_code: "K2", title: "Tata Kelola dan Kerja Sama", guidance: "Uraikan sistem tata pamong, audit, RTM, kerja sama, dan tindak lanjut." },
      { id: "LED-SEC-003", criteria_code: "K4", title: "Sumber Daya Manusia", guidance: "Uraikan kecukupan dosen, pengembangan kompetensi, jabatan akademik, dan tendik." },
      { id: "LED-SEC-004", criteria_code: "K6", title: "Pendidikan", guidance: "Uraikan kurikulum, pembelajaran, asesmen, dan perbaikan berkelanjutan." },
    ],
    ledContents: [
      {
        id: "LED-CNT-001",
        period_id: "AKR-PER-001",
        section_id: "LED-SEC-003",
        version: 1,
        content: "UPPS memastikan kecukupan dan kualifikasi dosen melalui pemutakhiran data HRIS, sertifikasi, serta rencana pengembangan kompetensi tahunan.",
        status: "draft",
        reviewer_note: "Tambahkan tren jabatan akademik dan bukti pelatihan.",
        updated_by: "lpm@spmi.local",
      },
      {
        id: "LED-CNT-002",
        period_id: "AKR-PER-001",
        section_id: "LED-SEC-004",
        version: 1,
        content: "Kurikulum dievaluasi melalui PPEPP, AMI, dan masukan pemangku kepentingan dengan tindak lanjut pada pembaruan RPS dan metode asesmen.",
        status: "perlu_review",
        reviewer_note: "Sinkronkan dengan tabel LKPS kurikulum.",
        updated_by: "kaprodi@spmi.local",
      },
    ],
    selfScores: [
      {
        id: "AKR-SCR-001",
        period_id: "AKR-PER-001",
        criteria_code: "K4",
        score: 3.1,
        target_score: 3.6,
        status: "warning",
        gap_note: "Jumlah dosen tersertifikasi sudah baik, tetapi bukti tren jabatan akademik perlu dilengkapi.",
        recommendation: "Lengkapi matriks dosen, sertifikasi, jabatan akademik, dan rencana pengembangan SDM.",
        reviewer: "lpm@spmi.local",
      },
      {
        id: "AKR-SCR-002",
        period_id: "AKR-PER-001",
        criteria_code: "K6",
        score: 3.3,
        target_score: 3.7,
        status: "warning",
        gap_note: "Narasi pendidikan sudah ada, sinkronisasi LKPS kurikulum dan bukti RPS masih perlu diperkuat.",
        recommendation: "Tautkan bukti kurikulum, RPS, hasil evaluasi pembelajaran, dan tindak lanjut PPEPP.",
        reviewer: "kaprodi@spmi.local",
      },
      {
        id: "AKR-SCR-003",
        period_id: "AKR-PER-001",
        criteria_code: "K2",
        score: 2.6,
        target_score: 3.5,
        status: "risk",
        gap_note: "Temuan AMI tata kelola masih memiliki bukti RTL yang perlu direvisi.",
        recommendation: "Tutup bukti RTL AMI, unggah keputusan RTM, dan validasi kerja sama aktif.",
        reviewer: "auditor@spmi.local",
      },
    ],
    actionPlans: [
      {
        id: "AKR-ACT-001",
        period_id: "AKR-PER-001",
        criteria_code: "K4",
        title: "Lengkapi matriks jabatan akademik dosen",
        source: "self_score",
        owner: "lpm@spmi.local",
        priority: "high",
        status: "in_progress",
        target_date: "2026-07-22",
        progress: 55,
        action: "Konsolidasi data HRIS dosen, sertifikasi, jabatan akademik, dan bukti pengembangan SDM.",
        expected_output: "Matriks SDM K4 lengkap dan tervalidasi reviewer.",
        notes: "Menutup gap skor K4 dari penilaian mandiri.",
      },
      {
        id: "AKR-ACT-002",
        period_id: "AKR-PER-001",
        criteria_code: "K6",
        title: "Sinkronkan LKPS kurikulum dengan narasi LED",
        source: "led",
        owner: "kaprodi@spmi.local",
        priority: "high",
        status: "todo",
        target_date: "2026-07-28",
        progress: 20,
        action: "Tautkan RPS, evaluasi pembelajaran, hasil PPEPP, dan tindak lanjut kurikulum ke LED K6.",
        expected_output: "Narasi LED K6 konsisten dengan tabel LKPS dan bukti kurikulum.",
        notes: "Terkait risiko narasi LED belum sinkron.",
      },
      {
        id: "AKR-ACT-003",
        period_id: "AKR-PER-001",
        criteria_code: "K2",
        title: "Tutup bukti RTL AMI tata kelola",
        source: "ami",
        owner: "auditor@spmi.local",
        priority: "medium",
        status: "blocked",
        target_date: "2026-08-02",
        progress: 35,
        action: "Kumpulkan bukti keputusan RTM, status tindak lanjut AMI, dan validasi kerja sama aktif.",
        expected_output: "Bukti RTL AMI K2 valid untuk paket submit akreditasi.",
        notes: "Menunggu unggahan bukti dari unit.",
      },
    ],
    reviews: [
      {
        id: "AKR-REV-001",
        period_id: "AKR-PER-001",
        entity_type: "led",
        entity_id: "LED-CNT-002",
        reviewer: "lpm@spmi.local",
        status: "revision_required",
        decision: "revise",
        note: "Narasi pendidikan perlu ditautkan lebih eksplisit dengan tabel LKPS kurikulum dan bukti RPS.",
        due_date: "2026-07-15",
      },
      {
        id: "AKR-REV-002",
        period_id: "AKR-PER-001",
        entity_type: "evidence",
        entity_id: "AKR-EVD-001",
        reviewer: "auditor@spmi.local",
        status: "approved",
        decision: "approve",
        note: "Bukti HRIS dosen tersertifikasi valid untuk K4.",
        due_date: null,
      },
    ],
    submissionChecks: [
      {
        id: "AKR-CHK-001",
        period_id: "AKR-PER-001",
        category: "LKPS",
        title: "LKPS mahasiswa, dosen, kurikulum, dan luaran lengkap",
        owner: "operator@spmi.local",
        verifier: "lpm@spmi.local",
        status: "in_review",
        due_date: "2026-08-10",
        evidence_id: "AKR-EVD-001",
        notes: "Menunggu sinkronisasi final SIAKAD untuk data lulusan.",
      },
      {
        id: "AKR-CHK-002",
        period_id: "AKR-PER-001",
        category: "LED",
        title: "Narasi LED 9 kriteria sudah direview internal",
        owner: "kaprodi@spmi.local",
        verifier: "auditor@spmi.local",
        status: "pending",
        due_date: "2026-08-14",
        evidence_id: null,
        notes: "K6 masih perlu sinkronisasi RPS dan PPEPP.",
      },
      {
        id: "AKR-CHK-003",
        period_id: "AKR-PER-001",
        category: "BUKTI",
        title: "Bukti fisik prioritas valid dan tertaut",
        owner: "lpm@spmi.local",
        verifier: "auditor@spmi.local",
        status: "verified",
        due_date: "2026-08-12",
        evidence_id: "AKR-EVD-002",
        notes: "Bukti kurikulum sudah valid untuk K6.",
      },
    ],
    exports: [
      {
        id: "AKR-EXP-001",
        period_id: "AKR-PER-001",
        type: "package_manifest",
        file_name: "paket-akreditasi-teknik-informatika-2026.json",
        status: "generated",
        generated_by: "lpm@spmi.local",
        generated_at: "2026-06-10T08:00:00.000Z",
        package_summary: {
          lkps_entries: 2,
          led_contents: 2,
          evidence: 3,
          reviews: 2,
          self_scores: 3,
          submission_checks: 3,
          readiness_items: 7,
        },
        readiness_items: [
          { key: "period", label: "Periode akreditasi tersedia", status: "ready" },
          { key: "lkps", label: "Data LKPS tersedia", status: "ready" },
          { key: "led", label: "Draft LED tersedia", status: "ready" },
          { key: "evidence", label: "Bukti fisik tersedia", status: "ready" },
          { key: "reviews", label: "Review internal berjalan", status: "warning" },
          { key: "self_scores", label: "Penilaian mandiri tersedia", status: "ready" },
          { key: "submission_checks", label: "Checklist submit terverifikasi", status: "warning" },
        ],
      },
    ],
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
    accreditation: state.accreditation,
  };
}

function getAccreditationPeriodById(periodId) {
  return state.accreditation.periods.find((item) => String(item.id) === String(periodId)) || null;
}

function calculateAccreditationProgress(assessment) {
  if (!assessment) return 0;
  return Math.round(
    (
      Number(assessment.lkps_progress || 0) +
      Number(assessment.led_progress || 0) +
      Number(assessment.evidence_progress || 0) +
      Number(assessment.review_progress || 0)
    ) / 4
  );
}

function getAccreditationReadiness(progress) {
  if (progress >= 80) return "ready";
  if (progress >= 45) return "warning";
  return "risk";
}

function enrichAccreditationEvidence(item) {
  const lkpsEntry = state.accreditation.lkpsEntries.find((entry) => entry.id === item.linked_lkps_entry_id) || null;
  const ledContent = state.accreditation.ledContents.find((content) => content.id === item.linked_led_content_id) || null;
  return {
    ...item,
    period: getAccreditationPeriodById(item.period_id),
    lkps_entry: lkpsEntry,
    led_content: ledContent,
  };
}

function getCriterionByCode(code) {
  return state.accreditation.criteria.find((item) => item.code === code) || null;
}

function enrichAccreditationSelfScore(item) {
  const criterion = getCriterionByCode(item.criteria_code);
  const score = Number(item.score || 0);
  const targetScore = Number(item.target_score || 4);
  const gap = Number(Math.max(0, targetScore - score).toFixed(2));
  const weightedScore = criterion ? Number(((score / 4) * Number(criterion.weight || 0)).toFixed(2)) : 0;

  return {
    ...item,
    criterion,
    gap,
    weighted_score: weightedScore,
    readiness_status: gap <= 0.2 ? "ready" : gap <= 0.7 ? "warning" : "risk",
  };
}

function enrichAccreditationActionPlan(item) {
  const targetAt = item.target_date ? new Date(item.target_date).getTime() : null;
  const done = ["done", "closed", "completed"].includes(String(item.status || "").toLowerCase());
  const overdue = Boolean(targetAt && targetAt < Date.now() && !done);
  const progress = Math.max(0, Math.min(100, Number(item.progress || 0)));

  return {
    ...item,
    period: getAccreditationPeriodById(item.period_id),
    criterion: getCriterionByCode(item.criteria_code),
    progress,
    overdue,
    readiness_status: done ? "ready" : overdue || item.status === "blocked" ? "risk" : progress >= 70 ? "warning" : "warning",
  };
}

function enrichAccreditationSubmissionCheck(item) {
  const dueAt = item.due_date ? new Date(item.due_date).getTime() : null;
  const verified = ["verified", "approved", "done"].includes(String(item.status || "").toLowerCase());
  const overdue = Boolean(dueAt && dueAt < Date.now() && !verified);
  const evidence = state.accreditation.evidence.find((entry) => entry.id === item.evidence_id) || null;

  return {
    ...item,
    period: getAccreditationPeriodById(item.period_id),
    evidence: evidence ? enrichAccreditationEvidence(evidence) : null,
    overdue,
    readiness_status: verified ? "ready" : overdue ? "risk" : "warning",
  };
}

function resolveAccreditationReviewEntity(entityType, entityId) {
  if (entityType === "lkps") return state.accreditation.lkpsEntries.find((item) => item.id === entityId) || null;
  if (entityType === "led") return state.accreditation.ledContents.find((item) => item.id === entityId) || null;
  if (entityType === "evidence") return state.accreditation.evidence.find((item) => item.id === entityId) || null;
  if (entityType === "self_score") return state.accreditation.selfScores.find((item) => item.id === entityId) || null;
  return null;
}

function enrichAccreditationReview(item) {
  return {
    ...item,
    period: getAccreditationPeriodById(item.period_id),
    entity: resolveAccreditationReviewEntity(item.entity_type, item.entity_id),
  };
}

function getAccreditationPackageReadiness(periodId) {
  const period = getAccreditationPeriodById(periodId);
  const lkpsEntries = state.accreditation.lkpsEntries.filter((item) => item.period_id === periodId);
  const ledContents = state.accreditation.ledContents.filter((item) => item.period_id === periodId);
  const evidence = state.accreditation.evidence.filter((item) => item.period_id === periodId);
  const reviews = state.accreditation.reviews.filter((item) => item.period_id === periodId);
  const selfScores = state.accreditation.selfScores.filter((item) => item.period_id === periodId);
  const actionPlans = state.accreditation.actionPlans.filter((item) => item.period_id === periodId);
  const submissionChecks = state.accreditation.submissionChecks.filter((item) => item.period_id === periodId);
  const openReviews = reviews.filter((item) => !["approved", "closed"].includes(item.status));
  const invalidEvidence = evidence.filter((item) => !["valid", "approved"].includes(item.status));
  const openActionPlans = actionPlans.filter((item) => !["done", "closed", "completed"].includes(item.status));
  const openSubmissionChecks = submissionChecks.filter((item) => !["verified", "approved", "done"].includes(item.status));

  return [
    { key: "period", label: "Periode akreditasi tersedia", status: period ? "ready" : "risk", count: period ? 1 : 0 },
    { key: "lkps", label: "Data LKPS tersedia", status: lkpsEntries.length ? "ready" : "risk", count: lkpsEntries.length },
    { key: "led", label: "Draft LED tersedia", status: ledContents.length ? "ready" : "risk", count: ledContents.length },
    {
      key: "evidence",
      label: "Bukti fisik valid",
      status: evidence.length === 0 ? "risk" : invalidEvidence.length ? "warning" : "ready",
      count: evidence.length,
      open: invalidEvidence.length,
    },
    {
      key: "reviews",
      label: "Review internal selesai",
      status: reviews.length === 0 ? "risk" : openReviews.length ? "warning" : "ready",
      count: reviews.length,
      open: openReviews.length,
    },
    { key: "self_scores", label: "Penilaian mandiri tersedia", status: selfScores.length ? "ready" : "risk", count: selfScores.length },
    {
      key: "action_plans",
      label: "Rencana perbaikan gap berjalan",
      status: actionPlans.length === 0 ? "risk" : openActionPlans.length ? "warning" : "ready",
      count: actionPlans.length,
      open: openActionPlans.length,
    },
    {
      key: "submission_checks",
      label: "Checklist submit terverifikasi",
      status: submissionChecks.length === 0 ? "risk" : openSubmissionChecks.length ? "warning" : "ready",
      count: submissionChecks.length,
      open: openSubmissionChecks.length,
    },
  ];
}

function enrichAccreditationExport(item) {
  return {
    ...item,
    period: getAccreditationPeriodById(item.period_id),
  };
}

function calculateAccreditationScoreProjection(periodId) {
  const rows = state.accreditation.selfScores.filter((item) => item.period_id === periodId).map(enrichAccreditationSelfScore);
  const totalWeight = state.accreditation.criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0) || 100;
  const coveredWeight = rows.reduce((sum, item) => sum + Number(item.criterion?.weight || 0), 0);
  const weightedScore = rows.reduce((sum, item) => sum + item.weighted_score, 0);
  const normalized = coveredWeight ? (weightedScore / coveredWeight) * totalWeight : 0;
  const scoreProjection = Math.round(normalized * 4);

  return {
    score_projection: scoreProjection,
    predicate_projection: scoreProjection >= 361 ? "UNGGUL" : scoreProjection >= 301 ? "BAIK SEKALI" : scoreProjection >= 200 ? "BAIK" : "PERLU PEMBINAAN",
    criteria_scored: rows.length,
    average_score: rows.length ? Number((rows.reduce((sum, item) => sum + Number(item.score || 0), 0) / rows.length).toFixed(2)) : 0,
    weighted_achievement: Number(normalized.toFixed(2)),
  };
}

function enrichAccreditationTask(item) {
  const dueAt = item.due_date ? new Date(item.due_date).getTime() : null;
  const done = ["done", "approved", "closed"].includes(String(item.status || "").toLowerCase());
  const overdue = Boolean(dueAt && dueAt < Date.now() && !done);

  return {
    ...item,
    period: getAccreditationPeriodById(item.period_id),
    overdue,
    readiness_status: overdue ? "risk" : item.status === "blocked" ? "warning" : done ? "ready" : "warning",
  };
}

function enrichAccreditationMilestone(item) {
  const dueAt = item.due_date ? new Date(item.due_date).getTime() : null;
  const done = ["done", "selesai", "closed"].includes(String(item.status || "").toLowerCase());
  const overdue = Boolean(dueAt && dueAt < Date.now() && !done);

  return {
    ...item,
    period: getAccreditationPeriodById(item.period_id),
    overdue,
    readiness_status: overdue ? "risk" : done ? "ready" : item.status === "planned" ? "warning" : "warning",
  };
}

function enrichAccreditationRisk(item) {
  const probability = Math.max(1, Math.min(5, Number(item.probability || 1)));
  const impact = Math.max(1, Math.min(5, Number(item.impact || 1)));
  const score = probability * impact;
  const dueAt = item.due_date ? new Date(item.due_date).getTime() : null;
  const closed = ["closed", "resolved", "done"].includes(String(item.status || "").toLowerCase());
  const overdue = Boolean(dueAt && dueAt < Date.now() && !closed);

  return {
    ...item,
    period: getAccreditationPeriodById(item.period_id),
    probability,
    impact,
    score,
    overdue,
    level: item.level || (score >= 16 ? "high" : score >= 8 ? "medium" : "low"),
    readiness_status: closed ? "ready" : overdue || score >= 16 ? "risk" : "warning",
  };
}

function getAccreditationSummary() {
  const { periods, instruments, criteria, assessments, teamMembers, tasks, milestones, risks, evidence, lkpsSections, lkpsEntries, ledSections, ledContents, selfScores, actionPlans, reviews, submissionChecks, exports } = state.accreditation;
  const activePeriods = periods.filter((item) => ["draft", "berjalan", "review"].includes(item.status));
  const assessmentRows = assessments.map((assessment) => {
    const period = getAccreditationPeriodById(assessment.period_id);
    const progress = calculateAccreditationProgress(assessment);
    const orgUnit = getOrgUnitReference(assessment.org_unit_code);
    const scoring = calculateAccreditationScoreProjection(assessment.period_id);

    return {
      ...assessment,
      progress,
      readiness_status: assessment.readiness_status || getAccreditationReadiness(progress),
      score_projection: scoring.score_projection || assessment.score_projection,
      predicate_projection: scoring.predicate_projection || assessment.predicate_projection,
      scoring,
      period,
      org_unit: orgUnit,
      evidence_count: evidence.filter((item) => item.period_id === assessment.period_id).length,
      team_count: teamMembers.filter((item) => item.period_id === assessment.period_id).length,
    };
  });
  const averageReadiness = assessmentRows.length
    ? Math.round(assessmentRows.reduce((sum, item) => sum + item.progress, 0) / assessmentRows.length)
    : 0;

  return {
    generated_at: new Date().toISOString(),
    metrics: [
      { label: "Periode aktif", value: activePeriods.length },
      { label: "Instrumen", value: instruments.length },
      { label: "Kriteria", value: criteria.length },
      { label: "Eviden awal", value: evidence.length },
      { label: "LKPS entries", value: lkpsEntries.length },
      { label: "LED drafts", value: ledContents.length },
      { label: "Self scores", value: selfScores.length },
      { label: "Rencana perbaikan", value: actionPlans.filter((item) => !["done", "closed", "completed"].includes(item.status)).length },
      { label: "Task terbuka", value: tasks.filter((item) => item.status !== "done").length },
      { label: "Milestone aktif", value: milestones.filter((item) => !["done", "selesai", "closed"].includes(item.status)).length },
      { label: "Risiko aktif", value: risks.filter((item) => !["closed", "resolved", "done"].includes(item.status)).length },
      { label: "Review terbuka", value: reviews.filter((item) => item.status !== "approved").length },
      { label: "Checklist submit", value: submissionChecks.filter((item) => !["verified", "approved", "done"].includes(item.status)).length },
      { label: "Paket export", value: exports.length },
    ],
    readiness: {
      average_progress: averageReadiness,
      status: getAccreditationReadiness(averageReadiness),
      ready: assessmentRows.filter((item) => item.readiness_status === "ready").length,
      warning: assessmentRows.filter((item) => item.readiness_status === "warning").length,
      risk: assessmentRows.filter((item) => item.readiness_status === "risk").length,
    },
    periods,
    instruments,
    criteria,
    assessments: assessmentRows,
    teamMembers,
    tasks: tasks.map(enrichAccreditationTask),
    milestones: milestones.map(enrichAccreditationMilestone),
    risks: risks.map(enrichAccreditationRisk),
    evidence: evidence.map(enrichAccreditationEvidence),
    lkpsSections,
    lkpsEntries: lkpsEntries.map((entry) => ({
      ...entry,
      section: lkpsSections.find((item) => item.id === entry.section_id) || null,
      period: getAccreditationPeriodById(entry.period_id),
    })),
    ledSections,
    ledContents: ledContents.map((content) => ({
      ...content,
      section: ledSections.find((item) => item.id === content.section_id) || null,
      period: getAccreditationPeriodById(content.period_id),
    })),
    selfScores: selfScores.map(enrichAccreditationSelfScore),
    actionPlans: actionPlans.map(enrichAccreditationActionPlan),
    reviews: reviews.map(enrichAccreditationReview),
    submissionChecks: submissionChecks.map(enrichAccreditationSubmissionCheck),
    exports: exports.map(enrichAccreditationExport),
    scoring: periods.map((period) => ({
      period_id: period.id,
      period_name: period.name,
      ...calculateAccreditationScoreProjection(period.id),
    })),
    integrations: [
      { source: "SIAKAD", data: ["mahasiswa", "lulusan", "kurikulum", "mata kuliah"], status: "ready_for_mapping" },
      { source: "HRIS", data: ["dosen", "tendik", "jabatan", "sertifikasi", "pendidikan"], status: "ready" },
      { source: "SPMI", data: ["standar", "PPEPP", "dokumen mutu"], status: "ready" },
      { source: "AMI/RTM", data: ["temuan", "RTL", "keputusan manajemen"], status: "ready" },
    ],
  };
}

function getAccreditationPeriods() {
  return state.accreditation.periods.map((period) => ({
    ...period,
    instrument: state.accreditation.instruments.find((item) => item.id === period.instrument_id) || null,
    org_unit: getOrgUnitReference(period.org_unit_code),
    team_count: state.accreditation.teamMembers.filter((item) => item.period_id === period.id).length,
  }));
}

function addAccreditationPeriod(data, user = null) {
  const duplicate = findDuplicateBy(state.accreditation.periods, data, [["name", "org_unit_code"]]);
  if (duplicate) {
    throw createConflict("Periode akreditasi dengan nama dan unit yang sama sudah ada.", { duplicate_id: duplicate.id });
  }

  const item = {
    id: buildSequenceCode("AKR-PER", state.accreditation.periods, "id", 3),
    name: data.name || "Periode Akreditasi Baru",
    type: data.type || "APS",
    agency: data.agency || "BAN-PT",
    instrument_id: data.instrument_id || data.instrumentId || state.accreditation.instruments[0]?.id || null,
    org_unit_code: data.org_unit_code || data.orgUnitCode || null,
    start_date: data.start_date || data.startDate || new Date().toISOString().slice(0, 10),
    due_date: data.due_date || data.dueDate || null,
    status: data.status || "draft",
    progress: Number(data.progress || 0),
  };

  state.accreditation.periods.unshift(item);
  recordMutationAudit("accreditation.period", "created", item, null, user, { status_code: 201 });
  return item;
}

function getAccreditationInstruments() {
  return state.accreditation.instruments;
}

function addAccreditationInstrument(data, user = null) {
  const duplicate = findDuplicateBy(state.accreditation.instruments, data, [["code"]]);
  if (duplicate) {
    throw createConflict("Kode instrumen akreditasi sudah ada.", { duplicate_id: duplicate.id });
  }

  const item = {
    id: buildSequenceCode("INS", state.accreditation.instruments, "id", 3),
    code: data.code || buildSequenceCode("INS-KODE", state.accreditation.instruments, "code", 3),
    name: data.name || "Instrumen Akreditasi Baru",
    agency: data.agency || "BAN-PT",
    level: data.level || "Program Studi",
    criteria_count: Number(data.criteria_count || data.criteriaCount || 0),
    status: data.status || "aktif",
  };

  state.accreditation.instruments.unshift(item);
  recordMutationAudit("accreditation.instrument", "created", item, null, user, { status_code: 201 });
  return item;
}

function getAccreditationCriteria() {
  return state.accreditation.criteria;
}

function addAccreditationCriterion(data, user = null) {
  const payload = {
    ...data,
    instrument_id: data.instrument_id || data.instrumentId || state.accreditation.instruments[0]?.id || null,
  };
  const duplicate = findDuplicateBy(state.accreditation.criteria, payload, [["instrument_id", "code"]]);
  if (duplicate) {
    throw createConflict("Kriteria untuk instrumen dan kode yang sama sudah ada.", { duplicate_id: duplicate.id });
  }

  const item = {
    id: buildSequenceCode("K", state.accreditation.criteria, "id", 3),
    instrument_id: payload.instrument_id,
    code: data.code || `K${state.accreditation.criteria.length + 1}`,
    title: data.title || "Kriteria Baru",
    weight: Number(data.weight || 0),
    evidence_required: Number(data.evidence_required || data.evidenceRequired || 0),
    standard_codes: Array.isArray(data.standard_codes) ? data.standard_codes : Array.isArray(data.standardCodes) ? data.standardCodes : [],
  };

  state.accreditation.criteria.push(item);
  recordMutationAudit("accreditation.criterion", "created", item, null, user, { status_code: 201 });
  return item;
}

function getAccreditationAssessments() {
  return state.accreditation.assessments;
}

function addAccreditationAssessment(data, user = null) {
  const item = {
    id: buildSequenceCode("AKR-ASM", state.accreditation.assessments, "id", 3),
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    org_unit_code: data.org_unit_code || data.orgUnitCode || null,
    lkps_progress: Number(data.lkps_progress || data.lkpsProgress || 0),
    led_progress: Number(data.led_progress || data.ledProgress || 0),
    evidence_progress: Number(data.evidence_progress || data.evidenceProgress || 0),
    review_progress: Number(data.review_progress || data.reviewProgress || 0),
    readiness_status: data.readiness_status || data.readinessStatus || "risk",
    score_projection: Number(data.score_projection || data.scoreProjection || 0),
    predicate_projection: data.predicate_projection || data.predicateProjection || "PERLU PEMBINAAN",
    risk_level: data.risk_level || data.riskLevel || "merah",
  };

  state.accreditation.assessments.unshift(item);
  recordMutationAudit("accreditation.assessment", "created", item, null, user, { status_code: 201 });
  return item;
}

function getAccreditationTeamMembers() {
  return state.accreditation.teamMembers;
}

function addAccreditationTeamMember(data, user = null) {
  const duplicate = findDuplicateBy(state.accreditation.teamMembers, data, [["period_id", "email"]]);
  if (duplicate) {
    throw createConflict("Anggota tim akreditasi dengan periode dan email yang sama sudah ada.", { duplicate_id: duplicate.id });
  }

  const item = {
    id: buildSequenceCode("AKR-TIM", state.accreditation.teamMembers, "id", 3),
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    name: data.name || "Anggota Tim",
    role: data.role || "TIM_PENYUSUN",
    responsibility: data.responsibility || data.tanggung_jawab || "Penyusunan dokumen akreditasi",
    email: data.email || null,
  };

  state.accreditation.teamMembers.unshift(item);
  recordMutationAudit("accreditation.team", "created", item, null, user, { status_code: 201 });
  return item;
}

function getAccreditationTasks() {
  return state.accreditation.tasks.map(enrichAccreditationTask);
}

function addAccreditationTask(data, user = null) {
  const item = {
    id: buildSequenceCode("AKR-TSK", state.accreditation.tasks, "id", 3),
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    title: data.title || "Task akreditasi",
    category: data.category || "UMUM",
    assignee: data.assignee || user?.email || user?.username || "team-akreditasi",
    priority: data.priority || "medium",
    status: data.status || "todo",
    due_date: data.due_date || data.dueDate || null,
    progress: Math.max(0, Math.min(100, Number(data.progress || 0))),
    notes: data.notes || data.note || "",
  };

  state.accreditation.tasks.unshift(item);
  recordMutationAudit("accreditation.task", "created", item, null, user, { status_code: 201 });
  return enrichAccreditationTask(item);
}

function getAccreditationMilestones() {
  return state.accreditation.milestones.map(enrichAccreditationMilestone);
}

function addAccreditationMilestone(data, user = null) {
  const item = {
    id: buildSequenceCode("AKR-MIL", state.accreditation.milestones, "id", 3),
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    title: data.title || "Milestone akreditasi",
    phase: data.phase || "persiapan",
    owner: data.owner || user?.email || user?.username || "lpm@spmi.local",
    start_date: data.start_date || data.startDate || null,
    due_date: data.due_date || data.dueDate || null,
    status: data.status || "planned",
    progress: Math.max(0, Math.min(100, Number(data.progress || 0))),
    notes: data.notes || data.note || "",
  };

  state.accreditation.milestones.unshift(item);
  recordMutationAudit("accreditation.milestone", "created", item, null, user, { status_code: 201 });
  return enrichAccreditationMilestone(item);
}

function getAccreditationRisks() {
  return state.accreditation.risks.map(enrichAccreditationRisk);
}

function addAccreditationRisk(data, user = null) {
  const probability = Math.max(1, Math.min(5, Number(data.probability || 1)));
  const impact = Math.max(1, Math.min(5, Number(data.impact || 1)));
  const score = probability * impact;
  const item = {
    id: buildSequenceCode("AKR-RSK", state.accreditation.risks, "id", 3),
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    title: data.title || "Risiko akreditasi",
    category: data.category || "umum",
    owner: data.owner || user?.email || user?.username || "lpm@spmi.local",
    probability,
    impact,
    level: data.level || (score >= 16 ? "high" : score >= 8 ? "medium" : "low"),
    status: data.status || "open",
    mitigation: data.mitigation || "",
    due_date: data.due_date || data.dueDate || null,
    notes: data.notes || data.note || "",
  };

  state.accreditation.risks.unshift(item);
  recordMutationAudit("accreditation.risk", "created", item, null, user, { status_code: 201 });
  return enrichAccreditationRisk(item);
}

function getAccreditationEvidence() {
  return state.accreditation.evidence.map(enrichAccreditationEvidence);
}

function addAccreditationEvidence(data, user = null) {
  const payload = {
    ...data,
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
  };
  const duplicate = findDuplicateBy(state.accreditation.evidence, payload, [["period_id", "criteria_code", "title"]]);
  if (duplicate) {
    throw createConflict("Bukti fisik dengan periode, kriteria, dan judul yang sama sudah ada.", { duplicate_id: duplicate.id });
  }

  const item = {
    id: buildSequenceCode("AKR-EVD", state.accreditation.evidence, "id", 3),
    period_id: payload.period_id,
    criteria_code: data.criteria_code || data.criteriaCode || state.accreditation.criteria[0]?.code || null,
    title: data.title || "Bukti Akreditasi Baru",
    source_module: data.source_module || data.sourceModule || "Manual",
    status: data.status || "draft",
    file_name: data.file_name || data.fileName || null,
    file_url: data.file_url || data.fileUrl || null,
    linked_lkps_entry_id: data.linked_lkps_entry_id || data.linkedLkpsEntryId || null,
    linked_led_content_id: data.linked_led_content_id || data.linkedLedContentId || null,
    notes: data.notes || "",
  };

  state.accreditation.evidence.unshift(item);
  recordMutationAudit("accreditation.evidence", "created", item, null, user, { status_code: 201 });
  return enrichAccreditationEvidence(item);
}

function getAccreditationLkps() {
  return {
    sections: state.accreditation.lkpsSections,
    entries: state.accreditation.lkpsEntries.map((entry) => ({
      ...entry,
      section: state.accreditation.lkpsSections.find((item) => item.id === entry.section_id) || null,
      period: getAccreditationPeriodById(entry.period_id),
    })),
  };
}

function addAccreditationLkpsEntry(data, user = null) {
  const payload = {
    ...data,
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    section_id: data.section_id || data.sectionId || state.accreditation.lkpsSections[0]?.id || null,
  };
  const duplicate = findDuplicateBy(state.accreditation.lkpsEntries, payload, [["period_id", "section_id", "label"]]);
  if (duplicate) {
    throw createConflict("Entry LKPS dengan periode, section, dan label yang sama sudah ada.", { duplicate_id: duplicate.id });
  }

  const section = state.accreditation.lkpsSections.find((item) => item.id === payload.section_id);
  const item = {
    id: buildSequenceCode("LKPS-ENT", state.accreditation.lkpsEntries, "id", 3),
    period_id: payload.period_id,
    section_id: payload.section_id,
    label: data.label || "Entry LKPS Baru",
    value: Number(data.value || 0),
    unit: data.unit || "record",
    status: data.status || "draft",
    source_module: data.source_module || data.sourceModule || section?.source_module || "manual",
    notes: data.notes || "",
  };

  state.accreditation.lkpsEntries.unshift(item);
  recordMutationAudit("accreditation.lkps", "created", item, null, user, { status_code: 201 });
  return item;
}

function getAccreditationLed() {
  return {
    sections: state.accreditation.ledSections,
    contents: state.accreditation.ledContents.map((content) => ({
      ...content,
      section: state.accreditation.ledSections.find((item) => item.id === content.section_id) || null,
      period: getAccreditationPeriodById(content.period_id),
    })),
  };
}

function addAccreditationLedContent(data, user = null) {
  const payload = {
    ...data,
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    section_id: data.section_id || data.sectionId || state.accreditation.ledSections[0]?.id || null,
  };
  const previousVersions = state.accreditation.ledContents.filter(
    (item) => item.period_id === payload.period_id && item.section_id === payload.section_id
  );
  const item = {
    id: buildSequenceCode("LED-CNT", state.accreditation.ledContents, "id", 3),
    period_id: payload.period_id,
    section_id: payload.section_id,
    version: previousVersions.length ? Math.max(...previousVersions.map((entry) => Number(entry.version || 1))) + 1 : 1,
    content: data.content || "",
    status: data.status || "draft",
    reviewer_note: data.reviewer_note || data.reviewerNote || "",
    updated_by: user?.email || user?.username || data.updated_by || "system",
  };

  state.accreditation.ledContents.unshift(item);
  recordMutationAudit("accreditation.led", "created", item, null, user, { status_code: 201 });
  return item;
}

function getAccreditationSelfScores() {
  return {
    scores: state.accreditation.selfScores.map(enrichAccreditationSelfScore),
    scoring: state.accreditation.periods.map((period) => ({
      period_id: period.id,
      period_name: period.name,
      ...calculateAccreditationScoreProjection(period.id),
    })),
  };
}

function addAccreditationSelfScore(data, user = null) {
  const payload = {
    ...data,
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    criteria_code: data.criteria_code || data.criteriaCode || state.accreditation.criteria[0]?.code || null,
  };
  const duplicate = findDuplicateBy(state.accreditation.selfScores, payload, [["period_id", "criteria_code"]]);
  if (duplicate) {
    throw createConflict("Skor mandiri untuk periode dan kriteria yang sama sudah ada.", { duplicate_id: duplicate.id });
  }

  const score = Math.max(0, Math.min(4, Number(data.score || 0)));
  const targetScore = Math.max(0, Math.min(4, Number(data.target_score || data.targetScore || 4)));
  const gap = targetScore - score;
  const item = {
    id: buildSequenceCode("AKR-SCR", state.accreditation.selfScores, "id", 3),
    period_id: payload.period_id,
    criteria_code: payload.criteria_code,
    score,
    target_score: targetScore,
    status: data.status || (gap <= 0.2 ? "ready" : gap <= 0.7 ? "warning" : "risk"),
    gap_note: data.gap_note || data.gapNote || "",
    recommendation: data.recommendation || "",
    reviewer: data.reviewer || user?.email || user?.username || "system",
  };

  state.accreditation.selfScores.unshift(item);
  recordMutationAudit("accreditation.self_score", "created", item, null, user, { status_code: 201 });
  return enrichAccreditationSelfScore(item);
}

function getAccreditationActionPlans() {
  return state.accreditation.actionPlans.map(enrichAccreditationActionPlan);
}

function normalizeAccreditationActionPlanInput(data, user = null) {
  return {
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    criteria_code: data.criteria_code || data.criteriaCode || state.accreditation.criteria[0]?.code || null,
    title: data.title || "Rencana perbaikan akreditasi",
    source: data.source || "self_score",
    owner: data.owner || user?.email || user?.username || "lpm@spmi.local",
    priority: data.priority || "medium",
    status: data.status || "todo",
    target_date: data.target_date || data.targetDate || null,
    progress: Math.max(0, Math.min(100, Number(data.progress || 0))),
    action: data.action || "",
    expected_output: data.expected_output || data.expectedOutput || "",
    notes: data.notes || data.note || "",
  };
}

function findOpenAccreditationActionPlanDuplicate(data) {
  const closedStatuses = ["done", "closed", "completed"];
  return state.accreditation.actionPlans.find((item) => (
    normalizeComparable(item.period_id) === normalizeComparable(data.period_id) &&
    normalizeComparable(item.criteria_code) === normalizeComparable(data.criteria_code) &&
    normalizeComparable(item.source) === normalizeComparable(data.source) &&
    normalizeComparable(item.title) === normalizeComparable(data.title) &&
    !closedStatuses.includes(normalizeComparable(item.status))
  )) || null;
}

function addAccreditationActionPlan(data, user = null) {
  const payload = normalizeAccreditationActionPlanInput(data, user);
  const duplicate = findOpenAccreditationActionPlanDuplicate(payload);
  if (duplicate) {
    throw createConflict("Rencana perbaikan terbuka untuk issue yang sama sudah ada.", { duplicate_id: duplicate.id });
  }

  const item = {
    id: buildSequenceCode("AKR-ACT", state.accreditation.actionPlans, "id", 3),
    ...payload,
  };

  state.accreditation.actionPlans.unshift(item);
  recordMutationAudit("accreditation.action_plan", "created", item, null, user, { status_code: 201 });
  return enrichAccreditationActionPlan(item);
}

function addAccreditationActionPlansBulk(rows, user = null) {
  const created = [];
  const skipped = [];

  for (const row of Array.isArray(rows) ? rows : []) {
    const payload = normalizeAccreditationActionPlanInput(row || {}, user);
    const duplicate = findOpenAccreditationActionPlanDuplicate(payload);

    if (duplicate) {
      skipped.push({ title: payload.title, duplicate_id: duplicate.id, reason: "duplicate_open_action_plan" });
      continue;
    }

    created.push(addAccreditationActionPlan(payload, user));
  }

  return {
    created,
    skipped,
    created_count: created.length,
    skipped_count: skipped.length,
  };
}

function getAccreditationReviews() {
  return state.accreditation.reviews.map(enrichAccreditationReview);
}

function addAccreditationReview(data, user = null) {
  const item = {
    id: buildSequenceCode("AKR-REV", state.accreditation.reviews, "id", 3),
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    entity_type: data.entity_type || data.entityType || "led",
    entity_id: data.entity_id || data.entityId || null,
    reviewer: data.reviewer || user?.email || user?.username || "reviewer",
    status: data.status || "in_review",
    decision: data.decision || "review",
    note: data.note || "",
    due_date: data.due_date || data.dueDate || null,
  };

  state.accreditation.reviews.unshift(item);

  const period = getAccreditationPeriodById(item.period_id);
  if (period && period.status === "berjalan") {
    period.status = "review";
  }

  recordMutationAudit("accreditation.review", "created", item, null, user, { status_code: 201 });
  return enrichAccreditationReview(item);
}

function getAccreditationSubmissionChecks() {
  return state.accreditation.submissionChecks.map(enrichAccreditationSubmissionCheck);
}

function normalizeAccreditationSubmissionCheckInput(data, user = null) {
  return {
    period_id: data.period_id || data.periodId || state.accreditation.periods[0]?.id || null,
    category: data.category || "UMUM",
    title: data.title || "Checklist submit akreditasi",
    owner: data.owner || user?.email || user?.username || "lpm@spmi.local",
    verifier: data.verifier || "lpm@spmi.local",
    status: data.status || "pending",
    due_date: data.due_date || data.dueDate || null,
    evidence_id: data.evidence_id || data.evidenceId || null,
    notes: data.notes || data.note || "",
  };
}

function findOpenAccreditationSubmissionCheckDuplicate(data) {
  const closedStatuses = ["verified", "approved", "done", "closed"];
  return state.accreditation.submissionChecks.find((item) => (
    normalizeComparable(item.period_id) === normalizeComparable(data.period_id) &&
    normalizeComparable(item.category) === normalizeComparable(data.category) &&
    normalizeComparable(item.title) === normalizeComparable(data.title) &&
    !closedStatuses.includes(normalizeComparable(item.status))
  )) || null;
}

function addAccreditationSubmissionCheck(data, user = null) {
  const payload = normalizeAccreditationSubmissionCheckInput(data, user);
  const duplicate = findOpenAccreditationSubmissionCheckDuplicate(payload);
  if (duplicate) {
    throw createConflict("Checklist submit terbuka untuk issue yang sama sudah ada.", { duplicate_id: duplicate.id });
  }

  const item = {
    id: buildSequenceCode("AKR-CHK", state.accreditation.submissionChecks, "id", 3),
    ...payload,
  };

  state.accreditation.submissionChecks.unshift(item);
  recordMutationAudit("accreditation.submission_check", "created", item, null, user, { status_code: 201 });
  return enrichAccreditationSubmissionCheck(item);
}

function addAccreditationSubmissionChecksBulk(rows, user = null) {
  const created = [];
  const skipped = [];

  for (const row of Array.isArray(rows) ? rows : []) {
    const payload = normalizeAccreditationSubmissionCheckInput(row || {}, user);
    const duplicate = findOpenAccreditationSubmissionCheckDuplicate(payload);

    if (duplicate) {
      skipped.push({ title: payload.title, duplicate_id: duplicate.id, reason: "duplicate_open_submission_check" });
      continue;
    }

    created.push(addAccreditationSubmissionCheck(payload, user));
  }

  return {
    created,
    skipped,
    created_count: created.length,
    skipped_count: skipped.length,
  };
}

function updateAccreditationPeriodStatus(periodId, data, user = null) {
  const period = getAccreditationPeriodById(periodId);
  if (!period) return null;

  const previous = { ...period };
  const status = data.status || period.status;
  period.status = status;
  period.progress = Number(data.progress ?? period.progress ?? 0);
  period.final_note = data.final_note || data.finalNote || period.final_note || "";
  period.updated_at = new Date().toISOString();

  if (status === "final" || status === "selesai") {
    const assessment = state.accreditation.assessments.find((item) => item.period_id === period.id);
    if (assessment) {
      assessment.review_progress = 100;
      assessment.readiness_status = status === "selesai" ? "ready" : assessment.readiness_status;
    }
  }

  recordMutationAudit("accreditation.period", "status_updated", period, previous, user);
  return period;
}

function getAccreditationExports() {
  return state.accreditation.exports.map(enrichAccreditationExport);
}

function getAccreditationExportById(exportId) {
  const item = state.accreditation.exports.find((entry) => String(entry.id) === String(exportId));
  return item ? enrichAccreditationExport(item) : null;
}

function generateAccreditationExport(data, user = null) {
  const periodId = data.period_id || data.periodId || state.accreditation.periods[0]?.id || null;
  const period = getAccreditationPeriodById(periodId);
  if (!period) {
    throw createNotFound("Periode akreditasi tidak ditemukan.");
  }

  const type = data.type || "package_manifest";
  const lkpsEntries = state.accreditation.lkpsEntries.filter((item) => item.period_id === periodId);
  const ledContents = state.accreditation.ledContents.filter((item) => item.period_id === periodId);
  const evidence = state.accreditation.evidence.filter((item) => item.period_id === periodId);
  const reviews = state.accreditation.reviews.filter((item) => item.period_id === periodId);
  const selfScores = state.accreditation.selfScores.filter((item) => item.period_id === periodId);
  const actionPlans = state.accreditation.actionPlans.filter((item) => item.period_id === periodId);
  const submissionChecks = state.accreditation.submissionChecks.filter((item) => item.period_id === periodId);
  const readinessItems = getAccreditationPackageReadiness(periodId);
  const openActionPlans = actionPlans.filter((item) => !["done", "closed", "completed"].includes(normalizeComparable(item.status)));
  const openSubmissionChecks = submissionChecks.filter((item) => !["verified", "approved", "done", "closed"].includes(normalizeComparable(item.status)));
  const safeName = String(period.name || "akreditasi").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const extension = type === "zip" ? "zip" : type === "pdf" ? "pdf" : "json";
  const now = new Date().toISOString();
  const item = {
    id: buildSequenceCode("AKR-EXP", state.accreditation.exports, "id", 3),
    period_id: periodId,
    type,
    file_name: data.file_name || data.fileName || `${safeName || "paket-akreditasi"}-${Date.now()}.${extension}`,
    status: readinessItems.some((entry) => entry.status === "risk") ? "needs_attention" : "generated",
    generated_by: user?.email || user?.username || "system",
    generated_at: now,
    package_summary: {
      period: period.name,
      lkps_entries: lkpsEntries.length,
      led_contents: ledContents.length,
      evidence: evidence.length,
      reviews: reviews.length,
      self_scores: selfScores.length,
      action_plans: actionPlans.length,
      submission_checks: submissionChecks.length,
      readiness_items: readinessItems.length,
      open_action_plans: openActionPlans.length,
      open_submission_checks: openSubmissionChecks.length,
      risk_items: readinessItems.filter((entry) => entry.status === "risk").length,
      warning_items: readinessItems.filter((entry) => entry.status === "warning").length,
    },
    readiness_items: readinessItems,
    manifest: {
      period,
      lkps_entries: lkpsEntries,
      led_contents: ledContents,
      evidence: evidence.map(enrichAccreditationEvidence),
      reviews: reviews.map(enrichAccreditationReview),
      self_scores: selfScores.map(enrichAccreditationSelfScore),
      action_plans: actionPlans.map(enrichAccreditationActionPlan),
      submission_checks: submissionChecks.map(enrichAccreditationSubmissionCheck),
      follow_up_summary: {
        open_action_plans: openActionPlans.length,
        open_submission_checks: openSubmissionChecks.length,
        risk_items: readinessItems.filter((entry) => entry.status === "risk"),
        warning_items: readinessItems.filter((entry) => entry.status === "warning"),
      },
    },
  };

  state.accreditation.exports.unshift(item);
  recordMutationAudit("accreditation.export", "generated", item, null, user, { status_code: 201 });
  return enrichAccreditationExport(item);
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

function toStandardReference(standard) {
  if (!standard) return null;
  return {
    id: standard.id,
    code: standard.code,
    title: standard.title,
    category: standard.category,
    version: standard.version,
  };
}

function getOrgUnitReference(code) {
  const orgUnit = orgUnitIndex.get(code);
  if (!orgUnit) return null;
  return {
    code: orgUnit.code,
    name: orgUnit.name,
    type: orgUnit.type,
    parent_code: orgUnit.parent_code || null,
  };
}

function getOrCreateAmiRtmMeeting(audit) {
  let meeting = state.meetings.find((item) => item.code === "RTM-AMI-SYNC");
  if (!meeting) {
    meeting = {
      id: "RTM-AMI-SYNC",
      code: "RTM-AMI-SYNC",
      title: "RTM Pengendalian Temuan AMI",
      meeting_date: new Date().toISOString().slice(0, 10),
      status: "running",
      conclusion: "Rapat kontrol tindak lanjut otomatis dari temuan AMI.",
      org_unit_code: "LPM",
      approval: approvalSeed("review_lpm", "in_review"),
      actions: [],
    };
    state.meetings.unshift(meeting);
  }

  if (audit?.org_unit_code && !meeting.related_units?.includes(audit.org_unit_code)) {
    meeting.related_units = [...(meeting.related_units || []), audit.org_unit_code];
  }

  return meeting;
}

function syncRtlActionFromFinding(audit, finding, user = null) {
  if (!audit || !finding) return null;
  const meeting = getOrCreateAmiRtmMeeting(audit);
  const existing = meeting.actions.find((item) => String(item.source_finding_id) === String(finding.id));
  const status = finding.follow_up?.status === "done" ? "done" : finding.follow_up?.status || "open";
  const progress = status === "done" ? 100 : Number(finding.follow_up?.progress || 0);

  if (existing) {
    Object.assign(existing, {
      action_item: `Tindak lanjut ${finding.category}: ${finding.title}`,
      due_date: finding.follow_up?.due_date || existing.due_date || null,
      status,
      progress,
      owner_notes: finding.follow_up?.plan || finding.recommendation || existing.owner_notes || "",
      evidence: finding.follow_up?.evidence || existing.evidence || [],
      updated_at: new Date().toISOString(),
    });
    finding.follow_up.rtl_action_id = existing.id;
    return existing;
  }

  const action = {
    id: Number(`${Date.now()}${meeting.actions.length + 1}`),
    action_item: `Tindak lanjut ${finding.category}: ${finding.title}`,
    due_date: finding.follow_up?.due_date || null,
    status,
    progress,
    owner_notes: finding.follow_up?.plan || finding.recommendation || "",
    evidence: finding.follow_up?.evidence || [],
    unit: audit.org_unit || getOrgUnitReference(audit.org_unit_code) || { name: audit.org_unit_code || "Unit Kerja" },
    org_unit_code: audit.org_unit_code || "LPM",
    approval: approvalSeed("review_prodi", "in_review"),
    source_module: "ami",
    source_ami_id: audit.id,
    source_finding_id: finding.id,
    source_finding_category: finding.category,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  meeting.actions.unshift(action);
  finding.follow_up.rtl_action_id = action.id;
  recordMutationAudit("rtl", "auto_created_from_ami", action, null, user, {
    audit_id: audit.id,
    finding_id: finding.id,
    status_code: 201,
  });
  return action;
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
    entity: data.entity || null,
    entity_id: data.entity_id || null,
    method: data.method || null,
    path: data.path || null,
    status_code: data.status_code || null,
    ip_address: data.ip_address || null,
    user_agent: data.user_agent || null,
    before: data.before || null,
    after: data.after || null,
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

function buildSequenceCode(prefix, collection, field = "code", width = 3) {
  const escapedPrefix = String(prefix).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nextNumber =
    collection
      .map((item) => Number(String(item[field] || item.id || "").match(new RegExp(`^${escapedPrefix}-(\\d+)$`))?.[1] || 0))
      .reduce((max, value) => Math.max(max, value), 0) + 1;
  return `${prefix}-${String(nextNumber).padStart(width, "0")}`;
}

function createConflict(message, metadata = {}) {
  const error = new Error(message);
  error.statusCode = 409;
  error.metadata = metadata;
  return error;
}

function createNotFound(message, metadata = {}) {
  const error = new Error(message);
  error.statusCode = 404;
  error.metadata = metadata;
  return error;
}

function normalizeComparable(value) {
  return String(value ?? "").trim().toLowerCase();
}

function findDuplicateBy(collection, data, rules, ignoreId = null) {
  return collection.find((item) => {
    if (ignoreId && String(item.id) === String(ignoreId)) return false;
    return rules.some((rule) => {
      if (Array.isArray(rule)) {
        return rule.every((field) => normalizeComparable(item[field]) === normalizeComparable(data[field]));
      }
      return normalizeComparable(item[rule]) && normalizeComparable(item[rule]) === normalizeComparable(data[rule]);
    });
  }) || null;
}

function changedFields(previous, next, fields) {
  return fields.reduce((acc, field) => {
    if (JSON.stringify(previous?.[field] ?? null) !== JSON.stringify(next?.[field] ?? null)) {
      acc[field] = {
        from: previous?.[field] ?? null,
        to: next?.[field] ?? null,
      };
    }
    return acc;
  }, {});
}

function toJsonSafe(value) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
}

function recordMutationAudit(entity, action, item, previous, user, metadata = {}) {
  const changes = previous ? changedFields(previous, item, Object.keys({ ...previous, ...item })) : {};
  const entry = {
    actor_id: user?.id || null,
    actor_email: user?.email || user?.username || metadata.actor || "system",
    role: Array.isArray(user?.roles) ? user.roles.join(",") : user?.role || null,
    action: `${entity}.${action}`,
    entity,
    entity_id: item?.id || item?.code || null,
    method: metadata.method || null,
    path: metadata.path || null,
    status_code: metadata.status_code || 200,
    before: toJsonSafe(previous || null),
    after: toJsonSafe(item || null),
    metadata: {
      entity,
      entity_id: item?.id || item?.code || null,
      code: item?.code || null,
      changed_fields: changes,
      approval: item?.approval || null,
      ...metadata,
    },
  };
  const localEntry = addAuditLog(entry);

  if (env.appMode === "database" && prisma.auditLog?.create) {
    prisma.auditLog.create({
      data: {
        actorId: entry.actor_id,
        actorEmail: entry.actor_email,
        role: entry.role,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entity_id ? String(entry.entity_id) : null,
        method: entry.method,
        path: entry.path,
        statusCode: entry.status_code,
        before: entry.before,
        after: entry.after,
        metadata: entry.metadata,
      },
    }).catch(() => {});
  }

  return localEntry;
}

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

function findStandardReference(data = {}) {
  if (data.standard && typeof data.standard === "object") {
    const standardObject = data.standard;
    const resolved = getActiveStandards().find((item) =>
      [standardObject.id, standardObject.code, standardObject.title].some((candidate) =>
        [item.id, item.code, item.title].some((value) => normalizeComparable(value) === normalizeComparable(candidate))
      )
    );
    return toStandardReference(resolved || standardObject);
  }

  const candidates = [
    data.standard_id,
    data.standardId,
    data.standar_id,
    data.mutu_standard_id,
    data.standard_code,
    data.standardCode,
    data.standar,
    data.standard,
  ]
    .filter(Boolean)
    .map((value) => normalizeComparable(value));

  let standard = getActiveStandards().find((item) =>
    candidates.some((candidate) =>
      [item.id, item.code, item.title].some((value) => normalizeComparable(value) === candidate)
    )
  );

  if (!standard && (data.category || data.type)) {
    const normalizedCategory = normalizeStandardCategory(data.category || data.type);
    standard = getActiveStandards().find((item) => normalizeStandardCategory(item.category) === normalizedCategory);
  }

  return toStandardReference(standard);
}

function normalizeStandardRefForData(data = {}, fallback = null) {
  return findStandardReference(data) || fallback || null;
}

function standardReferencesMatch(left, right) {
  if (!left || !right) return false;
  return [left.id, left.code, left.title].some((leftValue) =>
    [right.id, right.code, right.title].some((rightValue) => normalizeComparable(leftValue) === normalizeComparable(rightValue))
  );
}

function getScopedOrgCodes(code) {
  if (!code) return new Set();
  const { unit, parent } = getUnitWithParents(code);
  const children = (catalog.orgUnits || []).filter((item) => item.parent_code === code).map((item) => item.code);
  return new Set([code, unit?.code, parent?.code, ...children].filter(Boolean));
}

function orgScopesOverlap(leftCode, rightCode) {
  if (!leftCode || !rightCode) return true;
  if ([leftCode, rightCode].some((code) => normalizeComparable(code) === "lpm")) return true;
  const left = getScopedOrgCodes(leftCode);
  const right = getScopedOrgCodes(rightCode);
  return [...left].some((code) => right.has(code));
}

function getAuditStandardRefs(audit) {
  return (audit.instruments || [])
    .map((instrument) => normalizeStandardRefForData(instrument))
    .filter(Boolean);
}

function indicatorHasLinkedDocument(indicator, documents = state.documents) {
  const indicatorStandard = normalizeStandardRefForData(indicator, indicator.standard);
  return documents.some((document) => {
    const documentStandard = normalizeStandardRefForData(document, document.standard);
    return standardReferencesMatch(indicatorStandard, documentStandard) && orgScopesOverlap(indicator.org_unit_code, document.org_unit_code);
  });
}

function documentHasLinkedAmi(document, audits = state.audits) {
  const documentStandard = normalizeStandardRefForData(document, document.standard);
  const documentKind = normalizeComparable(`${document.type || ""} ${document.category || ""} ${document.title || ""}`);

  return audits.some((audit) => {
    const auditMentionsDocument = /ami|audit|evaluasi|evidence|bukti/.test(documentKind);
    const sameScope = orgScopesOverlap(document.org_unit_code, audit.org_unit_code);
    const sameStandard = getAuditStandardRefs(audit).some((standard) => standardReferencesMatch(documentStandard, standard));
    return auditMentionsDocument || sameScope || sameStandard;
  });
}

function rtmHasLinkedPeningkatan(meeting, cycles = state.ppeppCycles) {
  const actions = meeting.actions || [];
  if (!actions.length) return false;

  return cycles.some((cycle) => {
    const improvementStage = (cycle.stages || []).find((stage) => stage.key === "peningkatan");
    const hasImprovementRecord = Boolean(improvementStage);
    const sameScope = actions.some((action) => orgScopesOverlap(action.org_unit_code, cycle.org_unit_code));
    return hasImprovementRecord && sameScope;
  });
}

function getDataSyncMap() {
  const activeStandards = getActiveStandards();
  const validOrgCodes = new Set((catalog.orgUnits || []).map((item) => item.code));
  const validStandardCodes = new Set(activeStandards.map((item) => item.code));
  const activeDocuments = state.documents.filter((item) => !item.deleted_at && item.status !== "deleted");
  const activeIndicators = state.indicators.filter((item) => !item.deleted_at && item.status !== "deleted");
  const activePpeppCycles = state.ppeppCycles.filter((item) => !item.deleted_at && item.status !== "deleted");
  const activeAudits = state.audits.filter((item) => !item.deleted_at && item.status !== "deleted");
  const activeMeetings = state.meetings.filter((item) => !item.deleted_at && item.status !== "deleted");
  const hrisEmployeesByName = new Map(state.hris.employees.map((item) => [normalizeComparable(item.name), item]));
  const allRtlActions = activeMeetings.flatMap((meeting) =>
    (meeting.actions || []).map((action) => ({ ...action, meeting_id: meeting.id, meeting_title: meeting.title }))
  );
  const findings = activeAudits.flatMap((audit) =>
    (audit.findings || []).map((finding) => ({ ...finding, audit_id: audit.id, audit_title: audit.title, org_unit_code: audit.org_unit_code }))
  );
  const ppeppStages = activePpeppCycles.flatMap((cycle) => cycle.stages || []);
  const ppeppEvidence = ppeppStages.flatMap((stage) => stage.evidence || []);
  const documentVersions = state.documents.flatMap((document) => document.versions || []);
  const linkedIndicatorStandards = activeIndicators.filter((item) => {
    const standard = normalizeStandardRefForData(item, item.standard);
    return Boolean(standard?.code && validStandardCodes.has(standard.code));
  }).length;
  const linkedDocumentStandards = activeDocuments.filter((item) => {
    const standard = normalizeStandardRefForData(item);
    return Boolean(standard?.code && validStandardCodes.has(standard.code));
  }).length;
  const linkedPpeppStandards = activePpeppCycles.filter((item) => {
    const standard = normalizeStandardRefForData(item);
    return Boolean(standard?.code && validStandardCodes.has(standard.code));
  }).length;
  const linkedOrganizationStandards = activeStandards.filter(() => (catalog.orgUnits || []).length > 0).length;
  const linkedIndicatorDocuments = activeIndicators.filter((item) => indicatorHasLinkedDocument(item, activeDocuments)).length;
  const linkedDocumentAmi = activeDocuments.filter((item) => documentHasLinkedAmi(item, activeAudits)).length;
  const linkedRtlFindings = findings.filter((finding) =>
    allRtlActions.some((action) => String(action.source_finding_id) === String(finding.id))
  ).length;
  const linkedRtmImprovement = activeMeetings.filter((item) => rtmHasLinkedPeningkatan(item, activePpeppCycles)).length;
  const employeePositionLinks = state.hris.positions.filter((position) =>
    hrisEmployeesByName.has(normalizeComparable(position.holder))
  ).length;
  const roleScopeLinks = (catalog.seedUsers || []).filter((user) => validOrgCodes.has(user.org_unit_code)).length;

  const relationships = [
    {
      key: "organization_to_roles",
      source: "Struktur Perguruan Tinggi",
      target: "Role & Scope Pengguna",
      status: roleScopeLinks === (catalog.seedUsers || []).length ? "ok" : "warning",
      linked: roleScopeLinks,
      missing: Math.max(0, (catalog.seedUsers || []).length - roleScopeLinks),
      business_rule: "Setiap user wajib punya scope fakultas/prodi/unit agar row-level access control konsisten.",
    },
    {
      key: "organization_to_standards",
      source: "Organisasi",
      target: "Standar Mutu",
      status: linkedOrganizationStandards === activeStandards.length ? "ok" : "warning",
      linked: linkedOrganizationStandards,
      missing: Math.max(0, activeStandards.length - linkedOrganizationStandards),
      business_rule: "Standar institusi harus berada dalam struktur organisasi perguruan tinggi yang aktif.",
    },
    {
      key: "hris_to_roles",
      source: "HRIS Jabatan Aktif",
      target: "Role Struktural SPMI",
      status: employeePositionLinks === state.hris.positions.length ? "ok" : "warning",
      linked: employeePositionLinks,
      missing: Math.max(0, state.hris.positions.length - employeePositionLinks),
      business_rule: "Jabatan HRIS menjadi referensi kewenangan Dekan, Kaprodi, Unit, dan pimpinan.",
    },
    {
      key: "standards_to_indicators",
      source: "Standar Mutu",
      target: "Indikator KPI",
      status: linkedIndicatorStandards === activeIndicators.length ? "ok" : "warning",
      linked: linkedIndicatorStandards,
      missing: Math.max(0, activeIndicators.length - linkedIndicatorStandards),
      business_rule: "Indikator harus menunjuk standar supaya dashboard ketercapaian valid.",
    },
    {
      key: "indicators_to_documents",
      source: "Indikator",
      target: "Dokumen",
      status: linkedIndicatorDocuments === activeIndicators.length ? "ok" : "warning",
      linked: linkedIndicatorDocuments,
      missing: Math.max(0, activeIndicators.length - linkedIndicatorDocuments),
      business_rule: "Indikator harus memiliki dokumen/evidence berdasarkan standar dan scope unit yang sama.",
    },
    {
      key: "standards_to_ppepp",
      source: "Standar Mutu",
      target: "Siklus PPEPP",
      status: linkedPpeppStandards === activePpeppCycles.length ? "ok" : "warning",
      linked: linkedPpeppStandards,
      missing: Math.max(0, activePpeppCycles.length - linkedPpeppStandards),
      business_rule: "PPEPP berjalan per standar atau kategori standar yang jelas.",
    },
    {
      key: "standards_to_documents",
      source: "Standar Mutu",
      target: "Dokumen & Evidence",
      status: linkedDocumentStandards === activeDocuments.length ? "ok" : "warning",
      linked: linkedDocumentStandards,
      missing: Math.max(0, activeDocuments.length - linkedDocumentStandards),
      business_rule: "Dokumen harus punya referensi standar/kategori untuk audit dan repository.",
    },
    {
      key: "documents_to_ami",
      source: "Dokumen",
      target: "AMI",
      status: linkedDocumentAmi === activeDocuments.length ? "ok" : "warning",
      linked: linkedDocumentAmi,
      missing: Math.max(0, activeDocuments.length - linkedDocumentAmi),
      business_rule: "Dokumen mutu dan evidence harus dapat ditelusuri ke proses evaluasi AMI.",
    },
    {
      key: "ppepp_to_evidence",
      source: "Tahapan PPEPP",
      target: "Evidence Digital",
      status: ppeppEvidence.length > 0 ? "ok" : "warning",
      linked: ppeppEvidence.length,
      missing: ppeppEvidence.length > 0 ? 0 : ppeppStages.length,
      business_rule: "Setiap tahap PPEPP perlu bukti agar monitoring proses dapat diaudit.",
    },
    {
      key: "ami_to_rtl",
      source: "Temuan AMI",
      target: "RTL / RTM",
      status: linkedRtlFindings === findings.length ? "ok" : "warning",
      linked: linkedRtlFindings,
      missing: Math.max(0, findings.length - linkedRtlFindings),
      business_rule: "Setiap temuan AMI otomatis masuk daftar tindak lanjut dan dapat dibahas di RTM.",
    },
    {
      key: "rtl_to_rtm",
      source: "RTL",
      target: "Rapat Tinjauan Manajemen",
      status: allRtlActions.length > 0 ? "ok" : "warning",
      linked: allRtlActions.length,
      missing: allRtlActions.length > 0 ? 0 : 1,
      business_rule: "RTL harus berada dalam agenda RTM agar pengendalian mutu terdokumentasi.",
    },
    {
      key: "rtm_to_peningkatan",
      source: "RTM",
      target: "Peningkatan",
      status: linkedRtmImprovement === activeMeetings.length ? "ok" : "warning",
      linked: linkedRtmImprovement,
      missing: Math.max(0, activeMeetings.length - linkedRtmImprovement),
      business_rule: "Keputusan RTM harus mengalir ke tahap peningkatan PPEPP pada unit terkait.",
    },
    {
      key: "dashboard_to_sources",
      source: "Dashboard KPI",
      target: "Indikator, PPEPP, AMI, Dokumen",
      status: activeIndicators.length && activeAudits.length && activePpeppCycles.length && activeDocuments.length ? "ok" : "warning",
      linked: activeIndicators.length + activeAudits.length + activePpeppCycles.length + activeDocuments.length,
      missing: 0,
      business_rule: "Dashboard pimpinan membaca data agregat dari modul operasional, bukan angka lepas.",
    },
  ];

  const warningCount = relationships.filter((item) => item.status !== "ok").length;

  return {
    generated_at: new Date().toISOString(),
    summary: {
      status: warningCount ? "warning" : "ok",
      relationship_total: relationships.length,
      ok: relationships.length - warningCount,
      warning: warningCount,
      module_total: 10,
    },
    modules: {
      organization: {
        total_units: catalog.orgUnits.length,
        user_scopes: roleScopeLinks,
      },
      hris: {
        employees: state.hris.employees.length,
        positions: state.hris.positions.length,
        linked_positions: employeePositionLinks,
        competencies: state.hris.competencies.length,
        documents: state.hris.documents.length,
      },
      standards: {
        total: activeStandards.length,
        categories: STANDARD_CATEGORIES.map((category) => ({
          key: category.key,
          total: activeStandards.filter((item) => normalizeStandardCategory(item.category) === category.key).length,
        })),
      },
      indicators: {
        total: activeIndicators.length,
        linked_to_standard: linkedIndicatorStandards,
        orphan: Math.max(0, activeIndicators.length - linkedIndicatorStandards),
      },
      ppepp: {
        cycles: activePpeppCycles.length,
        stages: ppeppStages.length,
        evidence: ppeppEvidence.length,
        linked_to_standard: linkedPpeppStandards,
      },
      documents: {
        total: state.documents.length,
        versions: documentVersions.length,
        linked_to_standard: linkedDocumentStandards,
      },
      ami: {
        audits: activeAudits.length,
        findings: findings.length,
        findings_with_rtl: linkedRtlFindings,
      },
      rtl: {
        actions: allRtlActions.length,
        open: allRtlActions.filter((item) => item.status !== "done").length,
        done: allRtlActions.filter((item) => item.status === "done").length,
      },
      rtm: {
        meetings: activeMeetings.length,
        active: activeMeetings.filter((item) => item.status !== "done").length,
      },
      dashboard: {
        indicators: activeIndicators.length,
        source_records: activeIndicators.length + activeAudits.length + activePpeppCycles.length + activeDocuments.length,
      },
    },
    relationships,
    warnings: relationships
      .filter((item) => item.status !== "ok")
      .map((item) => ({
        key: item.key,
        message: `${item.source} belum sepenuhnya sinkron dengan ${item.target}.`,
        missing: item.missing,
      })),
  };
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

function addStandard(data, user) {
  const category = normalizeStandardCategory(data.category);
  const code = getNextStandardCode(category);
  const duplicate = findDuplicateBy(state.standards.filter((item) => !item.deleted_at), { ...data, category }, [["title", "category"]]);
  if (duplicate) {
    throw createConflict("Standar dengan judul dan kategori yang sama sudah ada.", { duplicate_id: duplicate.id, duplicate_code: duplicate.code });
  }
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
  recordMutationAudit("standard", "created", item, null, user, { status_code: 201 });
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
  const duplicate = findDuplicateBy(
    state.standards.filter((item) => !item.deleted_at),
    { title: data.title || standard.title, category: nextCategory },
    [["title", "category"]],
    standard.id
  );
  if (duplicate) {
    throw createConflict("Standar dengan judul dan kategori yang sama sudah ada.", { duplicate_id: duplicate.id, duplicate_code: duplicate.code });
  }
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

  recordMutationAudit("standard", "updated", standard, previous, { email: data.changed_by || "system" });
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
  recordMutationAudit("standard", "deleted", standard, null, { email: data.changed_by || "system" });
  return standard;
}

function getStandardRevisions(standardId) {
  const standard = state.standards.find((item) => String(item.id) === String(standardId) || item.code === standardId);
  return standard?.revisions || null;
}

function addDocument(data, user) {
  const id = Date.now();
  const code = data.code || buildSequenceCode("DOC-SPMI", state.documents, "code", 3);
  const item = {
    id,
    code,
    title: data.title,
    type: data.type || "kebijakan",
    status: "draft",
    org_unit_code: data.org_unit_code || null,
    document_date: data.document_date || data.tanggal || new Date().toISOString().slice(0, 10),
    category: data.category || data.kategori || data.type || "kebijakan",
    standard: findStandardReference(data),
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
  recordMutationAudit("document", "created", item, null, user, { status_code: 201 });
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
  recordMutationAudit("document", "version_created", document, null, user, {
    version_id: version.id,
    file_name: version.file_name,
    status_code: 201,
  });
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
    syncRtlActionFromFinding(audit, finding, { email: data.changed_by || "system" });
  }
  return finding;
}

function addMeeting(data, user) {
  const item = {
    id: Date.now(),
    code: buildSequenceCode("RTM", state.meetings, "code", 3),
    title: data.title,
    meeting_date: data.meeting_date,
    status: "scheduled",
    conclusion: data.conclusion || null,
    org_unit_code: data.org_unit_code || null,
    approval: getInitialApproval(user),
    actions: [],
  };
  state.meetings.unshift(item);
  recordMutationAudit("rtm", "created", item, null, user, { status_code: 201 });
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
  const previous = { ...action };
  const rawProgress = Number.isFinite(Number(data.progress)) ? Number(data.progress) : action.progress ?? 0;
  const nextProgress = Math.min(100, Math.max(0, rawProgress));

  action.status = nextStatus;
  action.progress = nextStatus === "done" ? 100 : nextProgress;
  action.owner_notes = data.owner_notes ?? action.owner_notes ?? null;
  action.updated_at = new Date().toISOString();
  recordMutationAudit("rtl", "updated", action, previous, null, { meeting_id: meeting.id });

  return {
    meeting_id: meeting.id,
    meeting: { title: meeting.title },
    ...action,
  };
}

function addPpeppCycle(data, user) {
  const duplicate = state.ppeppCycles.find((item) => {
    const sameScope = normalizeComparable(item.org_unit_code) === normalizeComparable(data.org_unit_code);
    const sameName = sameScope && normalizeComparable(item.name) === normalizeComparable(data.name);
    const hasAcademicYear = Boolean(item.academic_year_start && item.academic_year_end && data.academic_year_start && data.academic_year_end);
    const sameYear =
      hasAcademicYear &&
      sameScope &&
      String(item.academic_year_start || "") === String(data.academic_year_start || "") &&
      String(item.academic_year_end || "") === String(data.academic_year_end || "");
    return sameName || sameYear;
  });
  if (duplicate) {
    throw createConflict("Siklus PPEPP dengan nama/periode/unit yang sama sudah ada.", { duplicate_id: duplicate.id });
  }
  const item = normalizePpeppCycle({
    id: Date.now(),
    name: data.name || `Siklus ${new Date().getFullYear()}`,
    period: data.period || "yearly",
    status: data.status || "planned",
    org_unit_code: data.org_unit_code || null,
    standard: findStandardReference(data),
    approval: getInitialApproval(user),
    academic_year_start: data.academic_year_start || null,
    academic_year_end: data.academic_year_end || null,
    created_at: new Date().toISOString(),
  });
  state.ppeppCycles.unshift(item);
  recordMutationAudit("ppepp", "created", item, null, user, { status_code: 201 });
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
  recordMutationAudit("ppepp", "stage_updated", cycle, null, user, { stage: stage.key });

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
  recordMutationAudit("ppepp", "evidence_uploaded", cycle, null, user, { stage: stage.key, evidence_id: evidence.id, status_code: 201 });

  return { cycle, stage, evidence };
}

function addAmiAudit(data, user) {
  const duplicate = state.audits.find((item) =>
    normalizeComparable(item.org_unit_code) === normalizeComparable(data.org_unit_code) &&
    String(item.scheduled_date || item.audit_date || "") === String(data.scheduled_date || data.audit_date || "") &&
    item.status !== "cancelled"
  );
  if (duplicate) {
    throw createConflict("Audit untuk unit dan tanggal yang sama sudah terjadwal.", { duplicate_id: duplicate.id });
  }
  const item = normalizeAmiAudit({
    id: Date.now(),
    code: buildSequenceCode("AMI", state.audits, "code", 3),
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
  recordMutationAudit("ami", "created", item, null, user, { status_code: 201 });
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
  recordMutationAudit("ami", "assignment_updated", audit, null, user);
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
  recordMutationAudit("ami", "instrument_updated", audit, null, user, { instrument_id: instrumentId });
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
  syncRtlActionFromFinding(audit, finding, user);
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
  const code = data.code || buildSequenceCode("IKU", state.indicators, "code", 3);
  const duplicate = findDuplicateBy(
    state.indicators,
    { ...data, code },
    ["code", ["name", "org_unit_code"]],
  );
  if (duplicate) {
    throw createConflict("Indikator dengan kode atau nama/unit yang sama sudah ada.", { duplicate_id: duplicate.id, duplicate_code: duplicate.code });
  }
  const item = {
    id: Date.now(),
    code,
    name: data.name,
    description: data.description || "",
    target_value: Number(data.target_value || 0),
    unit: data.unit || "%",
    source_type: data.source_type || "manual",
    standard: findStandardReference(data),
    org_unit_code: data.org_unit_code || null,
    approval: getInitialApproval(user),
    latest_value: null,
    history: [],
  };
  state.indicators.unshift(item);
  bumpDashboardCache();
  recordMutationAudit("indicator", "created", item, null, user, { status_code: 201 });
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
  recordMutationAudit("indicator", "value_created", indicator, null, null, {
    period: value.period,
    actual_value: value.actual_value,
    status: value.status,
    status_code: 201,
  });
  return value;
}

function addSurvey(data) {
  const duplicate = state.surveys.find((item) =>
    normalizeComparable(item.title) === normalizeComparable(data.title) &&
    normalizeComparable(item.target) === normalizeComparable(data.target) &&
    String(item.ppepp_cycle_id || "") === String(data.ppepp_cycle_id || "")
  );
  if (duplicate) {
    throw createConflict("Survei dengan judul, target, dan siklus yang sama sudah ada.", { duplicate_id: duplicate.id });
  }
  const item = {
    id: Date.now(),
    code: buildSequenceCode("SRV", state.surveys, "code", 3),
    title: data.title || "Survei Baru",
    target: data.target || "mahasiswa",
    status: data.status || "draft",
    ppepp_cycle_id: data.ppepp_cycle_id || null,
  };

  state.surveys.unshift(item);
  recordMutationAudit("survey", "created", item, null, null, { status_code: 201 });
  return item;
}

function addImport(data) {
  const duplicate = state.imports.find((item) =>
    normalizeComparable(item.type) === normalizeComparable(data.type) &&
    normalizeComparable(item.title) === normalizeComparable(data.title)
  );
  if (duplicate) {
    throw createConflict("Import dengan tipe dan judul yang sama sudah ada.", { duplicate_id: duplicate.id });
  }
  const item = {
    id: Date.now(),
    code: buildSequenceCode("IMP", state.imports, "code", 3),
    type: data.type || "lkpt",
    title: data.title || "Import Baru",
    status: data.status || "queued",
    file_name: data.file_name || "mock-import.xlsx",
  };

  state.imports.unshift(item);
  recordMutationAudit("import", "created", item, null, null, { file_name: item.file_name, status_code: 201 });
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
  const employeeNumber = data.employeeNumber || data.employee_number || buildSequenceCode("HR", state.hris.employees, "employeeNumber", 5);
  const incomingNidn = normalizeComparable(data.nidn);
  const duplicate = state.hris.employees.find((item) => {
    const sameEmployeeNumber = normalizeComparable(item.employeeNumber) === normalizeComparable(employeeNumber);
    const sameEmail = normalizeComparable(item.email) === normalizeComparable(data.email);
    const sameNidn = incomingNidn && incomingNidn !== "-" && normalizeComparable(item.nidn) === incomingNidn;
    return sameEmployeeNumber || sameEmail || sameNidn;
  });
  if (duplicate) {
    throw createConflict("Pegawai HRIS dengan NIP/NIDN/email yang sama sudah ada.", { duplicate_id: duplicate.id });
  }
  const item = {
    id: buildSequenceCode("EMP", state.hris.employees, "id", 3),
    name: data.name || "Pegawai Baru",
    employeeNumber,
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
  recordMutationAudit("hris.employee", "created", item, null, null, { status_code: 201 });
  return item;
}

function updateHrisEmployee(employeeId, data) {
  const employee = state.hris.employees.find((item) => String(item.id) === String(employeeId));
  if (!employee) {
    return null;
  }

  const previous = { ...employee };
  const previousName = employee.name;
  const nextEmployeeNumber = data.employeeNumber || data.employee_number || employee.employeeNumber;
  const nextNidn = normalizeComparable(data.nidn || employee.nidn);
  const duplicate = state.hris.employees.find((item) => {
    if (String(item.id) === String(employee.id)) return false;
    const sameEmployeeNumber = normalizeComparable(item.employeeNumber) === normalizeComparable(nextEmployeeNumber);
    const sameEmail = normalizeComparable(item.email) === normalizeComparable(data.email || employee.email);
    const sameNidn = nextNidn && nextNidn !== "-" && normalizeComparable(item.nidn) === nextNidn;
    return sameEmployeeNumber || sameEmail || sameNidn;
  });
  if (duplicate) {
    throw createConflict("Pegawai HRIS dengan NIP/NIDN/email yang sama sudah ada.", { duplicate_id: duplicate.id });
  }
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
  recordMutationAudit("hris.employee", "updated", employee, previous, null);
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
  recordMutationAudit("hris.employee", "deleted", employee, null, null);
  return employee;
}

function addHrisPosition(data) {
  const duplicate = findDuplicateBy(state.hris.positions, data, [["title", "unit", "holder", "period"]]);
  if (duplicate) {
    throw createConflict("Jabatan HRIS dengan title/unit/pejabat/periode yang sama sudah ada.", { duplicate_id: duplicate.id });
  }
  const item = {
    id: buildSequenceCode("POS", state.hris.positions, "id", 3),
    title: data.title || "Jabatan Baru",
    unit: data.unit || "Unit Kerja",
    holder: data.holder || "Belum ditetapkan",
    period: data.period || String(new Date().getFullYear()),
    status: data.status || "Aktif",
  };

  state.hris.positions.unshift(item);
  recordMutationAudit("hris.position", "created", item, null, null, { status_code: 201 });
  return item;
}

function updateHrisPosition(positionId, data) {
  const position = state.hris.positions.find((item) => String(item.id) === String(positionId));
  if (!position) {
    return null;
  }

  const previous = { ...position };
  Object.assign(position, {
    title: data.title || position.title,
    unit: data.unit || position.unit,
    holder: data.holder || position.holder,
    period: data.period || position.period,
    status: data.status || position.status,
  });
  recordMutationAudit("hris.position", "updated", position, previous, null);
  return position;
}

function deleteHrisPosition(positionId) {
  const index = state.hris.positions.findIndex((item) => String(item.id) === String(positionId));
  if (index === -1) {
    return null;
  }

  const [position] = state.hris.positions.splice(index, 1);
  recordMutationAudit("hris.position", "deleted", position, null, null);
  return position;
}

function addHrisCompetency(data) {
  const duplicate = findDuplicateBy(state.hris.competencies, data, [["employee", "category", "name", "year"]]);
  if (duplicate) {
    throw createConflict("Kompetensi HRIS untuk pegawai/kategori/nama/tahun yang sama sudah ada.", { duplicate_id: duplicate.id });
  }
  const item = {
    id: buildSequenceCode("CMP", state.hris.competencies, "id", 3),
    employee: data.employee || "Pegawai",
    category: data.category || "Kompetensi",
    name: data.name || "Kompetensi Baru",
    year: Number(data.year || new Date().getFullYear()),
    status: data.status || "Tervalidasi",
  };

  state.hris.competencies.unshift(item);
  refreshHrisMetrics();
  recordMutationAudit("hris.competency", "created", item, null, null, { status_code: 201 });
  return item;
}

function updateHrisCompetency(competencyId, data) {
  const competency = state.hris.competencies.find((item) => String(item.id) === String(competencyId));
  if (!competency) {
    return null;
  }

  const previous = { ...competency };
  Object.assign(competency, {
    employee: data.employee || competency.employee,
    category: data.category || competency.category,
    name: data.name || competency.name,
    year: Number(data.year || competency.year),
    status: data.status || competency.status,
  });
  refreshHrisMetrics();
  recordMutationAudit("hris.competency", "updated", competency, previous, null);
  return competency;
}

function deleteHrisCompetency(competencyId) {
  const index = state.hris.competencies.findIndex((item) => String(item.id) === String(competencyId));
  if (index === -1) {
    return null;
  }

  const [competency] = state.hris.competencies.splice(index, 1);
  refreshHrisMetrics();
  recordMutationAudit("hris.competency", "deleted", competency, null, null);
  return competency;
}

function addHrisDocument(data) {
  const duplicate = state.hris.documents.find((item) => {
    const sameIdentity =
      normalizeComparable(item.employee) === normalizeComparable(data.employee) &&
      normalizeComparable(item.type) === normalizeComparable(data.type) &&
      normalizeComparable(item.title) === normalizeComparable(data.title);
    if (!sameIdentity) return false;
    const incomingFile = normalizeComparable(data.fileName || data.file_name);
    const existingFile = normalizeComparable(item.fileName || item.file_name);
    return incomingFile && existingFile && incomingFile === existingFile;
  });
  if (duplicate) {
    throw createConflict("Dokumen HRIS dengan pegawai/jenis/judul yang sama sudah ada.", { duplicate_id: duplicate.id });
  }
  const item = {
    id: buildSequenceCode("DOC-HR", state.hris.documents, "id", 3),
    employee: data.employee || "Pegawai",
    type: data.type || "Dokumen SDM",
    title: data.title || "Dokumen Baru",
    status: data.status || "Valid",
    fileName: data.fileName || data.file_name || null,
    filePath: data.filePath || data.file_path || null,
    fileSize: Number(data.fileSize || data.file_size || 0),
  };

  state.hris.documents.unshift(item);
  recordMutationAudit("hris.document", "created", item, null, null, { status_code: 201 });
  return item;
}

function updateHrisDocument(documentId, data) {
  const document = state.hris.documents.find((item) => String(item.id) === String(documentId));
  if (!document) {
    return null;
  }

  const previous = { ...document };
  Object.assign(document, {
    employee: data.employee || document.employee,
    type: data.type || document.type,
    title: data.title || document.title,
    status: data.status || document.status,
    fileName: data.fileName || data.file_name || document.fileName || null,
    filePath: data.filePath || data.file_path || document.filePath || null,
    fileSize: Number(data.fileSize || data.file_size || document.fileSize || 0),
  });
  recordMutationAudit("hris.document", "updated", document, previous, null);
  return document;
}

function deleteHrisDocument(documentId) {
  const index = state.hris.documents.findIndex((item) => String(item.id) === String(documentId));
  if (index === -1) {
    return null;
  }

  const [document] = state.hris.documents.splice(index, 1);
  recordMutationAudit("hris.document", "deleted", document, null, null);
  return document;
}

module.exports = {
  state,
  getCatalogSnapshot,
  getDashboardSummary,
  getDashboardExport,
  getDocumentsPage,
  getPerformanceReport,
  getDataSyncMap,
  getHrisSummary,
  getHrisEmployeeProfile,
  getAccreditationSummary,
  getAccreditationPeriods,
  addAccreditationPeriod,
  getAccreditationInstruments,
  addAccreditationInstrument,
  getAccreditationCriteria,
  addAccreditationCriterion,
  getAccreditationAssessments,
  addAccreditationAssessment,
  getAccreditationTeamMembers,
  addAccreditationTeamMember,
  getAccreditationTasks,
  addAccreditationTask,
  getAccreditationMilestones,
  addAccreditationMilestone,
  getAccreditationRisks,
  addAccreditationRisk,
  getAccreditationEvidence,
  addAccreditationEvidence,
  getAccreditationLkps,
  addAccreditationLkpsEntry,
  getAccreditationLed,
  addAccreditationLedContent,
  getAccreditationSelfScores,
  addAccreditationSelfScore,
  getAccreditationActionPlans,
  addAccreditationActionPlan,
  addAccreditationActionPlansBulk,
  getAccreditationReviews,
  addAccreditationReview,
  getAccreditationSubmissionChecks,
  addAccreditationSubmissionCheck,
  addAccreditationSubmissionChecksBulk,
  updateAccreditationPeriodStatus,
  getAccreditationExports,
  getAccreditationExportById,
  generateAccreditationExport,
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
