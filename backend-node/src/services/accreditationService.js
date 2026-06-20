const prisma = require("../lib/prisma");
const env = require("../config/env");
const catalogStore = require("./catalogStore");

const DEFAULT_INSTITUTION_CODE = "DEFAULT";

function useLocalStore() {
  return env.appMode !== "database";
}

function normalizeStatus(value, fallback = "draft") {
  return String(value || fallback).trim();
}

function toDate(value) {
  return value ? new Date(value) : null;
}

function toIsoDate(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

function userEmail(user) {
  return user?.email || user?.username || "system";
}

async function getDefaultInstitution() {
  let institution = await prisma.institution.findFirst({
    where: { code: DEFAULT_INSTITUTION_CODE },
    orderBy: { createdAt: "asc" },
  });

  if (institution) return institution;

  institution = await prisma.institution.create({
    data: {
      id: "inst-default",
      code: DEFAULT_INSTITUTION_CODE,
      name: "Universitas Junrejo Indah",
      systemName: "SPMI Command Center",
      academicYear: "2026/2027",
      configuration: { locale: "id-ID", timezone: "Asia/Jakarta" },
    },
  });
  return institution;
}

async function getOrgUnitByCode(institutionId, code) {
  if (!code) return null;
  return prisma.orgUnit.findFirst({
    where: { institutionId, code: String(code), deletedAt: null },
  });
}

async function getCriterionByCode(code, instrumentId = null) {
  if (!code) return null;
  return prisma.accreditationCriterion.findFirst({
    where: {
      code: String(code),
      deletedAt: null,
      ...(instrumentId ? { instrumentId } : {}),
    },
  });
}

async function ensureDatabaseSeeded() {
  const institution = await getDefaultInstitution();
  const existing = await prisma.accreditationInstrument.count({
    where: { institutionId: institution.id, deletedAt: null },
  });
  if (existing > 0) return institution;

  const source = catalogStore.state.accreditation;
  const orgUnits = await prisma.orgUnit.findMany({
    where: { institutionId: institution.id, deletedAt: null },
  });
  const orgByCode = new Map(orgUnits.map((item) => [item.code, item]));

  for (const item of source.instruments) {
    await prisma.accreditationInstrument.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        institutionId: institution.id,
        code: item.code,
        name: item.name,
        agency: item.agency,
        level: item.level,
        status: item.status || "aktif",
        criteriaCount: Number(item.criteria_count || 0),
      },
    });
  }

  for (const item of source.criteria) {
    await prisma.accreditationCriterion.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        instrumentId: item.instrument_id,
        code: item.code,
        title: item.title,
        weight: Number(item.weight || 0),
        evidenceRequired: Number(item.evidence_required || 0),
        standardCodes: item.standard_codes || [],
      },
    });
  }

  for (const item of source.periods) {
    await prisma.accreditationPeriod.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        institutionId: institution.id,
        instrumentId: item.instrument_id,
        orgUnitId: orgByCode.get(item.org_unit_code)?.id || null,
        name: item.name,
        scopeType: item.type === "APT" ? "APT" : "APS",
        agency: item.agency,
        startDate: toDate(item.start_date) || new Date(),
        dueDate: toDate(item.due_date),
        status: normalizeStatus(item.status, "draft"),
        progress: Number(item.progress || 0),
        metadata: { org_unit_code: item.org_unit_code || null },
      },
    });
  }

  for (const item of source.assessments) {
    await prisma.accreditationAssessment.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        orgUnitId: orgByCode.get(item.org_unit_code)?.id || null,
        lkpsProgress: Number(item.lkps_progress || 0),
        ledProgress: Number(item.led_progress || 0),
        evidenceProgress: Number(item.evidence_progress || 0),
        reviewProgress: Number(item.review_progress || 0),
        readinessStatus: item.readiness_status || "risk",
        scoreProjection: Number(item.score_projection || 0),
        predicateProjection: item.predicate_projection || null,
        riskLevel: item.risk_level || "merah",
        metadata: { org_unit_code: item.org_unit_code || null },
      },
    });
  }

  for (const item of source.teamMembers) {
    await prisma.accreditationTeamMember.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        name: item.name,
        role: item.role,
        responsibility: item.responsibility || null,
        email: item.email || null,
      },
    });
  }

  for (const item of source.tasks) {
    await prisma.accreditationTask.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        title: item.title,
        category: item.category || "UMUM",
        assignee: item.assignee || null,
        priority: item.priority || "medium",
        status: item.status || "todo",
        dueDate: toDate(item.due_date),
        progress: Number(item.progress || 0),
        notes: item.notes || null,
      },
    });
  }

  for (const item of source.milestones) {
    await prisma.accreditationMilestone.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        title: item.title,
        phase: item.phase || "persiapan",
        owner: item.owner || null,
        startDate: toDate(item.start_date),
        dueDate: toDate(item.due_date),
        status: item.status || "planned",
        progress: Number(item.progress || 0),
        notes: item.notes || null,
      },
    });
  }

  for (const item of source.risks) {
    await prisma.accreditationRisk.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        title: item.title,
        category: item.category || "umum",
        owner: item.owner || null,
        probability: Number(item.probability || 1),
        impact: Number(item.impact || 1),
        level: item.level || "low",
        status: item.status || "open",
        mitigation: item.mitigation || null,
        dueDate: toDate(item.due_date),
        notes: item.notes || null,
      },
    });
  }

  const criterionByCode = new Map(
    (await prisma.accreditationCriterion.findMany()).map((item) => [item.code, item])
  );

  for (const item of source.lkpsSections) {
    await prisma.accreditationLkpsSection.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        criterionId: criterionByCode.get(item.criteria_code)?.id || null,
        code: item.code,
        title: item.title,
        sourceModule: item.source_module || null,
        requiredFields: item.required_fields || [],
      },
    });
  }

  for (const item of source.ledSections) {
    await prisma.accreditationLedSection.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        criterionId: criterionByCode.get(item.criteria_code)?.id || null,
        title: item.title,
        guidance: item.guidance || null,
        metadata: { criteria_code: item.criteria_code || null },
      },
    });
  }

  for (const item of source.lkpsEntries) {
    await prisma.accreditationLkpsEntry.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        sectionId: item.section_id,
        label: item.label,
        value: Number(item.value || 0),
        unit: item.unit || null,
        status: item.status || "draft",
        sourceModule: item.source_module || null,
        notes: item.notes || null,
      },
    });
  }

  for (const item of source.ledContents) {
    await prisma.accreditationLedContent.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        sectionId: item.section_id,
        version: Number(item.version || 1),
        content: item.content || "",
        status: item.status || "draft",
        reviewerNote: item.reviewer_note || null,
        updatedBy: item.updated_by || null,
      },
    });
  }

  for (const item of source.selfScores) {
    const criterion = criterionByCode.get(item.criteria_code);
    if (!criterion) continue;
    await prisma.accreditationSelfScore.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        criterionId: criterion.id,
        score: Number(item.score || 0),
        targetScore: Number(item.target_score || 4),
        status: item.status || "draft",
        gapNote: item.gap_note || null,
        recommendation: item.recommendation || null,
        reviewer: item.reviewer || null,
      },
    });
  }

  for (const item of source.evidence) {
    await prisma.accreditationEvidence.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        criterionId: criterionByCode.get(item.criteria_code)?.id || null,
        lkpsEntryId: item.linked_lkps_entry_id || null,
        ledContentId: item.linked_led_content_id || null,
        title: item.title,
        sourceModule: item.source_module || null,
        fileName: item.file_name || null,
        fileUrl: item.file_url || null,
        notes: item.notes || null,
        status: item.status || "draft",
      },
    });
  }

  for (const item of source.actionPlans) {
    await prisma.accreditationActionPlan.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        criteriaCode: item.criteria_code || null,
        title: item.title,
        source: item.source || "self_score",
        owner: item.owner || null,
        priority: item.priority || "medium",
        status: item.status || "todo",
        targetDate: toDate(item.target_date),
        progress: Number(item.progress || 0),
        action: item.action || null,
        expectedOutput: item.expected_output || null,
        notes: item.notes || null,
      },
    });
  }

  for (const item of source.reviews) {
    await prisma.accreditationReview.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        entityType: item.entity_type || null,
        entityId: item.entity_id || null,
        reviewer: item.reviewer || "reviewer",
        status: item.status || "draft",
        decision: item.decision || null,
        note: item.note || null,
        dueDate: toDate(item.due_date),
      },
    });
  }

  for (const item of source.submissionChecks) {
    await prisma.accreditationSubmissionCheck.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        category: item.category || "UMUM",
        title: item.title,
        owner: item.owner || null,
        verifier: item.verifier || null,
        status: item.status || "pending",
        dueDate: toDate(item.due_date),
        evidenceId: item.evidence_id || null,
        notes: item.notes || null,
      },
    });
  }

  for (const item of source.exports) {
    await prisma.accreditationExport.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        periodId: item.period_id,
        type: item.type || "package_manifest",
        fileName: item.file_name,
        status: item.status || "generated",
        metadata: {
          generated_by: item.generated_by || null,
          generated_at: item.generated_at || null,
          package_summary: item.package_summary || {},
          readiness_items: item.readiness_items || [],
        },
      },
    });
  }

  return institution;
}

