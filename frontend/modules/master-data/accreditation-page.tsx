"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";

type AccreditationMetric = {
  label: string;
  value: number;
};

type AccreditationInstrument = {
  id: string;
  code: string;
  name: string;
  agency: string;
  level: string;
  criteria_count: number;
  status: string;
};

type AccreditationCriterion = {
  id: string;
  instrument_id: string;
  code: string;
  title: string;
  weight: number;
  evidence_required: number;
  standard_codes?: string[];
};

type AccreditationPeriod = {
  id: string;
  name: string;
  type: string;
  agency: string;
  instrument_id: string;
  org_unit_code: string;
  start_date: string;
  due_date: string | null;
  status: string;
  progress: number;
  org_unit?: { code: string; name: string; type: string } | null;
};

type AccreditationAssessment = {
  id: string;
  period_id: string;
  org_unit_code: string;
  lkps_progress: number;
  led_progress: number;
  evidence_progress: number;
  review_progress: number;
  readiness_status: string;
  score_projection: number;
  predicate_projection: string;
  risk_level: string;
  progress: number;
  period?: AccreditationPeriod | null;
  org_unit?: { code: string; name: string; type: string } | null;
  evidence_count: number;
  team_count: number;
};

type AccreditationTeamMember = {
  id: string;
  period_id: string;
  name: string;
  role: string;
  responsibility: string;
  email: string | null;
};

type AccreditationTask = {
  id: string;
  period_id: string;
  title: string;
  category: string;
  assignee: string;
  priority: string;
  status: string;
  due_date: string | null;
  progress: number;
  notes: string;
  overdue?: boolean;
  readiness_status?: string;
  period?: AccreditationPeriod | null;
};

type AccreditationMilestone = {
  id: string;
  period_id: string;
  title: string;
  phase: string;
  owner: string;
  start_date: string | null;
  due_date: string | null;
  status: string;
  progress: number;
  notes: string;
  overdue?: boolean;
  readiness_status?: string;
  period?: AccreditationPeriod | null;
};

type AccreditationRisk = {
  id: string;
  period_id: string;
  title: string;
  category: string;
  owner: string;
  probability: number;
  impact: number;
  score: number;
  level: string;
  status: string;
  mitigation: string;
  due_date: string | null;
  notes: string;
  overdue?: boolean;
  readiness_status?: string;
  period?: AccreditationPeriod | null;
};

type AccreditationEvidence = {
  id: string;
  period_id: string;
  criteria_code: string;
  title: string;
  source_module: string;
  status: string;
  file_name?: string | null;
  file_url?: string | null;
  linked_lkps_entry_id?: string | null;
  linked_led_content_id?: string | null;
  notes?: string;
  lkps_entry?: AccreditationLkpsEntry | null;
  led_content?: AccreditationLedContent | null;
};

type AccreditationLkpsSection = {
  id: string;
  code: string;
  title: string;
  criteria_code: string;
  source_module: string;
  required_fields: string[];
};

type AccreditationLkpsEntry = {
  id: string;
  period_id: string;
  section_id: string;
  label: string;
  value: number;
  unit: string;
  status: string;
  source_module: string;
  notes: string;
  section?: AccreditationLkpsSection | null;
};

type AccreditationLedSection = {
  id: string;
  criteria_code: string;
  title: string;
  guidance: string;
};

type AccreditationLedContent = {
  id: string;
  period_id: string;
  section_id: string;
  version: number;
  content: string;
  status: string;
  reviewer_note: string;
  updated_by: string;
  section?: AccreditationLedSection | null;
};

type AccreditationSelfScore = {
  id: string;
  period_id: string;
  criteria_code: string;
  score: number;
  target_score: number;
  status: string;
  gap_note: string;
  recommendation: string;
  reviewer: string;
  gap: number;
  weighted_score: number;
  readiness_status: string;
  criterion?: AccreditationCriterion | null;
};

type AccreditationActionPlan = {
  id: string;
  period_id: string;
  criteria_code: string;
  title: string;
  source: string;
  owner: string;
  priority: string;
  status: string;
  target_date: string | null;
  progress: number;
  action: string;
  expected_output: string;
  notes: string;
  overdue?: boolean;
  readiness_status?: string;
  period?: AccreditationPeriod | null;
  criterion?: AccreditationCriterion | null;
};

type AccreditationScoringSummary = {
  period_id: string;
  period_name: string;
  score_projection: number;
  predicate_projection: string;
  criteria_scored: number;
  average_score: number;
  weighted_achievement: number;
};

type AccreditationReview = {
  id: string;
  period_id: string;
  entity_type: string;
  entity_id: string | null;
  reviewer: string;
  status: string;
  decision: string;
  note: string;
  due_date: string | null;
  period?: AccreditationPeriod | null;
  entity?: Record<string, unknown> | null;
};

type AccreditationSubmissionCheck = {
  id: string;
  period_id: string;
  category: string;
  title: string;
  owner: string;
  verifier: string;
  status: string;
  due_date: string | null;
  evidence_id?: string | null;
  notes: string;
  overdue?: boolean;
  readiness_status?: string;
  period?: AccreditationPeriod | null;
  evidence?: AccreditationEvidence | null;
};

type AccreditationReadinessItem = {
  key: string;
  label: string;
  status: string;
  count?: number;
  open?: number;
};

type EvidenceCoverageItem = {
  code: string;
  title: string;
  required: number;
  total: number;
  valid: number;
  open: number;
  status: string;
};

type LedCoverageItem = {
  id: string;
  criteriaCode: string;
  title: string;
  total: number;
  ready: number;
  latestStatus: string;
  status: string;
};

type SelfScoreCoverageItem = {
  code: string;
  title: string;
  score: number | null;
  target: number;
  gap: number | null;
  reviewer: string;
  status: string;
};

type ActionPlanCoverageItem = {
  code: string;
  title: string;
  gap: number;
  total: number;
  open: number;
  done: number;
  status: string;
};

type ReviewCoverageItem = {
  key: string;
  label: string;
  entityType: string;
  total: number;
  approved: number;
  open: number;
  missing: number;
  status: string;
};

type SubmissionCheckDraft = {
  period_id: string;
  category: string;
  title: string;
  owner: string;
  verifier: string;
  status: string;
  due_date: string | null;
  evidence_id: string | null;
  notes: string;
};

type ActionPlanDraft = {
  period_id: string;
  criteria_code: string;
  title: string;
  source: string;
  owner: string;
  priority: string;
  status: string;
  target_date: string | null;
  progress: number;
  action: string;
  expected_output: string;
  notes: string;
};

type AccreditationExport = {
  id: string;
  period_id: string;
  type: string;
  file_name: string;
  status: string;
  generated_by?: string;
  generated_at?: string;
  package_summary?: {
    lkps_entries?: number;
    led_contents?: number;
    evidence?: number;
    reviews?: number;
    self_scores?: number;
    action_plans?: number;
    submission_checks?: number;
    readiness_items?: number;
    open_action_plans?: number;
    open_submission_checks?: number;
    risk_items?: number;
    warning_items?: number;
  };
  readiness_items?: AccreditationReadinessItem[];
  period?: AccreditationPeriod | null;
};

type AccreditationSummary = {
  generated_at: string;
  metrics: AccreditationMetric[];
  readiness: {
    average_progress: number;
    status: string;
    ready: number;
    warning: number;
    risk: number;
  };
  periods: AccreditationPeriod[];
  instruments: AccreditationInstrument[];
  criteria: AccreditationCriterion[];
  assessments: AccreditationAssessment[];
  teamMembers: AccreditationTeamMember[];
  tasks: AccreditationTask[];
  milestones: AccreditationMilestone[];
  risks: AccreditationRisk[];
  evidence: AccreditationEvidence[];
  lkpsSections: AccreditationLkpsSection[];
  lkpsEntries: AccreditationLkpsEntry[];
  ledSections: AccreditationLedSection[];
  ledContents: AccreditationLedContent[];
  selfScores: AccreditationSelfScore[];
  actionPlans: AccreditationActionPlan[];
  scoring: AccreditationScoringSummary[];
  reviews: AccreditationReview[];
  submissionChecks: AccreditationSubmissionCheck[];
  exports: AccreditationExport[];
  integrations: Array<{ source: string; data: string[]; status: string }>;
};

const emptySummary: AccreditationSummary = {
  generated_at: "",
  metrics: [],
  readiness: {
    average_progress: 0,
    status: "risk",
    ready: 0,
    warning: 0,
    risk: 0,
  },
  periods: [],
  instruments: [],
  criteria: [],
  assessments: [],
  teamMembers: [],
  tasks: [],
  milestones: [],
  risks: [],
  evidence: [],
  lkpsSections: [],
  lkpsEntries: [],
  ledSections: [],
  ledContents: [],
  selfScores: [],
  actionPlans: [],
  scoring: [],
  reviews: [],
  submissionChecks: [],
  exports: [],
  integrations: [],
};

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (["ready", "valid", "selesai", "final", "aktif", "approved", "generated", "done", "closed", "resolved", "low", "verified"].includes(normalized)) return "badge-success";
  if (["warning", "kuning", "berjalan", "review", "perlu_revisi", "revision_required", "in_review", "needs_attention", "todo", "in_progress", "blocked", "mitigating", "medium", "pending"].includes(normalized)) return "badge-warning";
  return "badge-danger";
}

