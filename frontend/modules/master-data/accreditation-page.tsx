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

type AccreditationReadinessItem = {
  key: string;
  label: string;
  status: string;
  count?: number;
  open?: number;
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
    readiness_items?: number;
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
  evidence: AccreditationEvidence[];
  lkpsSections: AccreditationLkpsSection[];
  lkpsEntries: AccreditationLkpsEntry[];
  ledSections: AccreditationLedSection[];
  ledContents: AccreditationLedContent[];
  selfScores: AccreditationSelfScore[];
  scoring: AccreditationScoringSummary[];
  reviews: AccreditationReview[];
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
  evidence: [],
  lkpsSections: [],
  lkpsEntries: [],
  ledSections: [],
  ledContents: [],
  selfScores: [],
  scoring: [],
  reviews: [],
  exports: [],
  integrations: [],
};

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (["ready", "valid", "selesai", "final", "aktif", "approved", "generated", "done"].includes(normalized)) return "badge-success";
  if (["warning", "kuning", "berjalan", "review", "perlu_revisi", "revision_required", "in_review", "needs_attention", "todo", "in_progress", "blocked"].includes(normalized)) return "badge-warning";
  return "badge-danger";
}

function progressWidth(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function AccreditationPage() {
  const [summary, setSummary] = useState<AccreditationSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const firstInstrumentId = summary.instruments[0]?.id || "";
  const firstPeriodId = summary.periods[0]?.id || "";
  const firstCriteriaCode = summary.criteria[0]?.code || "";
  const firstLkpsSectionId = summary.lkpsSections[0]?.id || "";
  const firstLedSectionId = summary.ledSections[0]?.id || "";
  const firstLkpsEntryId = summary.lkpsEntries[0]?.id || "";
  const firstLedContentId = summary.ledContents[0]?.id || "";
  const firstReviewEntityId = summary.ledContents[0]?.id || "";

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
    postJson(
      "/accreditation/evidence",
      {
        period_id: form.get("period_id"),
        criteria_code: form.get("criteria_code"),
        title: form.get("title"),
        source_module: form.get("source_module"),
        status: form.get("status"),
        file_name: form.get("file_name"),
        file_url: form.get("file_url"),
        linked_lkps_entry_id: form.get("linked_lkps_entry_id") || null,
        linked_led_content_id: form.get("linked_led_content_id") || null,
        notes: form.get("notes"),
      },
      "Bukti fisik berhasil disimpan."
    );
    event.currentTarget.reset();
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
                    <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
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
              <h5>Export Paket Akreditasi</h5>
              <form className="mb-4" onSubmit={createExport}>
                <div className="form-row">
                  <div className="form-group col-md-7">
                    <label>Periode</label>
                    <select className="form-control" name="period_id" defaultValue={firstPeriodId}>
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
                <button className="btn btn-outline-primary" type="submit" disabled={saving}>
                  <i className="la la-file-export mr-1"></i> Generate Paket
                </button>
              </form>
              {summary.exports.length === 0 ? (
                <p className="text-muted">Paket export belum tersedia.</p>
              ) : summary.exports.map((item) => (
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
                    <div className="col-4"><strong>{item.package_summary?.lkps_entries || 0}</strong><br /><small>LKPS</small></div>
                    <div className="col-4"><strong>{item.package_summary?.led_contents || 0}</strong><br /><small>LED</small></div>
                    <div className="col-4"><strong>{item.package_summary?.evidence || 0}</strong><br /><small>Bukti</small></div>
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
              <form className="mb-4" onSubmit={createEvidence}>
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
                  <label>Link File</label>
                  <input className="form-control" name="file_url" placeholder="https://repository/bukti.pdf" />
                </div>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Relasi LKPS</label>
                    <select className="form-control" name="linked_lkps_entry_id" defaultValue={firstLkpsEntryId}>
                      <option value="">Tidak ditautkan</option>
                      {summary.lkpsEntries.map((item) => <option value={item.id} key={item.id}>{item.section?.code || item.section_id} - {item.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group col-md-6">
                    <label>Relasi LED</label>
                    <select className="form-control" name="linked_led_content_id" defaultValue={firstLedContentId}>
                      <option value="">Tidak ditautkan</option>
                      {summary.ledContents.map((item) => <option value={item.id} key={item.id}>{item.section?.criteria_code || item.section_id} - v{item.version}</option>)}
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
              {summary.evidence.map((item) => (
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