function toApiPeriod(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.scopeType,
    agency: row.agency,
    instrument_id: row.instrumentId,
    org_unit_code: row.orgUnit?.code || row.metadata?.org_unit_code || null,
    start_date: toIsoDate(row.startDate),
    due_date: toIsoDate(row.dueDate),
    status: row.status,
    progress: row.progress,
    instrument: row.instrument ? toApiInstrument(row.instrument) : null,
    org_unit: row.orgUnit ? { code: row.orgUnit.code, name: row.orgUnit.name, type: row.orgUnit.type } : null,
    team_count: row.teamMembers?.length ?? undefined,
  };
}

function toApiInstrument(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    agency: row.agency,
    level: row.level,
    criteria_count: row.criteriaCount,
    status: row.status,
  };
}

function toApiCriterion(row) {
  return {
    id: row.id,
    instrument_id: row.instrumentId,
    code: row.code,
    title: row.title,
    weight: row.weight,
    evidence_required: row.evidenceRequired,
    standard_codes: row.standardCodes || [],
  };
}

function toApiTask(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    title: row.title,
    category: row.category,
    assignee: row.assignee || "",
    priority: row.priority,
    status: row.status,
    due_date: toIsoDate(row.dueDate),
    progress: row.progress,
    notes: row.notes || "",
    period: row.period ? toApiPeriod(row.period) : null,
  };
}

function toApiMilestone(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    title: row.title,
    phase: row.phase,
    owner: row.owner || "",
    start_date: toIsoDate(row.startDate),
    due_date: toIsoDate(row.dueDate),
    status: row.status,
    progress: row.progress,
    notes: row.notes || "",
    period: row.period ? toApiPeriod(row.period) : null,
  };
}

function riskScore(row) {
  return Number(row.probability || 1) * Number(row.impact || 1);
}

function toApiRisk(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    title: row.title,
    category: row.category,
    owner: row.owner || "",
    probability: row.probability,
    impact: row.impact,
    score: riskScore(row),
    level: row.level,
    status: row.status,
    mitigation: row.mitigation || "",
    due_date: toIsoDate(row.dueDate),
    notes: row.notes || "",
    period: row.period ? toApiPeriod(row.period) : null,
  };
}

function toApiTeam(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    name: row.name,
    role: row.role,
    responsibility: row.responsibility || "",
    email: row.email || null,
  };
}

function toApiLkpsSection(row) {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    criteria_code: row.criterion?.code || null,
    source_module: row.sourceModule || null,
    required_fields: row.requiredFields || [],
  };
}

function toApiLkpsEntry(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    section_id: row.sectionId,
    label: row.label,
    value: row.value,
    unit: row.unit || "",
    status: row.status,
    source_module: row.sourceModule || "",
    notes: row.notes || "",
    section: row.section ? toApiLkpsSection(row.section) : null,
    period: row.period ? toApiPeriod(row.period) : null,
  };
}