function progressWidth(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function readinessCategory(key: string) {
  if (key === "lkps") return "LKPS";
  if (key === "led") return "LED";
  if (key === "evidence") return "BUKTI";
  if (key === "reviews") return "REVIEW";
  return "SUBMIT";
}

export function AccreditationPage() {
  const [summary, setSummary] = useState<AccreditationSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [packagePeriodId, setPackagePeriodId] = useState("");
  const [showOnlyPackageIssues, setShowOnlyPackageIssues] = useState(false);
  const [packageIssueCategory, setPackageIssueCategory] = useState("all");

  const firstInstrumentId = summary.instruments[0]?.id || "";
  const firstPeriodId = summary.periods[0]?.id || "";
  const firstCriteriaCode = summary.criteria[0]?.code || "";
  const firstLkpsSectionId = summary.lkpsSections[0]?.id || "";
  const firstLedSectionId = summary.ledSections[0]?.id || "";
  const firstReviewEntityId = summary.ledContents[0]?.id || "";
  const activePackagePeriodId = packagePeriodId || firstPeriodId;

  async function loadSummary() {
    setLoading(true);
    setError("");

    try {
      const response = await clientApiRequest("/accreditation/summary");
      const payload = await response.json();
      setSummary(parseApiPayload<AccreditationSummary>(payload, emptySummary));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data akreditasi gagal dimuat.");
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  const groupedCriteria = useMemo(() => {
    return summary.criteria.reduce<Record<string, AccreditationCriterion[]>>((acc, criterion) => {
      acc[criterion.instrument_id] = [...(acc[criterion.instrument_id] || []), criterion];
      return acc;
    }, {});
  }, [summary.criteria]);

  const packageReadiness = useMemo(() => {
    const period = summary.periods.find((item) => item.id === activePackagePeriodId) || null;
    const lkpsEntries = summary.lkpsEntries.filter((item) => item.period_id === activePackagePeriodId);
    const ledContents = summary.ledContents.filter((item) => item.period_id === activePackagePeriodId);
    const evidence = summary.evidence.filter((item) => item.period_id === activePackagePeriodId);
    const reviews = summary.reviews.filter((item) => item.period_id === activePackagePeriodId);
    const selfScores = summary.selfScores.filter((item) => item.period_id === activePackagePeriodId);
    const actionPlans = summary.actionPlans.filter((item) => item.period_id === activePackagePeriodId);
    const submissionChecks = summary.submissionChecks.filter((item) => item.period_id === activePackagePeriodId);
    const invalidEvidence = evidence.filter((item) => !["valid", "approved"].includes(item.status));
    const openReviews = reviews.filter((item) => !["approved", "closed"].includes(item.status));
    const openActionPlans = actionPlans.filter((item) => !["done", "closed", "completed"].includes(item.status));
    const openSubmissionChecks = submissionChecks.filter((item) => !["verified", "approved", "done"].includes(item.status));
    const validEvidence = evidence.filter((item) => ["valid", "approved"].includes(item.status));
    const revisionEvidence = evidence.filter((item) => ["perlu_revisi", "revision_required", "rejected"].includes(item.status));
    const draftEvidence = evidence.filter((item) => ["draft", "pending"].includes(item.status));

    const items: AccreditationReadinessItem[] = [
      { key: "period", label: "Periode", status: period ? "ready" : "risk", count: period ? 1 : 0 },
      { key: "lkps", label: "LKPS", status: lkpsEntries.length ? "ready" : "risk", count: lkpsEntries.length },
      { key: "led", label: "LED", status: ledContents.length ? "ready" : "risk", count: ledContents.length },
      { key: "evidence", label: "Bukti valid", status: evidence.length === 0 ? "risk" : invalidEvidence.length ? "warning" : "ready", count: evidence.length, open: invalidEvidence.length },
      { key: "reviews", label: "Review selesai", status: reviews.length === 0 ? "risk" : openReviews.length ? "warning" : "ready", count: reviews.length, open: openReviews.length },
      { key: "self_scores", label: "Skor mandiri", status: selfScores.length ? "ready" : "risk", count: selfScores.length },
      { key: "action_plans", label: "Rencana perbaikan", status: actionPlans.length === 0 ? "risk" : openActionPlans.length ? "warning" : "ready", count: actionPlans.length, open: openActionPlans.length },
      { key: "submission_checks", label: "Checklist submit", status: submissionChecks.length === 0 ? "risk" : openSubmissionChecks.length ? "warning" : "ready", count: submissionChecks.length, open: openSubmissionChecks.length },
    ];

    return {
      evidence: {
        total: evidence.length,
        valid: validEvidence.length,
        revision: revisionEvidence.length,
        draft: draftEvidence.length,
        open: invalidEvidence.length,
      },
      items,
      riskCount: items.filter((item) => item.status === "risk").length,
      warningCount: items.filter((item) => item.status === "warning").length,
    };
  }, [activePackagePeriodId, summary.actionPlans, summary.evidence, summary.ledContents, summary.lkpsEntries, summary.periods, summary.reviews, summary.selfScores, summary.submissionChecks]);

  const activePeriodEvidence = useMemo(
    () => summary.evidence.filter((item) => item.period_id === activePackagePeriodId),
    [activePackagePeriodId, summary.evidence]
  );
  const activePeriodExports = useMemo(
    () => summary.exports.filter((item) => item.period_id === activePackagePeriodId),
    [activePackagePeriodId, summary.exports]
  );
  const activePeriodSubmissionChecks = useMemo(
    () => summary.submissionChecks.filter((item) => item.period_id === activePackagePeriodId),
    [activePackagePeriodId, summary.submissionChecks]
  );
  const activePeriodLkpsEntries = useMemo(
    () => summary.lkpsEntries.filter((item) => item.period_id === activePackagePeriodId),
    [activePackagePeriodId, summary.lkpsEntries]
  );
  const activePeriodLedContents = useMemo(
    () => summary.ledContents.filter((item) => item.period_id === activePackagePeriodId),
    [activePackagePeriodId, summary.ledContents]
  );
  const activePeriodActionPlans = useMemo(
    () => summary.actionPlans.filter((item) => item.period_id === activePackagePeriodId),
    [activePackagePeriodId, summary.actionPlans]
  );
  const activePeriodSelfScores = useMemo(
    () => summary.selfScores.filter((item) => item.period_id === activePackagePeriodId),
    [activePackagePeriodId, summary.selfScores]
  );
  const activePeriodReviews = useMemo(
    () => summary.reviews.filter((item) => item.period_id === activePackagePeriodId),
    [activePackagePeriodId, summary.reviews]
  );
  const evidenceCoverage = useMemo<EvidenceCoverageItem[]>(() => {
    const period = summary.periods.find((item) => item.id === activePackagePeriodId);
    const criteria = summary.criteria.filter((item) => !period?.instrument_id || item.instrument_id === period.instrument_id);

    return criteria.map((criterion) => {
      const evidence = activePeriodEvidence.filter((item) => item.criteria_code === criterion.code);
      const valid = evidence.filter((item) => ["valid", "approved"].includes(item.status)).length;
      const open = evidence.length - valid;
      const required = Number(criterion.evidence_required || 0);

      return {
        code: criterion.code,
        title: criterion.title,
        required,
        total: evidence.length,
        valid,
        open,
        status: valid >= required ? "ready" : evidence.length >= required ? "warning" : "risk",
      };
    });
  }, [activePackagePeriodId, activePeriodEvidence, summary.criteria, summary.periods]);
  const ledCoverage = useMemo<LedCoverageItem[]>(() => {
    return summary.ledSections.map((section) => {
      const contents = activePeriodLedContents.filter((item) => item.section_id === section.id);
      const ready = contents.filter((item) => ["reviewed", "approved"].includes(item.status)).length;
      const latestStatus = contents[0]?.status || "missing";

      return {
        id: section.id,
        criteriaCode: section.criteria_code,
        title: section.title,
        total: contents.length,
        ready,
        latestStatus,
        status: ready > 0 ? "ready" : contents.length > 0 ? "warning" : "risk",
      };
    });
  }, [activePeriodLedContents, summary.ledSections]);
  const selfScoreCoverage = useMemo<SelfScoreCoverageItem[]>(() => {
    const period = summary.periods.find((item) => item.id === activePackagePeriodId);
    const criteria = summary.criteria.filter((item) => !period?.instrument_id || item.instrument_id === period.instrument_id);
    const selfScores = summary.selfScores.filter((item) => item.period_id === activePackagePeriodId);

    return criteria.map((criterion) => {
      const score = selfScores.find((item) => item.criteria_code === criterion.code) || null;
      const scoreValue = score ? Number(score.score || 0) : null;
      const target = score ? Number(score.target_score || 0) : 3.5;
      const gap = score ? Math.max(0, Number(score.gap ?? target - Number(score.score || 0))) : null;

      return {
        code: criterion.code,
        title: criterion.title,
        score: scoreValue,
        target,
        gap,
        reviewer: score?.reviewer || "-",
        status: !score ? "risk" : gap && gap > 0 ? "warning" : "ready",
      };
    });
  }, [activePackagePeriodId, summary.criteria, summary.periods, summary.selfScores]);
  const actionPlanCoverage = useMemo<ActionPlanCoverageItem[]>(() => {
    return selfScoreCoverage.map((item) => {
      const plans = activePeriodActionPlans.filter((plan) => plan.criteria_code === item.code);
      const done = plans.filter((plan) => ["done", "closed", "completed"].includes(plan.status)).length;
      const open = plans.length - done;
      const gap = Number(item.gap || 0);

      return {
        code: item.code,
        title: item.title,
        gap,
        total: plans.length,
        open,
        done,
        status: gap <= 0 ? "ready" : done > 0 ? "ready" : plans.length > 0 ? "warning" : "risk",
      };
    });
  }, [activePeriodActionPlans, selfScoreCoverage]);
  const reviewCoverage = useMemo<ReviewCoverageItem[]>(() => {
    const rows = [
      { key: "led", label: "LED", entityType: "led", total: activePeriodLedContents.length, ids: activePeriodLedContents.map((item) => item.id) },
      { key: "evidence", label: "Bukti", entityType: "evidence", total: activePeriodEvidence.length, ids: activePeriodEvidence.map((item) => item.id) },
      { key: "self_score", label: "Self Score", entityType: "self_score", total: activePeriodSelfScores.length, ids: activePeriodSelfScores.map((item) => item.id) },
    ];

    return rows.map((row) => {
      const reviews = activePeriodReviews.filter((review) => review.entity_type === row.entityType && (!review.entity_id || row.ids.includes(review.entity_id)));
      const approved = reviews.filter((review) => ["approved", "closed"].includes(review.status)).length;
      const open = reviews.filter((review) => !["approved", "closed"].includes(review.status)).length;
      const reviewedEntityIds = new Set(reviews.map((review) => review.entity_id).filter(Boolean));
      const missing = row.ids.filter((id) => !reviewedEntityIds.has(id)).length;

      return {
        key: row.key,
        label: row.label,
        entityType: row.entityType,
        total: row.total,
        approved,
        open,
        missing,
        status: row.total === 0 ? "risk" : missing === 0 && open === 0 ? "ready" : reviews.length > 0 ? "warning" : "risk",
      };
    });
  }, [activePeriodEvidence, activePeriodLedContents, activePeriodReviews, activePeriodSelfScores]);
  const packageGate = useMemo(() => {
    const coverageItems = [
      ...packageReadiness.items,
      ...evidenceCoverage,
      ...ledCoverage,
      ...selfScoreCoverage,
      ...actionPlanCoverage,
      ...reviewCoverage,
    ];
    const riskCount = coverageItems.filter((item) => item.status === "risk").length;
    const warningCount = coverageItems.filter((item) => item.status === "warning").length;
    const status = riskCount ? "risk" : warningCount ? "warning" : "ready";

    return {
      status,
      riskCount,
      warningCount,
      label: status === "ready" ? "Siap Generate" : status === "warning" ? "Generate dengan Catatan" : "Generate Paket Draft",
    };
  }, [actionPlanCoverage, evidenceCoverage, ledCoverage, packageReadiness.items, reviewCoverage, selfScoreCoverage]);
  const visiblePackageReadinessItems = useMemo(
    () => showOnlyPackageIssues ? packageReadiness.items.filter((item) => item.status !== "ready") : packageReadiness.items,
    [packageReadiness.items, showOnlyPackageIssues]
  );
  const visibleEvidenceCoverage = useMemo(
    () => showOnlyPackageIssues ? evidenceCoverage.filter((item) => item.status !== "ready") : evidenceCoverage,
    [evidenceCoverage, showOnlyPackageIssues]
  );
  const visibleLedCoverage = useMemo(
    () => showOnlyPackageIssues ? ledCoverage.filter((item) => item.status !== "ready") : ledCoverage,
    [ledCoverage, showOnlyPackageIssues]
  );
  const visibleSelfScoreCoverage = useMemo(
    () => showOnlyPackageIssues ? selfScoreCoverage.filter((item) => item.status !== "ready") : selfScoreCoverage,
    [selfScoreCoverage, showOnlyPackageIssues]
  );
  const visibleActionPlanCoverage = useMemo(
    () => showOnlyPackageIssues ? actionPlanCoverage.filter((item) => item.status !== "ready") : actionPlanCoverage,
    [actionPlanCoverage, showOnlyPackageIssues]
  );
  const visibleReviewCoverage = useMemo(
    () => showOnlyPackageIssues ? reviewCoverage.filter((item) => item.status !== "ready") : reviewCoverage,
    [reviewCoverage, showOnlyPackageIssues]
  );
  const packageIssueSummary = useMemo(() => {
    return [
      { key: "readiness", label: "Readiness", count: packageReadiness.items.filter((item) => item.status !== "ready").length },
      { key: "evidence", label: "Bukti", count: evidenceCoverage.filter((item) => item.status !== "ready").length },
      { key: "led", label: "LED", count: ledCoverage.filter((item) => item.status !== "ready").length },
      { key: "self_score", label: "Self Score", count: selfScoreCoverage.filter((item) => item.status !== "ready").length },
      { key: "action_plan", label: "Rencana", count: actionPlanCoverage.filter((item) => item.status !== "ready").length },
      { key: "review", label: "Review", count: reviewCoverage.filter((item) => item.status !== "ready").length },
    ];
  }, [actionPlanCoverage, evidenceCoverage, ledCoverage, packageReadiness.items, reviewCoverage, selfScoreCoverage]);

  function shouldShowPackageSection(key: string) {
    return packageIssueCategory === "all" || packageIssueCategory === key;
  }

  async function postJson(path: string, body: Record<string, unknown>, successMessage: string, method = "POST") {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await clientApiRequest(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok || (payload && payload.success === false)) {
        throw new Error(payload?.message || "Data gagal disimpan.");
      }

      setMessage(successMessage);
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  function createPeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/periods",
      {
        name: form.get("name"),
        type: form.get("type"),
        agency: form.get("agency"),
        instrument_id: form.get("instrument_id"),
        org_unit_code: form.get("org_unit_code"),
        start_date: form.get("start_date"),
        due_date: form.get("due_date"),
        status: "draft",
      },
      "Periode akreditasi berhasil dibuat."
    );
    event.currentTarget.reset();
  }

  function createTeamMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/team-members",
      {
        period_id: form.get("period_id"),
        name: form.get("name"),
        role: form.get("role"),
        email: form.get("email"),
        responsibility: form.get("responsibility"),
      },
      "Anggota tim akreditasi berhasil ditambahkan."
    );
    event.currentTarget.reset();
  }

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/tasks",
      {
        period_id: form.get("period_id"),
        title: form.get("title"),
        category: form.get("category"),
        assignee: form.get("assignee"),
        priority: form.get("priority"),
        status: form.get("status"),
        due_date: form.get("due_date"),
        progress: form.get("progress"),
        notes: form.get("notes"),
      },
      "Task akreditasi berhasil ditambahkan."
    );
    event.currentTarget.reset();
  }

  function createMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/milestones",
      {
        period_id: form.get("period_id"),
        title: form.get("title"),
        phase: form.get("phase"),
        owner: form.get("owner"),
        start_date: form.get("start_date"),
        due_date: form.get("due_date"),
        status: form.get("status"),
        progress: form.get("progress"),
        notes: form.get("notes"),
      },
      "Milestone akreditasi berhasil ditambahkan."
    );
    event.currentTarget.reset();
  }

  function createRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/risks",
      {
        period_id: form.get("period_id"),
        title: form.get("title"),
        category: form.get("category"),
        owner: form.get("owner"),
        probability: form.get("probability"),
        impact: form.get("impact"),
        level: form.get("level"),
        status: form.get("status"),
        mitigation: form.get("mitigation"),
        due_date: form.get("due_date"),
        notes: form.get("notes"),
      },
      "Risiko akreditasi berhasil ditambahkan."
    );
    event.currentTarget.reset();
  }

  function createCriterion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/criteria",
      {
        instrument_id: form.get("instrument_id"),
        code: form.get("code"),
        title: form.get("title"),
        weight: form.get("weight"),
        evidence_required: form.get("evidence_required"),
        standard_codes: String(form.get("standard_codes") || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
      "Kriteria akreditasi berhasil ditambahkan."
    );
    event.currentTarget.reset();
  }

  function createLkpsEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/lkps/entries",
      {
        period_id: form.get("period_id"),
        section_id: form.get("section_id"),
        label: form.get("label"),
        value: form.get("value"),
        unit: form.get("unit"),
        source_module: form.get("source_module"),
        status: form.get("status"),
        notes: form.get("notes"),
      },
      "Entry LKPS berhasil disimpan."
    );
    event.currentTarget.reset();
  }

  function createLedContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/led/contents",
      {
        period_id: form.get("period_id"),
        section_id: form.get("section_id"),
        content: form.get("content"),
        status: form.get("status"),
        reviewer_note: form.get("reviewer_note"),
      },
      "Draft LED berhasil disimpan."
    );
    event.currentTarget.reset();
  }

  function createEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");

    if (file instanceof File && file.size === 0) {
      form.delete("file");
    }

    setSaving(true);
    setMessage("");
    setError("");

    clientApiRequest("/accreditation/evidence", {
      method: "POST",
      body: form,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || (payload && payload.success === false)) {
          throw new Error(payload?.message || "Bukti fisik gagal disimpan.");
        }

        setMessage("Bukti fisik berhasil disimpan.");
        await loadSummary();
        event.currentTarget.reset();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Bukti fisik gagal disimpan.");
      })
      .finally(() => {
        setSaving(false);
      });
  }

  function createSelfScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/self-scores",
      {
        period_id: form.get("period_id"),
        criteria_code: form.get("criteria_code"),
        score: form.get("score"),
        target_score: form.get("target_score"),
        status: form.get("status"),
        gap_note: form.get("gap_note"),
        recommendation: form.get("recommendation"),
        reviewer: form.get("reviewer"),
      },
      "Skor penilaian mandiri berhasil disimpan."
    );
    event.currentTarget.reset();
  }

  function createActionPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/action-plans",
      {
        period_id: form.get("period_id"),
        criteria_code: form.get("criteria_code"),
        title: form.get("title"),
        source: form.get("source"),
        owner: form.get("owner"),
        priority: form.get("priority"),
        status: form.get("status"),
        target_date: form.get("target_date"),
        progress: form.get("progress"),
        action: form.get("action"),
        expected_output: form.get("expected_output"),
        notes: form.get("notes"),
      },
      "Rencana perbaikan akreditasi berhasil ditambahkan."
    );
    event.currentTarget.reset();
  }

  function createReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/reviews",
      {
        period_id: form.get("period_id"),
        entity_type: form.get("entity_type"),
        entity_id: form.get("entity_id"),
        reviewer: form.get("reviewer"),
        status: form.get("status"),
        decision: form.get("decision"),
        note: form.get("note"),
        due_date: form.get("due_date"),
      },
      "Review internal berhasil disimpan."
    );
    event.currentTarget.reset();
  }

  function updatePeriodStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const periodId = String(form.get("period_id") || firstPeriodId);
    postJson(
      `/accreditation/periods/${encodeURIComponent(periodId)}/status`,
      {
        status: form.get("status"),
        progress: form.get("progress"),
        final_note: form.get("final_note"),
      },
      "Status periode berhasil diperbarui.",
      "PATCH"
    );
    event.currentTarget.reset();
  }

  function createExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/exports",
      {
        period_id: form.get("period_id"),
        type: form.get("type"),
      },
      "Paket export akreditasi berhasil dibuat."
    );
  }

  function createSubmissionCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    postJson(
      "/accreditation/submission-checks",
      {
        period_id: form.get("period_id"),
        category: form.get("category"),
        title: form.get("title"),
        owner: form.get("owner"),
        verifier: form.get("verifier"),
        status: form.get("status"),
        due_date: form.get("due_date"),
        evidence_id: form.get("evidence_id"),
        notes: form.get("notes"),
      },
      "Checklist submit akreditasi berhasil ditambahkan."
    );
    event.currentTarget.reset();
  }

  function normalizeIssueKey(value: string) {
    return value.trim().toLowerCase();
  }

  function hasOpenSubmissionCheck(row: Pick<SubmissionCheckDraft, "category" | "title">) {
    const closedStatuses = ["verified", "approved", "done", "closed"];
    const category = normalizeIssueKey(row.category);
    const title = normalizeIssueKey(row.title);

    return activePeriodSubmissionChecks.some((item) => (
      normalizeIssueKey(item.category) === category &&
      normalizeIssueKey(item.title) === title &&
      !closedStatuses.includes(item.status)
    ));
  }

  function hasOpenActionPlan(row: Pick<ActionPlanDraft, "criteria_code" | "source" | "title">) {
    const closedStatuses = ["done", "closed", "completed"];
    const criteriaCode = normalizeIssueKey(row.criteria_code);
    const source = normalizeIssueKey(row.source);
    const title = normalizeIssueKey(row.title);

    return activePeriodActionPlans.some((item) => (
      normalizeIssueKey(item.criteria_code) === criteriaCode &&
      normalizeIssueKey(item.source) === source &&
      normalizeIssueKey(item.title) === title &&
      !closedStatuses.includes(item.status)
    ));
  }

  function readinessCheckIdentity(item: AccreditationReadinessItem) {
    return { category: readinessCategory(item.key), title: `Tindak lanjut ${item.label}` };
  }

  function evidenceCheckIdentity(item: EvidenceCoverageItem) {
    return { category: "BUKTI", title: `Lengkapi bukti ${item.code}` };
  }

  function ledCheckIdentity(item: LedCoverageItem) {
    return { category: "LED", title: `Lengkapi LED ${item.criteriaCode}` };
  }

  function selfScoreCheckIdentity(item: SelfScoreCoverageItem) {
    return { category: "SUBMIT", title: `Lengkapi self-assessment ${item.code}` };
  }

  function reviewCheckIdentity(item: ReviewCoverageItem) {
    return { category: "REVIEW", title: `Selesaikan review ${item.label}` };
  }

  function actionPlanIdentity(item: ActionPlanCoverageItem) {
    return { criteria_code: item.code, source: "self_score", title: `Tutup gap ${item.code}` };
  }

  function createSubmissionCheckFromReadiness(item: AccreditationReadinessItem) {
    const identity = readinessCheckIdentity(item);
    const row: SubmissionCheckDraft = {
      period_id: activePackagePeriodId,
      category: identity.category,
      title: identity.title,
      owner: "admin-akreditasi@spmi.local",
      verifier: "reviewer@spmi.local",
      status: "pending",
      due_date: null,
      evidence_id: null,
      notes: `${item.label}: ${item.status}${item.open ? `, ${item.open} open` : ""}.`,
    };

    if (hasOpenSubmissionCheck(row)) {
      setMessage("Checklist untuk issue ini sudah ada.");
      setError("");
      return;
    }

    postJson(
      "/accreditation/submission-checks",
      row,
      "Checklist dari readiness berhasil dibuat."
    );
  }

  function createSubmissionCheckFromCoverage(item: EvidenceCoverageItem) {
    const identity = evidenceCheckIdentity(item);
    const row: SubmissionCheckDraft = {
      period_id: activePackagePeriodId,
      category: identity.category,
      title: identity.title,
      owner: "admin-akreditasi@spmi.local",
      verifier: "reviewer@spmi.local",
      status: "pending",
      due_date: null,
      evidence_id: null,
      notes: `${item.code} membutuhkan ${item.required} bukti valid. Saat ini ${item.valid} valid dari ${item.total} bukti.`,
    };

    if (hasOpenSubmissionCheck(row)) {
      setMessage("Checklist untuk issue ini sudah ada.");
      setError("");
      return;
    }

    postJson(
      "/accreditation/submission-checks",
      row,
      "Checklist gap bukti berhasil dibuat."
    );
  }

  function createSubmissionCheckFromLedCoverage(item: LedCoverageItem) {
    const identity = ledCheckIdentity(item);
    const row: SubmissionCheckDraft = {
      period_id: activePackagePeriodId,
      category: identity.category,
      title: identity.title,
      owner: "admin-akreditasi@spmi.local",
      verifier: "reviewer@spmi.local",
      status: "pending",
      due_date: null,
      evidence_id: null,
      notes: `${item.criteriaCode} - ${item.title}: ${item.total} draft, status terakhir ${item.latestStatus}.`,
    };

    if (hasOpenSubmissionCheck(row)) {
      setMessage("Checklist untuk issue ini sudah ada.");
      setError("");
      return;
    }

    postJson(
      "/accreditation/submission-checks",
      row,
      "Checklist gap LED berhasil dibuat."
    );
  }

  function createSubmissionCheckFromSelfScoreCoverage(item: SelfScoreCoverageItem) {
    const identity = selfScoreCheckIdentity(item);
    const row: SubmissionCheckDraft = {
      period_id: activePackagePeriodId,
      category: identity.category,
      title: identity.title,
      owner: "admin-akreditasi@spmi.local",
      verifier: "reviewer@spmi.local",
      status: "pending",
      due_date: null,
      evidence_id: null,
      notes: item.score === null
        ? `${item.code} belum memiliki skor mandiri.`
        : `${item.code} skor ${item.score}/${item.target}, gap ${item.gap || 0}.`,
    };

    if (hasOpenSubmissionCheck(row)) {
      setMessage("Checklist untuk issue ini sudah ada.");
      setError("");
      return;
    }

    postJson(
      "/accreditation/submission-checks",
      row,
      "Checklist gap self-assessment berhasil dibuat."
    );
  }

  function createActionPlanFromCoverage(item: ActionPlanCoverageItem) {
    const identity = actionPlanIdentity(item);
    const row: ActionPlanDraft = {
      period_id: activePackagePeriodId,
      criteria_code: identity.criteria_code,
      title: identity.title,
      source: identity.source,
      owner: "admin-akreditasi@spmi.local",
      priority: item.gap >= 1 ? "high" : "medium",
      status: "todo",
      target_date: null,
      progress: 0,
      action: `Identifikasi bukti, narasi LED, dan tindak lanjut untuk menutup gap ${item.code}.`,
      expected_output: `Gap ${item.code} turun sampai target self-assessment terpenuhi.`,
      notes: `${item.code} memiliki gap ${item.gap}.`,
    };

    if (hasOpenActionPlan(row)) {
      setMessage("Rencana perbaikan untuk gap ini sudah ada.");
      setError("");
      return;
    }

    postJson(
      "/accreditation/action-plans",
      row,
      "Rencana perbaikan dari gap berhasil dibuat."
    );
  }

  function createSubmissionCheckFromReviewCoverage(item: ReviewCoverageItem) {
    const identity = reviewCheckIdentity(item);
    const row: SubmissionCheckDraft = {
      period_id: activePackagePeriodId,
      category: identity.category,
      title: identity.title,
      owner: "admin-akreditasi@spmi.local",
      verifier: "reviewer@spmi.local",
      status: "pending",
      due_date: null,
      evidence_id: null,
      notes: `${item.label}: ${item.approved} approved, ${item.open} open, ${item.missing} belum direview dari ${item.total} item.`,
    };

    if (hasOpenSubmissionCheck(row)) {
      setMessage("Checklist untuk issue ini sudah ada.");
      setError("");
      return;
    }

    postJson(
      "/accreditation/submission-checks",
      row,
      "Checklist gap review berhasil dibuat."
    );
  }

  function buildVisibleIssueChecklistRows() {
    const rows: SubmissionCheckDraft[] = [];

    if (shouldShowPackageSection("readiness")) {
      visiblePackageReadinessItems.filter((item) => item.status !== "ready").forEach((item) => {
        const identity = readinessCheckIdentity(item);
        rows.push({
          period_id: activePackagePeriodId,
          category: identity.category,
          title: identity.title,
          owner: "admin-akreditasi@spmi.local",
          verifier: "reviewer@spmi.local",
          status: "pending",
          due_date: null,
          evidence_id: null,
          notes: `${item.label}: ${item.status}${item.open ? `, ${item.open} open` : ""}.`,
        });
      });
    }

    if (shouldShowPackageSection("evidence")) {
      visibleEvidenceCoverage.filter((item) => item.status !== "ready").forEach((item) => {
        const identity = evidenceCheckIdentity(item);
        rows.push({
          period_id: activePackagePeriodId,
          category: identity.category,
          title: identity.title,
          owner: "admin-akreditasi@spmi.local",
          verifier: "reviewer@spmi.local",
          status: "pending",
          due_date: null,
          evidence_id: null,
          notes: `${item.code} membutuhkan ${item.required} bukti valid. Saat ini ${item.valid} valid dari ${item.total} bukti.`,
        });
      });
    }

    if (shouldShowPackageSection("led")) {
      visibleLedCoverage.filter((item) => item.status !== "ready").forEach((item) => {
        const identity = ledCheckIdentity(item);
        rows.push({
          period_id: activePackagePeriodId,
          category: identity.category,
          title: identity.title,
          owner: "admin-akreditasi@spmi.local",
          verifier: "reviewer@spmi.local",
          status: "pending",
          due_date: null,
          evidence_id: null,
          notes: `${item.criteriaCode} - ${item.title}: ${item.total} draft, status terakhir ${item.latestStatus}.`,
        });
      });
    }

    if (shouldShowPackageSection("self_score")) {
      visibleSelfScoreCoverage.filter((item) => item.status !== "ready").forEach((item) => {
        const identity = selfScoreCheckIdentity(item);
        rows.push({
          period_id: activePackagePeriodId,
          category: identity.category,
          title: identity.title,
          owner: "admin-akreditasi@spmi.local",
          verifier: "reviewer@spmi.local",
          status: "pending",
          due_date: null,
          evidence_id: null,
          notes: item.score === null
            ? `${item.code} belum memiliki skor mandiri.`
            : `${item.code} skor ${item.score}/${item.target}, gap ${item.gap || 0}.`,
        });
      });
    }

    if (shouldShowPackageSection("review")) {
      visibleReviewCoverage.filter((item) => item.status !== "ready").forEach((item) => {
        const identity = reviewCheckIdentity(item);
        rows.push({
          period_id: activePackagePeriodId,
          category: identity.category,
          title: identity.title,
          owner: "admin-akreditasi@spmi.local",
          verifier: "reviewer@spmi.local",
          status: "pending",
          due_date: null,
          evidence_id: null,
          notes: `${item.label}: ${item.approved} approved, ${item.open} open, ${item.missing} belum direview dari ${item.total} item.`,
        });
      });
    }

    return rows;
  }

  function buildVisibleActionPlanRows() {
    if (!shouldShowPackageSection("action_plan")) return [];

    return visibleActionPlanCoverage
      .filter((item) => item.status !== "ready")
      .map((item) => {
        const identity = actionPlanIdentity(item);

        return {
          period_id: activePackagePeriodId,
          criteria_code: identity.criteria_code,
          title: identity.title,
          source: identity.source,
          owner: "admin-akreditasi@spmi.local",
          priority: item.gap >= 1 ? "high" : "medium",
          status: "todo",
          target_date: null,
          progress: 0,
          action: `Identifikasi bukti, narasi LED, dan tindak lanjut untuk menutup gap ${item.code}.`,
          expected_output: `Gap ${item.code} turun sampai target self-assessment terpenuhi.`,
          notes: `${item.code} memiliki gap ${item.gap}.`,
        };
      });
  }

  async function createVisibleIssueChecklists() {
    const rows = buildVisibleIssueChecklistRows();

    if (rows.length === 0) {
      setMessage("Tidak ada issue terlihat untuk dibuat checklist.");
      setError("");
      return;
    }

    const newRows = rows.filter((row) => !hasOpenSubmissionCheck(row));
    const skipped = rows.length - newRows.length;

    if (newRows.length === 0) {
      setMessage(`${skipped} checklist issue terlihat sudah ada.`);
      setError("");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await clientApiRequest("/accreditation/submission-checks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newRows }),
      });
      const payload = await response.json();

      if (!response.ok || (payload && payload.success === false)) {
        throw new Error(payload?.message || "Checklist issue gagal dibuat.");
      }

      const createdCount = Number(payload?.data?.created_count ?? newRows.length);
      const skippedCount = Number(payload?.data?.skipped_count ?? 0) + skipped;
      setMessage(`${createdCount} checklist issue berhasil dibuat${skippedCount ? `, ${skippedCount} dilewati karena sudah ada` : ""}.`);
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checklist issue gagal dibuat.");
    } finally {
      setSaving(false);
    }
  }

  async function createVisibleActionPlans() {
    const rows = buildVisibleActionPlanRows();

    if (rows.length === 0) {
      setMessage("Tidak ada issue rencana terlihat untuk dibuat action plan.");
      setError("");
      return;
    }

    const newRows = rows.filter((row) => !hasOpenActionPlan(row));
    const skipped = rows.length - newRows.length;

    if (newRows.length === 0) {
      setMessage(`${skipped} rencana perbaikan terlihat sudah ada.`);
      setError("");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await clientApiRequest("/accreditation/action-plans/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newRows }),
      });
      const payload = await response.json();

      if (!response.ok || (payload && payload.success === false)) {
        throw new Error(payload?.message || "Rencana perbaikan issue gagal dibuat.");
      }

      const createdCount = Number(payload?.data?.created_count ?? newRows.length);
      const skippedCount = Number(payload?.data?.skipped_count ?? 0) + skipped;
      setMessage(`${createdCount} rencana perbaikan issue berhasil dibuat${skippedCount ? `, ${skippedCount} dilewati karena sudah ada` : ""}.`);
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rencana perbaikan issue gagal dibuat.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadExport(exportId: string, fileName: string) {
    setMessage("");
    setError("");

    try {
      const response = await clientApiRequest(`/accreditation/exports/${encodeURIComponent(exportId)}/download`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Paket export gagal diunduh.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `${exportId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage("Paket export akreditasi berhasil diunduh.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paket export gagal diunduh.");
    }
  }

  const visibleIssueChecklistRows = buildVisibleIssueChecklistRows();
  const visibleNewIssueChecklistCount = visibleIssueChecklistRows.filter((row) => !hasOpenSubmissionCheck(row)).length;
  const visibleExistingIssueChecklistCount = visibleIssueChecklistRows.length - visibleNewIssueChecklistCount;
  const visibleActionPlanRows = buildVisibleActionPlanRows();
  const visibleNewActionPlanCount = visibleActionPlanRows.filter((row) => !hasOpenActionPlan(row)).length;
  const visibleExistingActionPlanCount = visibleActionPlanRows.length - visibleNewActionPlanCount;
  const packageIssueActionSummary: Record<string, { new: number; existing: number }> = {
    readiness: {
      new: packageReadiness.items.filter((item) => item.status !== "ready" && !hasOpenSubmissionCheck(readinessCheckIdentity(item))).length,
      existing: packageReadiness.items.filter((item) => item.status !== "ready" && hasOpenSubmissionCheck(readinessCheckIdentity(item))).length,
    },
    evidence: {
      new: evidenceCoverage.filter((item) => item.status !== "ready" && !hasOpenSubmissionCheck(evidenceCheckIdentity(item))).length,
      existing: evidenceCoverage.filter((item) => item.status !== "ready" && hasOpenSubmissionCheck(evidenceCheckIdentity(item))).length,
    },
    led: {
      new: ledCoverage.filter((item) => item.status !== "ready" && !hasOpenSubmissionCheck(ledCheckIdentity(item))).length,
      existing: ledCoverage.filter((item) => item.status !== "ready" && hasOpenSubmissionCheck(ledCheckIdentity(item))).length,
    },
    self_score: {
      new: selfScoreCoverage.filter((item) => item.status !== "ready" && !hasOpenSubmissionCheck(selfScoreCheckIdentity(item))).length,
      existing: selfScoreCoverage.filter((item) => item.status !== "ready" && hasOpenSubmissionCheck(selfScoreCheckIdentity(item))).length,
    },
    action_plan: {
      new: actionPlanCoverage.filter((item) => item.status !== "ready" && !hasOpenActionPlan(actionPlanIdentity(item))).length,
      existing: actionPlanCoverage.filter((item) => item.status !== "ready" && hasOpenActionPlan(actionPlanIdentity(item))).length,
    },
    review: {
      new: reviewCoverage.filter((item) => item.status !== "ready" && !hasOpenSubmissionCheck(reviewCheckIdentity(item))).length,
      existing: reviewCoverage.filter((item) => item.status !== "ready" && hasOpenSubmissionCheck(reviewCheckIdentity(item))).length,
    },
  };

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-7 p-md-0">
          <div className="welcome-text">
            <h4>Dashboard Akreditasi</h4>
            <p className="mb-0">Core modul untuk periode, instrumen, kriteria, tim, dan kesiapan akreditasi.</p>
          </div>
        </div>
        <div className="col-sm-5 p-md-0 justify-content-sm-end mt-2 mt-sm-0 d-flex">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
            <li className="breadcrumb-item active">Akreditasi</li>
          </ol>
        </div>
      </div>

      {error && <div className="alert alert-outline-danger">{error}</div>}
      {message && <div className="alert alert-outline-success">{message}</div>}

      <div className="row" id="dashboard-akreditasi">
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-body">
              <span className={`badge ${statusBadge(summary.readiness.status)}`}>Readiness</span>
              <h2 className="mt-3 mb-1">{summary.readiness.average_progress}%</h2>
              <p className="mb-0">Rata-rata kesiapan akreditasi aktif.</p>
            </div>
          </div>
        </div>
        {(loading ? [{ label: "Memuat", value: 0 }] : summary.metrics).map((metric) => (
          <div className="col-xl-3 col-sm-6" key={metric.label}>
            <div className="card">
              <div className="card-body">
                <span className="text-muted">{metric.label}</span>
                <h2 className="mt-3 mb-1">{metric.value}</h2>
                <p className="mb-0">Data awal modul akreditasi.</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row" id="periode-akreditasi">
        <div className="col-xl-8">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Periode & Readiness Prodi</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-responsive-sm">
                  <thead className="thead-primary">
                    <tr>
                      <th>Periode</th>
                      <th>Unit</th>
                      <th>Instrumen</th>
                      <th>Deadline</th>
                      <th>Progress</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.assessments.length === 0 ? (
                      <tr><td colSpan={6} className="text-center">Data assessment belum tersedia.</td></tr>
                    ) : summary.assessments.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.period?.name || item.period_id}</strong>
                          <br />
                          <small>Skor proyeksi {item.score_projection} - {item.predicate_projection}</small>
                        </td>
                        <td>{item.org_unit?.name || item.org_unit_code}</td>
                        <td>{item.period?.agency || "-"} / {item.period?.type || "-"}</td>
                        <td>{formatDate(item.period?.due_date)}</td>
                        <td style={{ minWidth: 160 }}>
                          <div className="progress">
                            <div className="progress-bar bg-success" style={{ width: progressWidth(item.progress) }}>{item.progress}%</div>
                          </div>
                          <small>LKPS {item.lkps_progress}% | LED {item.led_progress}% | Eviden {item.evidence_progress}%</small>
                        </td>
                        <td><span className={`badge ${statusBadge(item.readiness_status)}`}>{item.readiness_status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Buat Periode</h4>
            </div>
            <div className="card-body">
              <form onSubmit={createPeriod}>
                <div className="form-group">
                  <label>Nama Periode</label>
                  <input className="form-control" name="name" placeholder="APS Prodi 2026" required />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Jenis</label>
                    <select className="form-control" name="type" defaultValue="APS">
                      <option value="APS">APS</option>
                      <option value="APT">APT</option>
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Lembaga</label>
                    <select className="form-control" name="agency" defaultValue="LAM">
                      <option value="LAM">LAM</option>
                      <option value="BAN-PT">BAN-PT</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Instrumen</label>
                  <select className="form-control" name="instrument_id" defaultValue={firstInstrumentId}>
                    {summary.instruments.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Kode Unit</label>
                    <input className="form-control" name="org_unit_code" placeholder="SI" required />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Mulai</label>
                    <input className="form-control" name="start_date" type="date" required />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Deadline</label>
                    <input className="form-control" name="due_date" type="date" />
                  </div>
                </div>
                <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
                  <i className="la la-plus-circle mr-1"></i> Simpan Periode
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row" id="instrumen-kriteria">
        <div className="col-xl-5">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Instrumen</h4>
            </div>
            <div className="card-body">
              {summary.instruments.map((item) => (
                <div className="media mb-3" key={item.id}>
                  <span className="mr-3"><i className="la la-award text-primary" style={{ fontSize: 28 }}></i></span>
                  <div className="media-body">
                    <h5 className="mb-1">{item.name}</h5>
                    <p className="mb-1">{item.agency} | {item.level}</p>
                    <span className={`badge ${statusBadge(item.status)}`}>{item.criteria_count} kriteria</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xl-7">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">9 Kriteria & Mapping Standar</h4>
            </div>
            <div className="card-body">
              <form className="mb-4" onSubmit={createCriterion}>
                <div className="form-row">
                  <div className="form-group col-md-3">
                    <label>Instrumen</label>
                    <select className="form-control" name="instrument_id" defaultValue={firstInstrumentId}>
                      {summary.instruments.map((item) => <option value={item.id} key={item.id}>{item.code}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-2">
                    <label>Kode</label>
                    <input className="form-control" name="code" placeholder="K10" required />
                  </div>
                  <div className="form-group col-md-3">
                    <label>Bobot</label>
                    <input className="form-control" name="weight" type="number" min="0" defaultValue="0" />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Eviden Wajib</label>
                    <input className="form-control" name="evidence_required" type="number" min="0" defaultValue="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Judul Kriteria</label>
                  <input className="form-control" name="title" placeholder="Kriteria baru" required />
                </div>
                <div className="form-group">
                  <label>Kode Standar Terkait</label>
                  <input className="form-control" name="standard_codes" placeholder="STD-PEND-01, STD-SDM-01" />
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-plus mr-1"></i> Tambah Kriteria
                </button>
              </form>

              {(summary.instruments.length ? summary.instruments : [{ id: "default", name: "Instrumen" } as AccreditationInstrument]).map((instrument) => (
                <div key={instrument.id}>
                  <h5>{instrument.name}</h5>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <tbody>
                        {(groupedCriteria[instrument.id] || []).map((criterion) => (
                          <tr key={criterion.id}>
                            <td><strong>{criterion.code}</strong></td>
                            <td>{criterion.title}</td>
                            <td>{criterion.weight}%</td>
                            <td>{criterion.evidence_required} bukti</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row" id="lkps-led">
        <div className="col-xl-6" id="lkps-akreditasi">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">LKPS Basic</h4>
            </div>
            <div className="card-body">
              <form className="mb-4" onSubmit={createLkpsEntry}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" value={activePackagePeriodId} onChange={(event) => setPackagePeriodId(event.target.value)}>
                      {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Section LKPS</label>
                    <select className="form-control" name="section_id" defaultValue={firstLkpsSectionId}>
                      {summary.lkpsSections.map((item) => <option value={item.id} key={item.id}>{item.code} - {item.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Label Data</label>
                  <input className="form-control" name="label" placeholder="Mahasiswa aktif / Dosen tetap / Publikasi" required />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Nilai</label>
                    <input className="form-control" name="value" type="number" min="0" step="0.01" required />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Satuan</label>
                    <input className="form-control" name="unit" placeholder="mahasiswa" required />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Sumber</label>
                    <select className="form-control" name="source_module" defaultValue="SIAKAD">
                      <option value="SIAKAD">SIAKAD</option>
                      <option value="HRIS">HRIS</option>
                      <option value="SPMI">SPMI</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="draft">
                      <option value="draft">Draft</option>
                      <option value="perlu_review">Perlu Review</option>
                      <option value="valid">Valid</option>
                    </select>
                  </div>
                  <div className="form-group col-md-8">
                    <label>Catatan</label>
                    <input className="form-control" name="notes" placeholder="Catatan validasi / sumber data" />
                  </div>
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-save mr-1"></i> Simpan LKPS
                </button>
              </form>

              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Data</th>
                      <th>Nilai</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.lkpsEntries.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">Entry LKPS belum tersedia.</td></tr>
                    ) : summary.lkpsEntries.map((item) => (
                      <tr key={item.id}>
                        <td>{item.section?.code || item.section_id}</td>
                        <td>
                          <strong>{item.label}</strong>
                          <br />
                          <small>{item.source_module} | {item.notes || "-"}</small>
                        </td>
                        <td>{item.value} {item.unit}</td>
                        <td><span className={`badge ${statusBadge(item.status)}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-6" id="led-akreditasi">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">LED Basic</h4>
            </div>
            <div className="card-body">
              <form className="mb-4" onSubmit={createLedContent}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                      {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Section LED</label>
                    <select className="form-control" name="section_id" defaultValue={firstLedSectionId}>
                      {summary.ledSections.map((item) => <option value={item.id} key={item.id}>{item.criteria_code} - {item.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Narasi</label>
                  <textarea className="form-control" name="content" rows={5} placeholder="Tulis narasi evaluasi diri per kriteria..." required></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="draft">
                      <option value="draft">Draft</option>
                      <option value="perlu_review">Perlu Review</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="approved">Approved</option>
                    </select>
                  </div>
                  <div className="form-group col-md-8">
                    <label>Catatan Reviewer</label>
                    <input className="form-control" name="reviewer_note" placeholder="Catatan untuk revisi narasi" />
                  </div>
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-save mr-1"></i> Simpan LED
                </button>
              </form>

              {summary.ledContents.length === 0 ? (
                <p className="text-center mb-0">Draft LED belum tersedia.</p>
              ) : summary.ledContents.map((item) => (
                <div className="border-bottom py-3" key={item.id}>
                  <div className="d-flex justify-content-between">
                    <strong>{item.section?.criteria_code || item.section_id} - {item.section?.title || "LED"}</strong>
                    <span className={`badge ${statusBadge(item.status)}`}>v{item.version} {item.status}</span>
                  </div>
                  <p className="mb-1 mt-2">{item.content}</p>
                  <small>Reviewer: {item.reviewer_note || "-"} | Update: {item.updated_by}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row" id="self-assessment-akreditasi">
        <div className="col-xl-5">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Penilaian Mandiri</h4>
            </div>
            <div className="card-body">
              <form onSubmit={createSelfScore}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                      {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Kriteria</label>
                    <select className="form-control" name="criteria_code" defaultValue={firstCriteriaCode}>
                      {summary.criteria.map((item) => <option value={item.code} key={item.id}>{item.code} - {item.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Skor</label>
                    <input className="form-control" name="score" type="number" min="0" max="4" step="0.01" required />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Target</label>
                    <input className="form-control" name="target_score" type="number" min="0" max="4" step="0.01" defaultValue="3.5" />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="warning">
                      <option value="ready">Ready</option>
                      <option value="warning">Warning</option>
                      <option value="risk">Risk</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Catatan Gap</label>
                  <textarea className="form-control" name="gap_note" rows={3} placeholder="Kesenjangan utama terhadap target skor..." required></textarea>
                </div>
                <div className="form-group">
                  <label>Rekomendasi</label>
                  <textarea className="form-control" name="recommendation" rows={3} placeholder="Tindakan perbaikan prioritas..." required></textarea>
                </div>
                <div className="form-group">
                  <label>Reviewer</label>
                  <input className="form-control" name="reviewer" placeholder="reviewer@spmi.local" />
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-star-half-alt mr-1"></i> Simpan Skor
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-7">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Gap & Proyeksi Skor</h4>
            </div>
            <div className="card-body">
              <div className="row">
                {summary.scoring.map((item) => (
                  <div className="col-md-6" key={item.period_id}>
                    <div className="border rounded p-3 mb-3">
                      <small>{item.period_name}</small>
                      <h3 className="mb-1">{item.score_projection}</h3>
                      <span className={`badge ${statusBadge(item.predicate_projection === "UNGGUL" ? "ready" : item.predicate_projection === "BAIK SEKALI" ? "warning" : "risk")}`}>
                        {item.predicate_projection}
                      </span>
                      <p className="mb-0 mt-2">Rata-rata {item.average_score}/4 dari {item.criteria_scored} kriteria.</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Kriteria</th>
                      <th>Skor</th>
                      <th>Gap</th>
                      <th>Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.selfScores.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">Penilaian mandiri belum tersedia.</td></tr>
                    ) : summary.selfScores.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.criteria_code}</strong>
                          <br />
                          <small>{item.criterion?.title || "-"}</small>
                        </td>
                        <td>
                          {item.score}/{item.target_score}
                          <br />
                          <span className={`badge ${statusBadge(item.readiness_status)}`}>{item.readiness_status}</span>
                        </td>
                        <td>{item.gap}</td>
                        <td>
                          <strong>{item.gap_note}</strong>
                          <br />
                          <small>{item.recommendation}</small>
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

      <div className="row" id="rencana-perbaikan-akreditasi">
        <div className="col-xl-5">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Rencana Perbaikan Akreditasi</h4>
            </div>
            <div className="card-body">
              <form onSubmit={createActionPlan}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                      {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Kriteria</label>
                    <select className="form-control" name="criteria_code" defaultValue={summary.selfScores[0]?.criteria_code || summary.criteria[0]?.code || ""}>
                      {summary.criteria.map((item) => <option value={item.code} key={item.id}>{item.code} - {item.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Judul Perbaikan</label>
                  <input className="form-control" name="title" placeholder="Tutup gap K2 / lengkapi bukti K4 / sinkronkan LED K6" required />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Sumber</label>
                    <select className="form-control" name="source" defaultValue="self_score">
                      <option value="self_score">Self Score</option>
                      <option value="review">Review</option>
                      <option value="risk">Risk</option>
                      <option value="ami">AMI</option>
                      <option value="led">LED</option>
                    </select>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Prioritas</label>
                    <select className="form-control" name="priority" defaultValue="high">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="todo">
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>PIC</label>
                    <input className="form-control" name="owner" placeholder="pic@spmi.local" required />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Target Selesai</label>
                    <input className="form-control" name="target_date" type="date" />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Progress</label>
                    <input className="form-control" name="progress" type="number" min="0" max="100" defaultValue="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Aksi Perbaikan</label>
                  <textarea className="form-control" name="action" rows={3} placeholder="Langkah perbaikan yang harus dikerjakan..." required></textarea>
                </div>
                <div className="form-group">
                  <label>Output yang Diharapkan</label>
                  <textarea className="form-control" name="expected_output" rows={2} placeholder="Bukti, dokumen, data, atau narasi yang harus siap..." required></textarea>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-control" name="notes" rows={2} placeholder="Dependensi ke SIAKAD, HRIS, SPMI, AMI, atau unit..."></textarea>
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-tools mr-1"></i> Tambah Rencana
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-7">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Eksekusi Gap Perbaikan</h4>
            </div>
            <div className="card-body">
              {summary.actionPlans.length === 0 ? (
                <p className="text-muted">Rencana perbaikan akreditasi belum tersedia.</p>
              ) : summary.actionPlans.map((item) => (
                <div className="border-bottom py-3" key={item.id}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{item.title}</strong>
                      <p className="mb-1">{item.action}</p>
                      <small>{item.criteria_code || "-"} | {item.owner} | target {formatDate(item.target_date)}</small>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${statusBadge(item.priority)}`}>{item.priority}</span>
                      <span className={`badge ${statusBadge(item.status)} ml-1`}>{item.status}</span>
                      {item.overdue ? <span className="badge badge-danger ml-1">overdue</span> : null}
                    </div>
                  </div>
                  <div className="progress mt-2" style={{ height: 8 }}>
                    <div className={`progress-bar bg-${item.readiness_status === "ready" ? "success" : item.readiness_status === "risk" ? "danger" : "warning"}`} style={{ width: progressWidth(item.progress) }}></div>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small>{item.progress}%</small>
                    <small>{item.expected_output || item.notes || "-"}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row" id="review-akreditasi">
        <div className="col-xl-5">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Review Internal</h4>
            </div>
            <div className="card-body">
              <form onSubmit={createReview}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                      {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Entitas</label>
                    <select className="form-control" name="entity_type" defaultValue="led">
                      <option value="lkps">LKPS</option>
                      <option value="led">LED</option>
                      <option value="evidence">Bukti</option>
                      <option value="self_score">Skor Mandiri</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>ID Entitas</label>
                  <input className="form-control" name="entity_id" defaultValue={firstReviewEntityId} placeholder="LED-CNT-001 / LKPS-ENT-001 / AKR-EVD-001" />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Reviewer</label>
                    <input className="form-control" name="reviewer" placeholder="reviewer@spmi.local" required />
                  </div>
                  <div className="form-group col-md-6">
                    <label>Deadline Revisi</label>
                    <input className="form-control" name="due_date" type="date" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Keputusan</label>
                    <select className="form-control" name="decision" defaultValue="revise">
                      <option value="review">Review</option>
                      <option value="revise">Revisi</option>
                      <option value="approve">Approve</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="revision_required">
                      <option value="in_review">In Review</option>
                      <option value="revision_required">Perlu Revisi</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Catatan Review</label>
                  <textarea className="form-control" name="note" rows={3} placeholder="Catatan reviewer untuk tim akreditasi..." required></textarea>
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-comments mr-1"></i> Simpan Review
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-7">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Approval & Finalisasi</h4>
            </div>
            <div className="card-body">
              <form className="mb-4" onSubmit={updatePeriodStatus}>
                <div className="form-row">
                  <div className="form-group col-md-5">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                      {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-3">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="review">
                      <option value="draft">Draft</option>
                      <option value="berjalan">Berjalan</option>
                      <option value="review">Review</option>
                      <option value="final">Final</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Progress</label>
                    <input className="form-control" name="progress" type="number" min="0" max="100" defaultValue="80" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Catatan Finalisasi</label>
                  <input className="form-control" name="final_note" placeholder="Siap final / masih menunggu revisi..." />
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-check-circle mr-1"></i> Update Status
                </button>
              </form>

              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Entitas</th>
                      <th>Reviewer</th>
                      <th>Status</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.reviews.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">Review internal belum tersedia.</td></tr>
                    ) : summary.reviews.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.entity_type}</strong>
                          <br />
                          <small>{item.entity_id || "-"}</small>
                        </td>
                        <td>{item.reviewer}</td>
                        <td><span className={`badge ${statusBadge(item.status)}`}>{item.status}</span></td>
                        <td>
                          <strong>{item.decision}</strong>
                          <br />
                          <small>{item.note}</small>
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

      <div className="row" id="milestone-akreditasi">
        <div className="col-xl-5">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Milestone Akreditasi</h4>
            </div>
            <div className="card-body">
              <form onSubmit={createMilestone}>
                <div className="form-group">
                  <label>Periode</label>
                  <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                    {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Judul Milestone</label>
                  <input className="form-control" name="title" placeholder="Finalisasi LKPS / review LED / submit dokumen" required />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Fase</label>
                    <select className="form-control" name="phase" defaultValue="persiapan">
                      <option value="persiapan">Persiapan</option>
                      <option value="lkps">LKPS</option>
                      <option value="led">LED</option>
                      <option value="review">Review</option>
                      <option value="submit">Submit</option>
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Owner</label>
                    <input className="form-control" name="owner" placeholder="owner@spmi.local" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Mulai</label>
                    <input className="form-control" name="start_date" type="date" />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Deadline</label>
                    <input className="form-control" name="due_date" type="date" />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Progress</label>
                    <input className="form-control" name="progress" type="number" min="0" max="100" defaultValue="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" name="status" defaultValue="planned">
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-control" name="notes" rows={3} placeholder="Target, dependensi, atau risiko milestone..."></textarea>
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-stream mr-1"></i> Tambah Milestone
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-7">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Timeline Milestone</h4>
            </div>
            <div className="card-body">
              {summary.milestones.length === 0 ? (
                <p className="text-muted">Milestone akreditasi belum tersedia.</p>
              ) : summary.milestones.map((item) => (
                <div className="border-bottom py-3" key={item.id}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{item.title}</strong>
                      <p className="mb-1">{item.notes}</p>
                      <small>{item.phase} | {item.owner} | {formatDate(item.start_date)} - {formatDate(item.due_date)}</small>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
                      {item.overdue ? <span className="badge badge-danger ml-1">overdue</span> : null}
                    </div>
                  </div>
                  <div className="progress mt-2" style={{ height: 8 }}>
                    <div className={`progress-bar bg-${item.readiness_status === "ready" ? "success" : item.readiness_status === "risk" ? "danger" : "warning"}`} style={{ width: progressWidth(item.progress) }}></div>
                  </div>
                  <small>{item.progress}%</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row" id="risk-akreditasi">
        <div className="col-xl-5">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Risk Register Akreditasi</h4>
            </div>
            <div className="card-body">
              <form onSubmit={createRisk}>
                <div className="form-group">
                  <label>Periode</label>
                  <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                    {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Judul Risiko</label>
                  <input className="form-control" name="title" placeholder="Sinkronisasi SIAKAD terlambat / bukti belum valid" required />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Kategori</label>
                    <select className="form-control" name="category" defaultValue="integrasi">
                      <option value="integrasi">Integrasi</option>
                      <option value="bukti">Bukti</option>
                      <option value="lkps">LKPS</option>
                      <option value="led">LED</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Owner</label>
                    <input className="form-control" name="owner" placeholder="owner@spmi.local" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-3">
                    <label>Prob.</label>
                    <input className="form-control" name="probability" type="number" min="1" max="5" defaultValue="3" />
                  </div>
                  <div className="form-group col-md-3">
                    <label>Dampak</label>
                    <input className="form-control" name="impact" type="number" min="1" max="5" defaultValue="3" />
                  </div>
                  <div className="form-group col-md-3">
                    <label>Level</label>
                    <select className="form-control" name="level" defaultValue="medium">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="form-group col-md-3">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="open">
                      <option value="open">Open</option>
                      <option value="mitigating">Mitigating</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Deadline Mitigasi</label>
                  <input className="form-control" name="due_date" type="date" />
                </div>
                <div className="form-group">
                  <label>Mitigasi</label>
                  <textarea className="form-control" name="mitigation" rows={3} placeholder="Rencana mitigasi, fallback data, atau eskalasi ke unit..."></textarea>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-control" name="notes" rows={2} placeholder="Dampak ke LKPS, LED, bukti, atau review internal..."></textarea>
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-exclamation-triangle mr-1"></i> Tambah Risiko
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-7">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Monitoring Risiko</h4>
            </div>
            <div className="card-body table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Risiko</th>
                    <th>Owner</th>
                    <th>Skor</th>
                    <th>Mitigasi</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.risks.length === 0 ? (
                    <tr><td colSpan={4} className="text-center">Risk register akreditasi belum tersedia.</td></tr>
                  ) : summary.risks.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <br />
                        <small>{item.category} | {item.period?.name || item.period_id}</small>
                      </td>
                      <td>
                        {item.owner}
                        <br />
                        <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
                        {item.overdue ? <span className="badge badge-danger ml-1">overdue</span> : null}
                      </td>
                      <td>
                        <strong>{item.score}</strong>
                        <br />
                        <span className={`badge ${statusBadge(item.level)}`}>{item.level}</span>
                      </td>
                      <td>
                        <small>{formatDate(item.due_date)}</small>
                        <br />
                        {item.mitigation || item.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row" id="task-akreditasi">
        <div className="col-xl-5">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Task Akreditasi</h4>
            </div>
            <div className="card-body">
              <form onSubmit={createTask}>
                <div className="form-group">
                  <label>Periode</label>
                  <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                    {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Judul Task</label>
                  <input className="form-control" name="title" placeholder="Validasi LKPS / revisi LED / unggah bukti" required />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Kategori</label>
                    <select className="form-control" name="category" defaultValue="LKPS">
                      <option value="LKPS">LKPS</option>
                      <option value="LED">LED</option>
                      <option value="BUKTI">Bukti</option>
                      <option value="REVIEW">Review</option>
                      <option value="FINALISASI">Finalisasi</option>
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>PIC</label>
                    <input className="form-control" name="assignee" placeholder="pic@spmi.local" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Prioritas</label>
                    <select className="form-control" name="priority" defaultValue="medium">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="todo">
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Progress</label>
                    <input className="form-control" name="progress" type="number" min="0" max="100" defaultValue="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input className="form-control" name="due_date" type="date" />
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-control" name="notes" rows={3} placeholder="Dependensi, kendala, atau bukti yang dibutuhkan..."></textarea>
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-tasks mr-1"></i> Tambah Task
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-7">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Monitoring Task</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>PIC</th>
                      <th>Deadline</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.tasks.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">Task akreditasi belum tersedia.</td></tr>
                    ) : summary.tasks.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>
                          <br />
                          <small>{item.category} | {item.priority}</small>
                        </td>
                        <td>
                          {item.assignee}
                          <br />
                          <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
                          {item.overdue ? <span className="badge badge-danger ml-1">overdue</span> : null}
                        </td>
                        <td>{formatDate(item.due_date)}</td>
                        <td style={{ minWidth: 140 }}>
                          <div className="progress" style={{ height: 8 }}>
                            <div className={`progress-bar bg-${item.readiness_status === "ready" ? "success" : item.readiness_status === "risk" ? "danger" : "warning"}`} style={{ width: progressWidth(item.progress) }}></div>
                          </div>
                          <small>{item.progress}%</small>
                          {item.notes ? <p className="mb-0"><small>{item.notes}</small></p> : null}
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

      <div className="row" id="tim-akreditasi">
        <div className="col-xl-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Tim Akreditasi</h4>
            </div>
            <div className="card-body">
              <form className="mb-4" onSubmit={createTeamMember}>
                <div className="form-group">
                  <label>Periode</label>
                  <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                    {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Nama</label>
                    <input className="form-control" name="name" required />
                  </div>
                  <div className="form-group col-md-6">
                    <label>Role</label>
                    <select className="form-control" name="role" defaultValue="TIM_PENYUSUN">
                      <option value="ADMIN_AKREDITASI">Admin Akreditasi</option>
                      <option value="KAPRODI">Kaprodi</option>
                      <option value="TIM_PENYUSUN">Tim Penyusun</option>
                      <option value="REVIEWER">Reviewer</option>
                      <option value="OPERATOR">Operator</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-control" name="email" type="email" />
                </div>
                <div className="form-group">
                  <label>Tanggung Jawab</label>
                  <input className="form-control" name="responsibility" placeholder="Input LKPS / review LED / validasi bukti" />
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-user-plus mr-1"></i> Tambah Anggota
                </button>
              </form>

              {summary.teamMembers.map((member) => (
                <div className="d-flex justify-content-between border-bottom py-2" key={member.id}>
                  <div>
                    <strong>{member.name}</strong>
                    <p className="mb-0">{member.responsibility}</p>
                  </div>
                  <span className="badge badge-light">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xl-6" id="integrasi-akreditasi">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Integrasi Data Akreditasi</h4>
            </div>
            <div className="card-body">
              {summary.integrations.map((item) => (
                <div className="media mb-3" key={item.source}>
                  <span className="mr-3"><i className="la la-link text-success" style={{ fontSize: 26 }}></i></span>
                  <div className="media-body">
                    <h5 className="mb-1">{item.source}</h5>
                    <p className="mb-1">{item.data.join(", ")}</p>
                    <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
                  </div>
                </div>
              ))}
              <hr />
              <h5 id="checklist-submit-akreditasi">Checklist Submit</h5>
              <form className="mb-4" key={`checklist-${activePackagePeriodId}`} onSubmit={createSubmissionCheck}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
                      {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Kategori</label>
                    <select className="form-control" name="category" defaultValue="LKPS">
                      <option value="LKPS">LKPS</option>
                      <option value="LED">LED</option>
                      <option value="BUKTI">Bukti</option>
                      <option value="REVIEW">Review</option>
                      <option value="SUBMIT">Submit</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Item Checklist</label>
                  <input className="form-control" name="title" placeholder="LKPS lengkap / LED final / bukti valid / approval pimpinan" required />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Owner</label>
                    <input className="form-control" name="owner" placeholder="owner@spmi.local" required />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Verifier</label>
                    <input className="form-control" name="verifier" placeholder="reviewer@spmi.local" required />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="pending">
                      <option value="pending">Pending</option>
                      <option value="in_review">In Review</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Deadline</label>
                    <input className="form-control" name="due_date" type="date" />
                  </div>
                  <div className="form-group col-md-6">
                    <label>Bukti Terkait</label>
                    <select className="form-control" name="evidence_id" defaultValue="">
                      <option value="">Tanpa bukti</option>
                      {activePeriodEvidence.map((item) => <option value={item.id} key={item.id}>{item.id} - {item.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-control" name="notes" rows={2} placeholder="Catatan verifikasi submit..."></textarea>
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-clipboard-check mr-1"></i> Tambah Checklist
                </button>
              </form>
              {activePeriodSubmissionChecks.length === 0 ? (
                <p className="text-muted">Checklist submit belum tersedia.</p>
              ) : activePeriodSubmissionChecks.map((item) => (
                <div className="border rounded p-3 mb-3" key={item.id}>
                  <div className="d-flex justify-content-between">
                    <strong>{item.title}</strong>
                    <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
                  </div>
                  <small>{item.category} | {item.owner} | verifier {item.verifier}</small>
                  <div className="d-flex justify-content-between mt-2">
                    <small>{formatDate(item.due_date)}</small>
                    <small>{item.evidence?.title || item.notes || "-"}</small>
                  </div>
                  {item.overdue ? <span className="badge badge-danger mt-2">overdue</span> : null}
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Export Paket Akreditasi</h5>
                <div>
                  <button className="btn btn-outline-primary btn-sm mr-2" type="button" disabled={saving || visibleNewIssueChecklistCount === 0} onClick={createVisibleIssueChecklists}>
                    <i className="la la-clipboard-check mr-1"></i> Checklist Terlihat ({visibleNewIssueChecklistCount})
                  </button>
                  {shouldShowPackageSection("action_plan") ? (
                    <button className="btn btn-outline-primary btn-sm mr-2" type="button" disabled={saving || visibleNewActionPlanCount === 0} onClick={createVisibleActionPlans}>
                      <i className="la la-tools mr-1"></i> Rencana Terlihat ({visibleNewActionPlanCount})
                    </button>
                  ) : null}
                  {packageIssueCategory !== "all" ? (
                    <button className="btn btn-outline-secondary btn-sm mr-2" type="button" onClick={() => setPackageIssueCategory("all")}>
                      <i className="la la-th-list mr-1"></i> Semua Kategori
                    </button>
                  ) : null}
                  <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setShowOnlyPackageIssues((value) => !value)}>
                    <i className={`la ${showOnlyPackageIssues ? "la-list" : "la-filter"} mr-1`}></i>
                    {showOnlyPackageIssues ? "Semua Cek" : "Issue Saja"}
                  </button>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  Checklist terlihat: {visibleNewIssueChecklistCount} baru, {visibleExistingIssueChecklistCount} sudah ada.
                </small>
                {shouldShowPackageSection("action_plan") ? (
                  <small className="text-muted">
                    Rencana terlihat: {visibleNewActionPlanCount} baru, {visibleExistingActionPlanCount} sudah ada.
                  </small>
                ) : null}
              </div>
              <div className="row mb-3">
                {packageIssueSummary.map((item) => (
                  <div className="col-md-2 col-6" key={item.label}>
                    <button
                      className={`btn btn-block ${packageIssueCategory === item.key ? "btn-primary" : "btn-outline-secondary"} p-2`}
                      type="button"
                      onClick={() => {
                        setPackageIssueCategory((current) => current === item.key ? "all" : item.key);
                        setShowOnlyPackageIssues(true);
                      }}
                    >
                      <strong>{item.count}</strong>
                      <br />
                      <small>{item.label}</small>
                      <br />
                      <small>{packageIssueActionSummary[item.key]?.new || 0} baru / {packageIssueActionSummary[item.key]?.existing || 0} ada</small>
                    </button>
                  </div>
                ))}
              </div>
              {shouldShowPackageSection("readiness") ? (
              <div className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <strong>Kesiapan Paket</strong>
                  <span className={`badge ${statusBadge(packageReadiness.riskCount ? "risk" : packageReadiness.warningCount ? "warning" : "ready")}`}>
                    {packageReadiness.riskCount ? `${packageReadiness.riskCount} risk` : packageReadiness.warningCount ? `${packageReadiness.warningCount} warning` : "ready"}
                  </span>
                </div>
                <div className="row text-center mb-3">
                  <div className="col-3">
                    <strong>{packageReadiness.evidence.total}</strong>
                    <br />
                    <small>Total Bukti</small>
                  </div>
                  <div className="col-3">
                    <strong>{packageReadiness.evidence.valid}</strong>
                    <br />
                    <small>Valid</small>
                  </div>
                  <div className="col-3">
                    <strong>{packageReadiness.evidence.draft}</strong>
                    <br />
                    <small>Draft</small>
                  </div>
                  <div className="col-3">
                    <strong>{packageReadiness.evidence.revision}</strong>
                    <br />
                    <small>Revisi</small>
                  </div>
                </div>
                {visiblePackageReadinessItems.length === 0 ? (
                  <p className="text-muted mb-0">Tidak ada issue readiness.</p>
                ) : visiblePackageReadinessItems.map((item) => (
                  <div className="d-flex justify-content-between align-items-center border-bottom py-1" key={item.key}>
                    <small>{item.label}</small>
                    <div className="d-flex align-items-center">
                      <small className="mr-2">{item.count || 0}{item.open ? ` / ${item.open} open` : ""}</small>
                      <span className={`badge ${statusBadge(item.status)} mr-2`}>{item.status}</span>
                      {item.status !== "ready" ? (
                        <button className="btn btn-outline-secondary btn-xs" type="button" disabled={saving || hasOpenSubmissionCheck(readinessCheckIdentity(item))} onClick={() => createSubmissionCheckFromReadiness(item)}>
                          <i className={`la ${hasOpenSubmissionCheck(readinessCheckIdentity(item)) ? "la-check" : "la-plus"} mr-1`}></i>
                          {hasOpenSubmissionCheck(readinessCheckIdentity(item)) ? "Sudah Ada" : "Checklist"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              ) : null}
              {shouldShowPackageSection("evidence") ? (
              <div className="table-responsive mb-4">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Kriteria</th>
                      <th>Bukti</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEvidenceCoverage.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">{showOnlyPackageIssues ? "Tidak ada issue bukti." : "Coverage bukti belum tersedia."}</td></tr>
                    ) : visibleEvidenceCoverage.map((item) => (
                      <tr key={item.code}>
                        <td>
                          <strong>{item.code}</strong>
                          <br />
                          <small>{item.title}</small>
                        </td>
                        <td>
                          <strong>{item.valid}/{item.required}</strong> valid
                          <br />
                          <small>{item.total} total{item.open ? `, ${item.open} open` : ""}</small>
                        </td>
                        <td><span className={`badge ${statusBadge(item.status)}`}>{item.status}</span></td>
                        <td>
                          {item.status !== "ready" ? (
                            <button className="btn btn-outline-secondary btn-xs" type="button" disabled={saving || hasOpenSubmissionCheck(evidenceCheckIdentity(item))} onClick={() => createSubmissionCheckFromCoverage(item)}>
                              <i className={`la ${hasOpenSubmissionCheck(evidenceCheckIdentity(item)) ? "la-check" : "la-plus"} mr-1`}></i>
                              {hasOpenSubmissionCheck(evidenceCheckIdentity(item)) ? "Sudah Ada" : "Checklist"}
                            </button>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : null}
              {shouldShowPackageSection("led") ? (
              <div className="table-responsive mb-4">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Section LED</th>
                      <th>Draft</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLedCoverage.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">{showOnlyPackageIssues ? "Tidak ada issue LED." : "Coverage LED belum tersedia."}</td></tr>
                    ) : visibleLedCoverage.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.criteriaCode}</strong>
                          <br />
                          <small>{item.title}</small>
                        </td>
                        <td>
                          <strong>{item.ready}/{item.total}</strong> reviewed
                          <br />
                          <small>Status terakhir {item.latestStatus}</small>
                        </td>
                        <td><span className={`badge ${statusBadge(item.status)}`}>{item.status}</span></td>
                        <td>
                          {item.status !== "ready" ? (
                            <button className="btn btn-outline-secondary btn-xs" type="button" disabled={saving || hasOpenSubmissionCheck(ledCheckIdentity(item))} onClick={() => createSubmissionCheckFromLedCoverage(item)}>
                              <i className={`la ${hasOpenSubmissionCheck(ledCheckIdentity(item)) ? "la-check" : "la-plus"} mr-1`}></i>
                              {hasOpenSubmissionCheck(ledCheckIdentity(item)) ? "Sudah Ada" : "Checklist"}
                            </button>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : null}
              {shouldShowPackageSection("self_score") ? (
              <div className="table-responsive mb-4">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Kriteria</th>
                      <th>Skor</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSelfScoreCoverage.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">{showOnlyPackageIssues ? "Tidak ada issue self-assessment." : "Coverage self-assessment belum tersedia."}</td></tr>
                    ) : visibleSelfScoreCoverage.map((item) => (
                      <tr key={item.code}>
                        <td>
                          <strong>{item.code}</strong>
                          <br />
                          <small>{item.title}</small>
                        </td>
                        <td>
                          <strong>{item.score === null ? "-" : item.score}/{item.target}</strong>
                          <br />
                          <small>Gap {item.gap === null ? "-" : item.gap} | {item.reviewer}</small>
                        </td>
                        <td><span className={`badge ${statusBadge(item.status)}`}>{item.status}</span></td>
                        <td>
                          {item.status !== "ready" ? (
                            <button className="btn btn-outline-secondary btn-xs" type="button" disabled={saving || hasOpenSubmissionCheck(selfScoreCheckIdentity(item))} onClick={() => createSubmissionCheckFromSelfScoreCoverage(item)}>
                              <i className={`la ${hasOpenSubmissionCheck(selfScoreCheckIdentity(item)) ? "la-check" : "la-plus"} mr-1`}></i>
                              {hasOpenSubmissionCheck(selfScoreCheckIdentity(item)) ? "Sudah Ada" : "Checklist"}
                            </button>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : null}
              {shouldShowPackageSection("action_plan") ? (
              <div className="table-responsive mb-4">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Kriteria</th>
                      <th>Rencana</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleActionPlanCoverage.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">{showOnlyPackageIssues ? "Tidak ada issue rencana perbaikan." : "Coverage rencana perbaikan belum tersedia."}</td></tr>
                    ) : visibleActionPlanCoverage.map((item) => (
                      <tr key={item.code}>
                        <td>
                          <strong>{item.code}</strong>
                          <br />
                          <small>{item.title}</small>
                        </td>
                        <td>
                          <strong>{item.done}/{item.total}</strong> selesai
                          <br />
                          <small>Gap {item.gap}{item.open ? `, ${item.open} open` : ""}</small>
                        </td>
                        <td><span className={`badge ${statusBadge(item.status)}`}>{item.status}</span></td>
                        <td>
                          {item.status !== "ready" ? (
                            <button className="btn btn-outline-secondary btn-xs" type="button" disabled={saving || hasOpenActionPlan(actionPlanIdentity(item))} onClick={() => createActionPlanFromCoverage(item)}>
                              <i className={`la ${hasOpenActionPlan(actionPlanIdentity(item)) ? "la-check" : "la-plus"} mr-1`}></i>
                              {hasOpenActionPlan(actionPlanIdentity(item)) ? "Sudah Ada" : "Rencana"}
                            </button>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : null}
              {shouldShowPackageSection("review") ? (
              <div className="table-responsive mb-4">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Entitas</th>
                      <th>Review</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleReviewCoverage.length === 0 ? (
                      <tr><td colSpan={4} className="text-center">{showOnlyPackageIssues ? "Tidak ada issue review." : "Coverage review belum tersedia."}</td></tr>
                    ) : visibleReviewCoverage.map((item) => (
                      <tr key={item.key}>
                        <td>
                          <strong>{item.label}</strong>
                          <br />
                          <small>{item.total} item</small>
                        </td>
                        <td>
                          <strong>{item.approved}/{item.total}</strong> approved
                          <br />
                          <small>{item.open} open, {item.missing} belum direview</small>
                        </td>
                        <td><span className={`badge ${statusBadge(item.status)}`}>{item.status}</span></td>
                        <td>
                          {item.status !== "ready" ? (
                            <button className="btn btn-outline-secondary btn-xs" type="button" disabled={saving || hasOpenSubmissionCheck(reviewCheckIdentity(item))} onClick={() => createSubmissionCheckFromReviewCoverage(item)}>
                              <i className={`la ${hasOpenSubmissionCheck(reviewCheckIdentity(item)) ? "la-check" : "la-plus"} mr-1`}></i>
                              {hasOpenSubmissionCheck(reviewCheckIdentity(item)) ? "Sudah Ada" : "Checklist"}
                            </button>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : null}
              <form className="mb-4" onSubmit={createExport}>
                <div className={`alert ${packageGate.status === "ready" ? "alert-outline-success" : packageGate.status === "warning" ? "alert-outline-warning" : "alert-outline-danger"}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>{packageGate.label}</strong>
                    <span className={`badge ${statusBadge(packageGate.status)}`}>{packageGate.status}</span>
                  </div>
                  <small>{packageGate.riskCount} risk, {packageGate.warningCount} warning dari seluruh cek kesiapan paket.</small>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-7">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" value={activePackagePeriodId} onChange={(event) => setPackagePeriodId(event.target.value)}>
                      {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-5">
                    <label>Tipe Paket</label>
                    <select className="form-control" name="type" defaultValue="package_manifest">
                      <option value="package_manifest">Manifest JSON</option>
                      <option value="pdf">PDF Ringkasan</option>
                      <option value="zip">ZIP Evidence</option>
                    </select>
                  </div>
                </div>
                <button className={`btn ${packageGate.status === "ready" ? "btn-primary" : "btn-outline-primary"}`} type="submit" disabled={saving}>
                  <i className="la la-file-export mr-1"></i> {packageGate.label}
                </button>
              </form>
              {activePeriodExports.length === 0 ? (
                <p className="text-muted">Paket export belum tersedia.</p>
              ) : activePeriodExports.map((item) => (
                <div className="border rounded p-3 mb-3" key={item.id}>
                  <div className="d-flex justify-content-between">
                    <strong>{item.file_name}</strong>
                    <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
                  </div>
                  <small>
                    {item.period?.name || item.period_id} | {item.type} | {formatDate(item.generated_at)}
                  </small>
                  <div className="mt-2">
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => downloadExport(item.id, item.file_name)}>
                      <i className="la la-download mr-1"></i> Unduh Manifest
                    </button>
                  </div>
                  <div className="row mt-3">
                    <div className="col-md-2 col-4"><strong>{item.package_summary?.lkps_entries || 0}</strong><br /><small>LKPS</small></div>
                    <div className="col-md-2 col-4"><strong>{item.package_summary?.led_contents || 0}</strong><br /><small>LED</small></div>
                    <div className="col-md-2 col-4"><strong>{item.package_summary?.evidence || 0}</strong><br /><small>Bukti</small></div>
                    <div className="col-md-2 col-4"><strong>{item.package_summary?.action_plans || 0}</strong><br /><small>Rencana</small></div>
                    <div className="col-md-2 col-4"><strong>{item.package_summary?.submission_checks || 0}</strong><br /><small>Checklist</small></div>
                    <div className="col-md-2 col-4"><strong>{item.package_summary?.readiness_items || 0}</strong><br /><small>Cek Paket</small></div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-md-3 col-6">
                      <span className="badge badge-outline-warning">{item.package_summary?.open_action_plans || 0} rencana open</span>
                    </div>
                    <div className="col-md-3 col-6">
                      <span className="badge badge-outline-warning">{item.package_summary?.open_submission_checks || 0} checklist open</span>
                    </div>
                    <div className="col-md-3 col-6">
                      <span className="badge badge-outline-danger">{item.package_summary?.risk_items || 0} risk</span>
                    </div>
                    <div className="col-md-3 col-6">
                      <span className="badge badge-outline-warning">{item.package_summary?.warning_items || 0} warning</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    {(item.readiness_items || []).map((readiness) => (
                      <div className="d-flex justify-content-between border-bottom py-1" key={readiness.key}>
                        <small>{readiness.label}</small>
                        <span className={`badge ${statusBadge(readiness.status)}`}>{readiness.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <hr />
              <h5>Bukti Fisik</h5>
              <form className="mb-4" key={`evidence-${activePackagePeriodId}`} onSubmit={createEvidence}>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" value={activePackagePeriodId} onChange={(event) => setPackagePeriodId(event.target.value)}>
                      {summary.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Kriteria</label>
                    <select className="form-control" name="criteria_code" defaultValue={firstCriteriaCode}>
                      {summary.criteria.map((item) => <option value={item.code} key={item.id}>{item.code} - {item.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Judul Bukti</label>
                  <input className="form-control" name="title" placeholder="SK kurikulum / rekap dosen / laporan AMI" required />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-4">
                    <label>Sumber</label>
                    <select className="form-control" name="source_module" defaultValue="SPMI">
                      <option value="SIAKAD">SIAKAD</option>
                      <option value="HRIS">HRIS</option>
                      <option value="SPMI">SPMI</option>
                      <option value="AMI">AMI</option>
                      <option value="RTM">RTM</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Status</label>
                    <select className="form-control" name="status" defaultValue="draft">
                      <option value="draft">Draft</option>
                      <option value="perlu_revisi">Perlu Revisi</option>
                      <option value="valid">Valid</option>
                    </select>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Nama File</label>
                    <input className="form-control" name="file_name" placeholder="bukti.pdf" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Upload File</label>
                  <input className="form-control" name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/png,image/jpeg,image/webp" />
                </div>
                <div className="form-group">
                  <label>Link File</label>
                  <input className="form-control" name="file_url" placeholder="https://repository/bukti.pdf" />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Relasi LKPS</label>
                    <select className="form-control" name="linked_lkps_entry_id" defaultValue="">
                      <option value="">Tidak ditautkan</option>
                      {activePeriodLkpsEntries.map((item) => <option value={item.id} key={item.id}>{item.section?.code || item.section_id} - {item.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Relasi LED</label>
                    <select className="form-control" name="linked_led_content_id" defaultValue="">
                      <option value="">Tidak ditautkan</option>
                      {activePeriodLedContents.map((item) => <option value={item.id} key={item.id}>{item.section?.criteria_code || item.section_id} - v{item.version}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <input className="form-control" name="notes" placeholder="Catatan validasi bukti" />
                </div>
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-paperclip mr-1"></i> Simpan Bukti
                </button>
              </form>
              {activePeriodEvidence.map((item) => (
                <div className="border-bottom py-2" key={item.id}>
                  <div className="d-flex justify-content-between">
                    <strong>{item.criteria_code} - {item.title}</strong>
                    <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
                  </div>
                  <small>
                    {item.source_module}
                    {item.file_name ? ` | ${item.file_name}` : ""}
                    {item.lkps_entry ? ` | LKPS: ${item.lkps_entry.label}` : ""}
                    {item.led_content ? ` | LED: ${item.led_content.section?.criteria_code || item.led_content.section_id} v${item.led_content.version}` : ""}
                  </small>
                  {item.file_url ? (
                    <p className="mb-0 mt-1">
                      <a href={item.file_url} target="_blank" rel="noreferrer">{item.file_url}</a>
                    </p>
                  ) : null}
                  {item.notes ? <p className="mb-0 mt-1">{item.notes}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