function toApiLedSection(row) {
  return {
    id: row.id,
    criteria_code: row.criterion?.code || row.metadata?.criteria_code || null,
    title: row.title,
    guidance: row.guidance || "",
  };
}

function toApiLedContent(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    section_id: row.sectionId,
    version: row.version,
    content: row.content,
    status: row.status,
    reviewer_note: row.reviewerNote || "",
    updated_by: row.updatedBy || "",
    section: row.section ? toApiLedSection(row.section) : null,
    period: row.period ? toApiPeriod(row.period) : null,
  };
}

function toApiEvidence(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    criteria_code: row.criterion?.code || null,
    title: row.title,
    source_module: row.sourceModule || "",
    status: row.status,
    file_name: row.fileName || null,
    file_url: row.fileUrl || null,
    linked_lkps_entry_id: row.lkpsEntryId || null,
    linked_led_content_id: row.ledContentId || null,
    notes: row.notes || "",
    period: row.period ? toApiPeriod(row.period) : null,
    lkps_entry: row.lkpsEntry || null,
    led_content: row.ledContent || null,
  };
}

function toApiSelfScore(row) {
  const gap = Math.max(0, Number(row.targetScore || 0) - Number(row.score || 0));
  return {
    id: row.id,
    period_id: row.periodId,
    criteria_code: row.criterion?.code || null,
    score: row.score,
    target_score: row.targetScore,
    status: row.status,
    gap_note: row.gapNote || "",
    recommendation: row.recommendation || "",
    reviewer: row.reviewer || "",
    gap,
    weighted_score: row.criterion ? Number(row.score || 0) * Number(row.criterion.weight || 0) : 0,
    readiness_status: gap <= 0.2 ? "ready" : gap <= 0.7 ? "warning" : "risk",
    criterion: row.criterion ? toApiCriterion(row.criterion) : null,
  };
}

function toApiActionPlan(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    criteria_code: row.criteriaCode || null,
    title: row.title,
    source: row.source,
    owner: row.owner || "",
    priority: row.priority,
    status: row.status,
    target_date: toIsoDate(row.targetDate),
    progress: row.progress,
    action: row.action || "",
    expected_output: row.expectedOutput || "",
    notes: row.notes || "",
    period: row.period ? toApiPeriod(row.period) : null,
  };
}

function toApiReview(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    entity_type: row.entityType || "",
    entity_id: row.entityId || null,
    reviewer: row.reviewer,
    status: row.status,
    decision: row.decision || "",
    note: row.note || "",
    due_date: toIsoDate(row.dueDate),
    period: row.period ? toApiPeriod(row.period) : null,
    entity: null,
  };
}

function toApiSubmissionCheck(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    category: row.category,
    title: row.title,
    owner: row.owner || "",
    verifier: row.verifier || "",
    status: row.status,
    due_date: toIsoDate(row.dueDate),
    evidence_id: row.evidenceId || null,
    notes: row.notes || "",
    readiness_status: ["verified", "approved", "done"].includes(row.status) ? "ready" : "warning",
    period: row.period ? toApiPeriod(row.period) : null,
  };
}

function toApiExport(row) {
  return {
    id: row.id,
    period_id: row.periodId,
    type: row.type,
    file_name: row.fileName,
    status: row.status,
    generated_by: row.metadata?.generated_by || null,
    generated_at: row.metadata?.generated_at || row.createdAt,
    package_summary: row.metadata?.package_summary || {},
    readiness_items: row.metadata?.readiness_items || [],
    manifest: row.metadata?.manifest || null,
    period: row.period ? toApiPeriod(row.period) : null,
  };
}

function fallback(name, ...args) {
  return catalogStore[name](...args);
}

async function getAccreditationPeriods() {
  if (useLocalStore()) return fallback("getAccreditationPeriods");
  const institution = await ensureDatabaseSeeded();
  const rows = await prisma.accreditationPeriod.findMany({
    where: { institutionId: institution.id, deletedAt: null },
    include: { instrument: true, orgUnit: true, teamMembers: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toApiPeriod);
}

async function getAccreditationInstruments() {
  if (useLocalStore()) return fallback("getAccreditationInstruments");
  const institution = await ensureDatabaseSeeded();
  const rows = await prisma.accreditationInstrument.findMany({
    where: { institutionId: institution.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toApiInstrument);
}

async function getAccreditationCriteria() {
  if (useLocalStore()) return fallback("getAccreditationCriteria");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationCriterion.findMany({
    where: { deletedAt: null },
    orderBy: [{ instrumentId: "asc" }, { code: "asc" }],
  });
  return rows.map(toApiCriterion);
}

async function getAccreditationAssessments() {
  if (useLocalStore()) return fallback("getAccreditationAssessments");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationAssessment.findMany({
    where: { deletedAt: null },
    include: { period: { include: { instrument: true, orgUnit: true } }, orgUnit: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    period_id: row.periodId,
    org_unit_code: row.orgUnit?.code || row.metadata?.org_unit_code || null,
    lkps_progress: row.lkpsProgress,
    led_progress: row.ledProgress,
    evidence_progress: row.evidenceProgress,
    review_progress: row.reviewProgress,
    readiness_status: row.readinessStatus,
    score_projection: row.scoreProjection,
    predicate_projection: row.predicateProjection || "",
    risk_level: row.riskLevel,
    progress: Math.round((row.lkpsProgress + row.ledProgress + row.evidenceProgress + row.reviewProgress) / 4),
    period: row.period ? toApiPeriod(row.period) : null,
    org_unit: row.orgUnit ? { code: row.orgUnit.code, name: row.orgUnit.name, type: row.orgUnit.type } : null,
    evidence_count: 0,
    team_count: 0,
  }));
}

async function getAccreditationTeamMembers() {
  if (useLocalStore()) return fallback("getAccreditationTeamMembers");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationTeamMember.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });
  return rows.map(toApiTeam);
}

async function getAccreditationTasks() {
  if (useLocalStore()) return fallback("getAccreditationTasks");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationTask.findMany({ where: { deletedAt: null }, include: { period: { include: { instrument: true, orgUnit: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map(toApiTask);
}

async function getAccreditationMilestones() {
  if (useLocalStore()) return fallback("getAccreditationMilestones");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationMilestone.findMany({ where: { deletedAt: null }, include: { period: { include: { instrument: true, orgUnit: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map(toApiMilestone);
}

async function getAccreditationRisks() {
  if (useLocalStore()) return fallback("getAccreditationRisks");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationRisk.findMany({ where: { deletedAt: null }, include: { period: { include: { instrument: true, orgUnit: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map(toApiRisk);
}

async function getAccreditationEvidence() {
  if (useLocalStore()) return fallback("getAccreditationEvidence");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationEvidence.findMany({
    where: { deletedAt: null },
    include: { criterion: true, period: { include: { instrument: true, orgUnit: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toApiEvidence);
}

async function getAccreditationLkps() {
  if (useLocalStore()) return fallback("getAccreditationLkps");
  await ensureDatabaseSeeded();
  const [sections, entries] = await Promise.all([
    prisma.accreditationLkpsSection.findMany({ where: { deletedAt: null }, include: { criterion: true }, orderBy: { code: "asc" } }),
    prisma.accreditationLkpsEntry.findMany({ where: { deletedAt: null }, include: { section: { include: { criterion: true } }, period: { include: { instrument: true, orgUnit: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return { sections: sections.map(toApiLkpsSection), entries: entries.map(toApiLkpsEntry) };
}

async function getAccreditationLed() {
  if (useLocalStore()) return fallback("getAccreditationLed");
  await ensureDatabaseSeeded();
  const [sections, contents] = await Promise.all([
    prisma.accreditationLedSection.findMany({ where: { deletedAt: null }, include: { criterion: true }, orderBy: { title: "asc" } }),
    prisma.accreditationLedContent.findMany({ where: { deletedAt: null }, include: { section: { include: { criterion: true } }, period: { include: { instrument: true, orgUnit: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return { sections: sections.map(toApiLedSection), contents: contents.map(toApiLedContent) };
}

async function getAccreditationSelfScores() {
  if (useLocalStore()) return fallback("getAccreditationSelfScores");
  await ensureDatabaseSeeded();
  const scores = await prisma.accreditationSelfScore.findMany({
    where: { deletedAt: null },
    include: { criterion: true, period: true },
    orderBy: { createdAt: "desc" },
  });
  const periods = await getAccreditationPeriods();
  return {
    scores: scores.map(toApiSelfScore),
    scoring: periods.map((period) => calculateScoring(period.id, scores.map(toApiSelfScore), [period])),
  };
}

async function getAccreditationActionPlans() {
  if (useLocalStore()) return fallback("getAccreditationActionPlans");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationActionPlan.findMany({ where: { deletedAt: null }, include: { period: { include: { instrument: true, orgUnit: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map(toApiActionPlan);
}

async function getAccreditationReviews() {
  if (useLocalStore()) return fallback("getAccreditationReviews");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationReview.findMany({ where: { deletedAt: null }, include: { period: { include: { instrument: true, orgUnit: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map(toApiReview);
}

async function getAccreditationSubmissionChecks() {
  if (useLocalStore()) return fallback("getAccreditationSubmissionChecks");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationSubmissionCheck.findMany({ where: { deletedAt: null }, include: { period: { include: { instrument: true, orgUnit: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map(toApiSubmissionCheck);
}

async function getAccreditationExports() {
  if (useLocalStore()) return fallback("getAccreditationExports");
  await ensureDatabaseSeeded();
  const rows = await prisma.accreditationExport.findMany({ where: { deletedAt: null }, include: { period: { include: { instrument: true, orgUnit: true } } }, orderBy: { createdAt: "desc" } });
  return rows.map(toApiExport);
}

function calculateScoring(periodId, selfScores, periods) {
  const rows = selfScores.filter((item) => item.period_id === periodId);
  const weighted = rows.reduce((sum, item) => sum + Number(item.weighted_score || 0), 0);
  const average = rows.length ? rows.reduce((sum, item) => sum + Number(item.score || 0), 0) / rows.length : 0;
  const projection = Math.round((weighted || average * 25) * 10) / 10;
  return {
    period_id: periodId,
    period_name: periods.find((item) => item.id === periodId)?.name || "",
    score_projection: projection,
    predicate_projection: projection >= 361 ? "UNGGUL" : projection >= 301 ? "BAIK SEKALI" : projection >= 200 ? "BAIK" : "PERLU PEMBINAAN",
    criteria_scored: rows.length,
    average_score: Math.round(average * 100) / 100,
    weighted_achievement: projection,
  };
}

function packageReadiness(periodId, data) {
  const openReviews = data.reviews.filter((item) => item.period_id === periodId && !["approved", "closed"].includes(item.status));
  const openActions = data.actionPlans.filter((item) => item.period_id === periodId && !["done", "closed", "completed"].includes(item.status));
  const openChecks = data.submissionChecks.filter((item) => item.period_id === periodId && !["verified", "approved", "done"].includes(item.status));
  return [
    { key: "period", label: "Periode akreditasi tersedia", status: data.periods.some((item) => item.id === periodId) ? "ready" : "risk" },
    { key: "lkps", label: "Data LKPS tersedia", status: data.lkpsEntries.some((item) => item.period_id === periodId) ? "ready" : "risk" },
    { key: "led", label: "Draft LED tersedia", status: data.ledContents.some((item) => item.period_id === periodId) ? "ready" : "risk" },
    { key: "evidence", label: "Bukti fisik tersedia", status: data.evidence.some((item) => item.period_id === periodId) ? "ready" : "risk" },
    { key: "reviews", label: "Review internal selesai", status: openReviews.length ? "warning" : "ready" },
    { key: "self_scores", label: "Penilaian mandiri tersedia", status: data.selfScores.some((item) => item.period_id === periodId) ? "ready" : "risk" },
    { key: "action_plans", label: "Rencana perbaikan terkendali", status: openActions.length ? "warning" : "ready" },
    { key: "submission_checks", label: "Checklist submit terverifikasi", status: openChecks.length ? "warning" : "ready" },
  ];
}

async function getAccreditationSummary() {
  if (useLocalStore()) return fallback("getAccreditationSummary");
  const [periods, instruments, criteria, assessments, teamMembers, tasks, milestones, risks, evidence, lkps, led, selfScoresPayload, actionPlans, reviews, submissionChecks, exports] = await Promise.all([
    getAccreditationPeriods(),
    getAccreditationInstruments(),
    getAccreditationCriteria(),
    getAccreditationAssessments(),
    getAccreditationTeamMembers(),
    getAccreditationTasks(),
    getAccreditationMilestones(),
    getAccreditationRisks(),
    getAccreditationEvidence(),
    getAccreditationLkps(),
    getAccreditationLed(),
    getAccreditationSelfScores(),
    getAccreditationActionPlans(),
    getAccreditationReviews(),
    getAccreditationSubmissionChecks(),
    getAccreditationExports(),
  ]);
  const assessmentProgress = assessments.length ? Math.round(assessments.reduce((sum, item) => sum + Number(item.progress || 0), 0) / assessments.length) : 0;
  const selfScores = selfScoresPayload.scores;

  return {
    generated_at: new Date().toISOString(),
    metrics: [
      { label: "Periode aktif", value: periods.filter((item) => ["draft", "berjalan", "review"].includes(item.status)).length },
      { label: "Instrumen", value: instruments.length },
      { label: "Kriteria", value: criteria.length },
      { label: "Eviden awal", value: evidence.length },
      { label: "LKPS entries", value: lkps.entries.length },
      { label: "LED drafts", value: led.contents.length },
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
      average_progress: assessmentProgress,
      status: assessmentProgress >= 80 ? "ready" : assessmentProgress >= 45 ? "warning" : "risk",
      ready: assessments.filter((item) => item.readiness_status === "ready").length,
      warning: assessments.filter((item) => item.readiness_status === "warning").length,
      risk: assessments.filter((item) => item.readiness_status === "risk").length,
    },
    periods,
    instruments,
    criteria,
    assessments,
    teamMembers,
    tasks,
    milestones,
    risks,
    evidence,
    lkpsSections: lkps.sections,
    lkpsEntries: lkps.entries,
    ledSections: led.sections,
    ledContents: led.contents,
    selfScores,
    actionPlans,
    scoring: periods.map((period) => calculateScoring(period.id, selfScores, periods)),
    reviews,
    submissionChecks,
    exports,
    integrations: [
      { source: "SIAKAD", data: ["mahasiswa", "lulusan", "kurikulum", "mata kuliah"], status: "ready_for_mapping" },
      { source: "HRIS", data: ["dosen", "tendik", "jabatan", "sertifikasi", "pendidikan"], status: "ready" },
      { source: "SPMI", data: ["standar", "PPEPP", "dokumen mutu"], status: "ready" },
      { source: "AMI/RTM", data: ["temuan", "RTL", "keputusan manajemen"], status: "ready" },
    ],
  };
}

async function addAccreditationPeriod(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationPeriod", data, user);
  const institution = await ensureDatabaseSeeded();
  const orgUnit = await getOrgUnitByCode(institution.id, data.org_unit_code || data.orgUnitCode);
  const row = await prisma.accreditationPeriod.create({
    data: {
      institutionId: institution.id,
      instrumentId: data.instrument_id || data.instrumentId,
      orgUnitId: orgUnit?.id || null,
      createdById: user?.id || null,
      name: data.name || "Periode Akreditasi Baru",
      scopeType: data.type === "APT" ? "APT" : "APS",
      agency: data.agency || "BAN-PT",
      startDate: toDate(data.start_date || data.startDate) || new Date(),
      dueDate: toDate(data.due_date || data.dueDate),
      status: normalizeStatus(data.status, "draft"),
      progress: Number(data.progress || 0),
      metadata: { org_unit_code: data.org_unit_code || data.orgUnitCode || null },
    },
    include: { instrument: true, orgUnit: true, teamMembers: true },
  });
  return toApiPeriod(row);
}

async function addAccreditationInstrument(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationInstrument", data, user);
  const institution = await ensureDatabaseSeeded();
  const row = await prisma.accreditationInstrument.create({
    data: {
      institutionId: institution.id,
      code: data.code,
      name: data.name || "Instrumen Akreditasi Baru",
      agency: data.agency || "BAN-PT",
      level: data.level || "Program Studi",
      criteriaCount: Number(data.criteria_count || data.criteriaCount || 0),
      status: data.status || "aktif",
    },
  });
  return toApiInstrument(row);
}

async function addAccreditationCriterion(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationCriterion", data, user);
  await ensureDatabaseSeeded();
  const row = await prisma.accreditationCriterion.create({
    data: {
      instrumentId: data.instrument_id || data.instrumentId,
      code: data.code,
      title: data.title || "Kriteria Baru",
      weight: Number(data.weight || 0),
      evidenceRequired: Number(data.evidence_required || data.evidenceRequired || 0),
      standardCodes: data.standard_codes || data.standardCodes || [],
    },
  });
  return toApiCriterion(row);
}

async function addAccreditationAssessment(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationAssessment", data, user);
  await ensureDatabaseSeeded();
  const period = await prisma.accreditationPeriod.findUnique({ where: { id: data.period_id || data.periodId }, include: { orgUnit: true } });
  const row = await prisma.accreditationAssessment.create({
    data: {
      periodId: period?.id || data.period_id || data.periodId,
      orgUnitId: period?.orgUnitId || null,
      lkpsProgress: Number(data.lkps_progress || data.lkpsProgress || 0),
      ledProgress: Number(data.led_progress || data.ledProgress || 0),
      evidenceProgress: Number(data.evidence_progress || data.evidenceProgress || 0),
      reviewProgress: Number(data.review_progress || data.reviewProgress || 0),
      readinessStatus: data.readiness_status || data.readinessStatus || "risk",
      scoreProjection: Number(data.score_projection || data.scoreProjection || 0),
      predicateProjection: data.predicate_projection || data.predicateProjection || "PERLU PEMBINAAN",
      riskLevel: data.risk_level || data.riskLevel || "merah",
    },
  });
  return (await getAccreditationAssessments()).find((item) => item.id === row.id);
}

async function addAccreditationTeamMember(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationTeamMember", data, user);
  await ensureDatabaseSeeded();
  const row = await prisma.accreditationTeamMember.create({
    data: {
      periodId: data.period_id || data.periodId,
      name: data.name || "Anggota Tim",
      role: data.role || "TIM_PENYUSUN",
      responsibility: data.responsibility || data.tanggung_jawab || null,
      email: data.email || null,
    },
  });
  return toApiTeam(row);
}

async function addAccreditationTask(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationTask", data, user);
  await ensureDatabaseSeeded();
  const row = await prisma.accreditationTask.create({
    data: {
      periodId: data.period_id || data.periodId,
      title: data.title || "Task akreditasi",
      category: data.category || "UMUM",
      assignee: data.assignee || userEmail(user),
      priority: data.priority || "medium",
      status: data.status || "todo",
      dueDate: toDate(data.due_date || data.dueDate),
      progress: Number(data.progress || 0),
      notes: data.notes || data.note || null,
    },
  });
  return toApiTask(row);
}

async function addAccreditationMilestone(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationMilestone", data, user);
  await ensureDatabaseSeeded();
  const row = await prisma.accreditationMilestone.create({
    data: {
      periodId: data.period_id || data.periodId,
      title: data.title || "Milestone akreditasi",
      phase: data.phase || "persiapan",
      owner: data.owner || userEmail(user),
      startDate: toDate(data.start_date || data.startDate),
      dueDate: toDate(data.due_date || data.dueDate),
      status: data.status || "planned",
      progress: Number(data.progress || 0),
      notes: data.notes || data.note || null,
    },
  });
  return toApiMilestone(row);
}

async function addAccreditationRisk(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationRisk", data, user);
  await ensureDatabaseSeeded();
  const probability = Math.max(1, Math.min(5, Number(data.probability || 1)));
  const impact = Math.max(1, Math.min(5, Number(data.impact || 1)));
  const score = probability * impact;
  const row = await prisma.accreditationRisk.create({
    data: {
      periodId: data.period_id || data.periodId,
      title: data.title || "Risiko akreditasi",
      category: data.category || "umum",
      owner: data.owner || userEmail(user),
      probability,
      impact,
      level: data.level || (score >= 16 ? "high" : score >= 8 ? "medium" : "low"),
      status: data.status || "open",
      mitigation: data.mitigation || null,
      dueDate: toDate(data.due_date || data.dueDate),
      notes: data.notes || data.note || null,
    },
  });
  return toApiRisk(row);
}

async function updateAccreditationRisk(id, data, user = null) {
  if (useLocalStore()) return fallback("updateAccreditationRisk", id, data, user);
  const existing = await prisma.accreditationRisk.findUnique({ where: { id } });
  if (!existing) return null;
  const probability = Math.max(1, Math.min(5, Number(data.probability ?? existing.probability ?? 1)));
  const impact = Math.max(1, Math.min(5, Number(data.impact ?? existing.impact ?? 1)));
  const score = probability * impact;
  const row = await prisma.accreditationRisk.update({
    where: { id },
    data: {
      title: data.title || existing.title,
      category: data.category || existing.category,
      owner: data.owner || existing.owner,
      probability,
      impact,
      level: data.level || (score >= 16 ? "high" : score >= 8 ? "medium" : "low"),
      status: data.status || existing.status,
      mitigation: data.mitigation || existing.mitigation,
      dueDate: data.due_date || data.dueDate ? toDate(data.due_date || data.dueDate) : existing.dueDate,
      notes: data.notes || data.note || existing.notes,
    },
  });
  return toApiRisk(row);
}

async function addAccreditationEvidence(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationEvidence", data, user);
  await ensureDatabaseSeeded();
  const criterion = await getCriterionByCode(data.criteria_code || data.criteriaCode);
  const row = await prisma.accreditationEvidence.create({
    data: {
      periodId: data.period_id || data.periodId,
      criterionId: criterion?.id || null,
      lkpsEntryId: data.linked_lkps_entry_id || data.linkedLkpsEntryId || null,
      ledContentId: data.linked_led_content_id || data.linkedLedContentId || null,
      title: data.title || "Bukti Akreditasi Baru",
      sourceModule: data.source_module || data.sourceModule || "Manual",
      status: data.status || "draft",
      fileName: data.file_name || data.fileName || null,
      fileUrl: data.file_url || data.fileUrl || null,
      notes: data.notes || null,
    },
    include: { criterion: true, period: { include: { instrument: true, orgUnit: true } } },
  });
  return toApiEvidence(row);
}

async function addAccreditationLkpsEntry(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationLkpsEntry", data, user);
  await ensureDatabaseSeeded();
  const row = await prisma.accreditationLkpsEntry.create({
    data: {
      periodId: data.period_id || data.periodId,
      sectionId: data.section_id || data.sectionId,
      label: data.label || "Entry LKPS",
      value: Number(data.value || 0),
      unit: data.unit || null,
      status: data.status || "draft",
      sourceModule: data.source_module || data.sourceModule || "Manual",
      notes: data.notes || null,
    },
    include: { section: { include: { criterion: true } }, period: { include: { instrument: true, orgUnit: true } } },
  });
  return toApiLkpsEntry(row);
}

async function addAccreditationLedContent(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationLedContent", data, user);
  await ensureDatabaseSeeded();
  const periodId = data.period_id || data.periodId;
  const sectionId = data.section_id || data.sectionId;
  const previous = await prisma.accreditationLedContent.findMany({ where: { periodId, sectionId } });
  const row = await prisma.accreditationLedContent.create({
    data: {
      periodId,
      sectionId,
      version: previous.length ? Math.max(...previous.map((item) => item.version || 1)) + 1 : 1,
      content: data.content || "",
      status: data.status || "draft",
      reviewerNote: data.reviewer_note || data.reviewerNote || null,
      updatedBy: userEmail(user),
    },
    include: { section: { include: { criterion: true } }, period: { include: { instrument: true, orgUnit: true } } },
  });
  return toApiLedContent(row);
}

async function addAccreditationSelfScore(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationSelfScore", data, user);
  await ensureDatabaseSeeded();
  const criterion = await getCriterionByCode(data.criteria_code || data.criteriaCode);
  const score = Math.max(0, Math.min(4, Number(data.score || 0)));
  const targetScore = Math.max(0, Math.min(4, Number(data.target_score || data.targetScore || 4)));
  const row = await prisma.accreditationSelfScore.create({
    data: {
      periodId: data.period_id || data.periodId,
      criterionId: criterion.id,
      score,
      targetScore,
      status: data.status || (targetScore - score <= 0.2 ? "ready" : targetScore - score <= 0.7 ? "warning" : "risk"),
      gapNote: data.gap_note || data.gapNote || null,
      recommendation: data.recommendation || null,
      reviewer: data.reviewer || userEmail(user),
    },
    include: { criterion: true },
  });
  return toApiSelfScore(row);
}

function normalizeActionPlan(data, user) {
  return {
    periodId: data.period_id || data.periodId,
    criteriaCode: data.criteria_code || data.criteriaCode || null,
    title: data.title || "Rencana perbaikan akreditasi",
    source: data.source || "self_score",
    owner: data.owner || userEmail(user),
    priority: data.priority || "medium",
    status: data.status || "todo",
    targetDate: toDate(data.target_date || data.targetDate),
    progress: Math.max(0, Math.min(100, Number(data.progress || 0))),
    action: data.action || null,
    expectedOutput: data.expected_output || data.expectedOutput || null,
    notes: data.notes || data.note || null,
  };
}

async function addAccreditationActionPlan(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationActionPlan", data, user);
  await ensureDatabaseSeeded();
  const row = await prisma.accreditationActionPlan.create({ data: normalizeActionPlan(data, user) });
  return toApiActionPlan(row);
}

async function addAccreditationActionPlansBulk(rows, user = null) {
  if (useLocalStore()) return fallback("addAccreditationActionPlansBulk", rows, user);
  const created = [];
  const skipped = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const payload = normalizeActionPlan(row, user);
    const duplicate = await prisma.accreditationActionPlan.findFirst({
      where: { periodId: payload.periodId, criteriaCode: payload.criteriaCode, title: payload.title, status: { notIn: ["done", "closed", "completed"] }, deletedAt: null },
    });
    if (duplicate) {
      skipped.push({ title: payload.title, duplicate_id: duplicate.id, reason: "duplicate_open_action_plan" });
      continue;
    }
    created.push(toApiActionPlan(await prisma.accreditationActionPlan.create({ data: payload })));
  }
  return { created, skipped, created_count: created.length, skipped_count: skipped.length };
}

async function updateAccreditationActionPlan(id, data, user = null) {
  if (useLocalStore()) return fallback("updateAccreditationActionPlan", id, data, user);
  const existing = await prisma.accreditationActionPlan.findUnique({ where: { id } });
  if (!existing) return null;
  const progress = Math.max(0, Math.min(100, Number(data.progress ?? existing.progress ?? 0)));
  const row = await prisma.accreditationActionPlan.update({
    where: { id },
    data: {
      title: data.title || existing.title,
      owner: data.owner || existing.owner,
      priority: data.priority || existing.priority,
      status: progress >= 100 ? "done" : data.status || existing.status,
      targetDate: data.target_date || data.targetDate ? toDate(data.target_date || data.targetDate) : existing.targetDate,
      progress,
      action: data.action || existing.action,
      expectedOutput: data.expected_output || data.expectedOutput || existing.expectedOutput,
      notes: data.notes || data.note || existing.notes,
    },
  });
  return toApiActionPlan(row);
}

async function addAccreditationReview(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationReview", data, user);
  await ensureDatabaseSeeded();
  const row = await prisma.accreditationReview.create({
    data: {
      periodId: data.period_id || data.periodId,
      entityType: data.entity_type || data.entityType || "led",
      entityId: data.entity_id || data.entityId || null,
      reviewer: data.reviewer || userEmail(user),
      status: data.status || "in_review",
      decision: data.decision || "review",
      note: data.note || null,
      dueDate: toDate(data.due_date || data.dueDate),
    },
  });
  return toApiReview(row);
}

function normalizeSubmissionCheck(data, user) {
  return {
    periodId: data.period_id || data.periodId,
    category: data.category || "UMUM",
    title: data.title || "Checklist submit akreditasi",
    owner: data.owner || userEmail(user),
    verifier: data.verifier || "lpm@spmi.local",
    status: data.status || "pending",
    dueDate: toDate(data.due_date || data.dueDate),
    evidenceId: data.evidence_id || data.evidenceId || null,
    notes: data.notes || data.note || null,
  };
}

async function addAccreditationSubmissionCheck(data, user = null) {
  if (useLocalStore()) return fallback("addAccreditationSubmissionCheck", data, user);
  await ensureDatabaseSeeded();
  const row = await prisma.accreditationSubmissionCheck.create({ data: normalizeSubmissionCheck(data, user) });
  return toApiSubmissionCheck(row);
}

async function addAccreditationSubmissionChecksBulk(rows, user = null) {
  if (useLocalStore()) return fallback("addAccreditationSubmissionChecksBulk", rows, user);
  const created = [];
  const skipped = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const payload = normalizeSubmissionCheck(row, user);
    const duplicate = await prisma.accreditationSubmissionCheck.findFirst({
      where: { periodId: payload.periodId, category: payload.category, title: payload.title, status: { notIn: ["verified", "approved", "done", "closed"] }, deletedAt: null },
    });
    if (duplicate) {
      skipped.push({ title: payload.title, duplicate_id: duplicate.id, reason: "duplicate_open_submission_check" });
      continue;
    }
    created.push(toApiSubmissionCheck(await prisma.accreditationSubmissionCheck.create({ data: payload })));
  }
  return { created, skipped, created_count: created.length, skipped_count: skipped.length };
}

async function updateAccreditationSubmissionCheck(id, data, user = null) {
  if (useLocalStore()) return fallback("updateAccreditationSubmissionCheck", id, data, user);
  const existing = await prisma.accreditationSubmissionCheck.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.accreditationSubmissionCheck.update({
    where: { id },
    data: {
      category: data.category || existing.category,
      title: data.title || existing.title,
      owner: data.owner || existing.owner,
      verifier: data.verifier || existing.verifier,
      status: data.status || existing.status,
      dueDate: data.due_date || data.dueDate ? toDate(data.due_date || data.dueDate) : existing.dueDate,
      evidenceId: data.evidence_id || data.evidenceId || existing.evidenceId,
      notes: data.notes || data.note || existing.notes,
    },
  });
  return toApiSubmissionCheck(row);
}

async function updateAccreditationPeriodStatus(id, data, user = null) {
  if (useLocalStore()) return fallback("updateAccreditationPeriodStatus", id, data, user);
  const existing = await prisma.accreditationPeriod.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.accreditationPeriod.update({
    where: { id },
    data: {
      status: data.status || existing.status,
      progress: Number(data.progress ?? existing.progress ?? 0),
      metadata: { ...(existing.metadata || {}), final_note: data.final_note || data.finalNote || existing.metadata?.final_note || "" },
    },
    include: { instrument: true, orgUnit: true, teamMembers: true },
  });
  return toApiPeriod(row);
}

async function generateAccreditationExport(data, user = null) {
  if (useLocalStore()) return fallback("generateAccreditationExport", data, user);
  const summary = await getAccreditationSummary();
  const periodId = data.period_id || data.periodId || summary.periods[0]?.id;
  const period = summary.periods.find((item) => item.id === periodId);
  if (!period) throw Object.assign(new Error("Periode akreditasi tidak ditemukan."), { statusCode: 404 });
  const readinessItems = packageReadiness(periodId, summary);
  const type = data.type || "package_manifest";
  const safeName = String(period.name || "akreditasi").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const fileName = data.file_name || data.fileName || `${safeName || "paket-akreditasi"}-${Date.now()}.json`;
  const openActionPlans = summary.actionPlans.filter((item) => item.period_id === periodId && !["done", "closed", "completed"].includes(item.status));
  const openSubmissionChecks = summary.submissionChecks.filter((item) => item.period_id === periodId && !["verified", "approved", "done", "closed"].includes(item.status));
  const openRisks = summary.risks.filter((item) => item.period_id === periodId && !["closed", "resolved", "done"].includes(item.status));
  const manifest = {
    period,
    lkps_entries: summary.lkpsEntries.filter((item) => item.period_id === periodId),
    led_contents: summary.ledContents.filter((item) => item.period_id === periodId),
    evidence: summary.evidence.filter((item) => item.period_id === periodId),
    reviews: summary.reviews.filter((item) => item.period_id === periodId),
    self_scores: summary.selfScores.filter((item) => item.period_id === periodId),
    action_plans: summary.actionPlans.filter((item) => item.period_id === periodId),
    risks: summary.risks.filter((item) => item.period_id === periodId),
    submission_checks: summary.submissionChecks.filter((item) => item.period_id === periodId),
    follow_up_summary: {
      open_action_plans: openActionPlans.length,
      open_submission_checks: openSubmissionChecks.length,
      open_risks: openRisks.length,
      high_risks: openRisks.filter((item) => item.level === "high" || item.score >= 16).length,
      risk_items: readinessItems.filter((item) => item.status === "risk"),
      warning_items: readinessItems.filter((item) => item.status === "warning"),
    },
  };
  const packageSummary = {
    period: period.name,
    lkps_entries: manifest.lkps_entries.length,
    led_contents: manifest.led_contents.length,
    evidence: manifest.evidence.length,
    reviews: manifest.reviews.length,
    self_scores: manifest.self_scores.length,
    action_plans: manifest.action_plans.length,
    risks: manifest.risks.length,
    submission_checks: manifest.submission_checks.length,
    readiness_items: readinessItems.length,
    open_action_plans: openActionPlans.length,
    open_submission_checks: openSubmissionChecks.length,
    open_risks: openRisks.length,
    high_risks: manifest.follow_up_summary.high_risks,
    risk_items: readinessItems.filter((item) => item.status === "risk").length,
    warning_items: readinessItems.filter((item) => item.status === "warning").length,
  };
  const row = await prisma.accreditationExport.create({
    data: {
      periodId,
      type,
      fileName,
      status: readinessItems.some((item) => item.status === "risk") ? "needs_attention" : "generated",
      metadata: {
        generated_by: userEmail(user),
        generated_at: new Date().toISOString(),
        package_summary: packageSummary,
        readiness_items: readinessItems,
        manifest,
      },
    },
    include: { period: { include: { instrument: true, orgUnit: true } } },
  });
  return toApiExport(row);
}

async function getAccreditationExportById(id) {
  if (useLocalStore()) return fallback("getAccreditationExportById", id);
  await ensureDatabaseSeeded();
  const row = await prisma.accreditationExport.findFirst({
    where: { id, deletedAt: null },
    include: { period: { include: { instrument: true, orgUnit: true } } },
  });
  return row ? toApiExport(row) : null;
}

module.exports = {
  ensureDatabaseSeeded,
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
  updateAccreditationRisk,
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
  updateAccreditationActionPlan,
  getAccreditationReviews,
  addAccreditationReview,
  getAccreditationSubmissionChecks,
  addAccreditationSubmissionCheck,
  addAccreditationSubmissionChecksBulk,
  updateAccreditationSubmissionCheck,
  updateAccreditationPeriodStatus,
  getAccreditationExports,
  getAccreditationExportById,
  generateAccreditationExport,
};
