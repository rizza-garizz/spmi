import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/spmi-session-client";

const isServer = typeof window === "undefined";
const apiBaseUrl = isServer
  ? process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:4000"
  : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

type DashboardMetric = {
  label: string;
  value: number;
};

type DashboardModule = {
  key: string;
  label: string;
  scope: string;
};

type DashboardPerformanceItem = {
  code: string;
  name: string;
  actual: number;
  target: number;
  unit: string;
  status: string;
  period?: string;
  standard?: { id?: number | string; code: string; title: string } | null;
  org_unit_code?: string;
  fakultas?: string;
  prodi?: string;
  achievement?: number;
  history: Array<number | { period: string; value: number }>;
};

type DashboardSummary = {
  metrics: DashboardMetric[];
  modules: DashboardModule[];
  performance: DashboardPerformanceItem[];
  source?: {
    type: string;
    tables: string[];
  };
  institution?: {
    name: string | null;
    academic_year: string | null;
    system_name: string | null;
  };
  kpi?: {
    total_indicators: number;
    average_achievement: number;
    achieved: number;
    warning: number;
    risk: number;
    executive_score: number;
    predicate?: string;
  };
  accreditation?: {
    score: number;
    predicate: string;
    criteria: Array<{ label: string; score: number }>;
    insight: string;
  };
  cycle?: {
    academic_year: string | null;
    active_cycles: number;
    phase: string | null;
    source: string;
  };
  standardAchievement?: Array<{ group: string; total: number; achievement: number }>;
  filters?: Record<string, string>;
  filterOptions?: {
    faculties: Array<{ code: string; name: string }>;
    studyPrograms: Array<{ code: string; name: string }>;
    standards: Array<{ code: string; title: string }>;
    years: number[];
  };
};

type SiakadIntegrationMapItem = {
  key: string;
  source: string;
  siakadData: string;
  spmiUse: string;
};

type HrisCatalog = {
  metrics: Array<{ label: string; value: number }>;
  employees: Array<{
    id: string;
    name: string;
    employeeNumber: string;
    nidn: string;
    type: string;
    status: string;
    unit: string;
    position: string;
    functionalPosition: string;
    education: string;
    email: string;
  }>;
  positions: Array<{ id?: string; title: string; unit: string; holder: string; period: string; status: string }>;
  competencies: Array<{ id?: string; employee: string; category: string; name: string; year: number; status: string }>;
  documents: Array<{
    id?: string;
    employee: string;
    type: string;
    title: string;
    status: string;
    fileName?: string | null;
    filePath?: string | null;
    fileSize?: number;
  }>;
  spmiLinks: string[];
};

type HrisEmployeeProfile = {
  employee: HrisCatalog["employees"][number];
  positions: HrisCatalog["positions"];
  competencies: HrisCatalog["competencies"];
  documents: HrisCatalog["documents"];
};

export type IntegrationConnector = {
  key: string;
  domain: string;
  status: string;
  endpoint?: string | null;
  owner?: string;
  master_data?: string[];
  sync_direction?: string;
  last_sync_at?: string | null;
  last_status?: string;
  error_count?: number;
  readiness_status?: string;
  checks?: Record<
    string,
    {
      status: string;
      message: string;
      record_count?: number;
      direction?: string;
      sources?: string[];
      items?: Array<unknown>;
      latest_log_id?: string | null;
      retry_policy?: string;
    }
  >;
};

export type DataSyncMap = {
  generated_at: string;
  summary: {
    status: string;
    relationship_total: number;
    ok: number;
    warning: number;
    module_total: number;
  };
  modules: Record<string, Record<string, unknown>>;
  relationships: Array<{
    key: string;
    source: string;
    target: string;
    status: string;
    linked: number;
    missing: number;
    business_rule: string;
  }>;
  warnings: Array<{ key: string; message: string; missing: number }>;
};

const emptyDataSyncMap: DataSyncMap = {
  generated_at: "",
  summary: {
    status: "warning",
    relationship_total: 0,
    ok: 0,
    warning: 0,
    module_total: 0,
  },
  modules: {},
  relationships: [],
  warnings: [],
};

const fallbackRoles = [
  {
    name: "super_admin",
    scope: "Seluruh menu, konfigurasi sistem, integrasi, import, role, dan akses lintas unit.",
  },
  {
    name: "lpm",
    scope: "Pengelolaan proses mutu, standar, dokumen, AMI, PPEPP, RTM, akreditasi, dan approval LPM.",
  },
  {
    name: "admin_lpm",
    scope: "Role legacy untuk kompatibilitas akun lama.",
  },
  {
    name: "auditor",
    scope: "AMI, temuan, rekomendasi, evaluasi, dan laporan audit.",
  },
  {
    name: "dekan",
    scope: "Monitoring mutu tingkat fakultas, akreditasi, RTM, dan pengawalan keputusan strategis.",
  },
  {
    name: "wakil_dekan",
    scope: "Monitoring mutu fakultas dan koordinasi tindak lanjut sesuai bidang pimpinan fakultas.",
  },
  {
    name: "kaprodi",
    scope: "Operasional mutu program studi, dokumen prodi, indikator, PPEPP, dan RTL.",
  },
  {
    name: "sekprodi",
    scope: "Dukungan operasional prodi melalui input data, pembaruan dokumen, dan monitoring harian.",
  },
  {
    name: "unit_kerja",
    scope: "Input implementasi, dokumen, indikator, dan tindak lanjut unit kerja.",
  },
  {
    name: "operator",
    scope: "Input operasional tanpa akses pengaturan sistem atau approval pimpinan.",
  },
];

const fallbackSeedUsers = [
  { name: "SPMI Admin", email: "admin@spmi.local", role: "super_admin" },
  { name: "LPM Mutu", email: "lpm@spmi.local", role: "lpm" },
  { name: "Internal Auditor", email: "auditor@spmi.local", role: "auditor" },
  { name: "Dekan Fakultas", email: "dekan@spmi.local", role: "dekan" },
  { name: "Wakil Dekan", email: "wadek@spmi.local", role: "wakil_dekan" },
  { name: "Ketua Program Studi", email: "kaprodi@spmi.local", role: "kaprodi" },
  { name: "Sekretaris Program Studi", email: "sekprodi@spmi.local", role: "sekprodi" },
  { name: "Unit Operator", email: "unit@spmi.local", role: "unit_kerja" },
  { name: "Operator SPMI", email: "operator@spmi.local", role: "operator" },
];

const emptyDashboardSummary: DashboardSummary = {
  metrics: [],
  modules: [],
  performance: [],
  source: {
    type: "unavailable",
    tables: [],
  },
  kpi: {
    total_indicators: 0,
    average_achievement: 0,
    achieved: 0,
    warning: 0,
    risk: 0,
    executive_score: 0,
    predicate: "PERLU PEMBINAAN",
  },
  accreditation: {
    score: 0,
    predicate: "PERLU PEMBINAAN",
    criteria: [],
    insight: "Data dashboard belum tersedia untuk sesi ini.",
  },
  cycle: {
    academic_year: null,
    active_cycles: 0,
    phase: null,
    source: "SystemSetting",
  },
  standardAchievement: [],
  filters: {},
  filterOptions: {
    faculties: [],
    studyPrograms: [],
    standards: [],
    years: [],
  },
};

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  if (!apiBaseUrl) {
    return fallback;
  }

  try {
    const headers = new Headers();

    if (isServer) {
      const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: "no-store",
      headers,
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as
      | T
      | {
          success?: boolean;
          data?: T;
        };

    if (
      payload &&
      typeof payload === "object" &&
      "success" in payload &&
      "data" in payload
    ) {
      return (payload.data ?? fallback) as T;
    }

    return payload as T;
  } catch {
    return fallback;
  }
}

async function fetchJsonStrict<T>(path: string): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL belum dikonfigurasi.");
  }

  const headers = new Headers();

  if (isServer) {
    const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Dashboard API gagal: ${response.status}`);
  }

  const payload = (await response.json()) as
    | T
    | {
        success?: boolean;
        data?: T;
      };

  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return payload.data as T;
  }

  return payload as T;
}

const emptyCatalog = {
  metrics: [] as DashboardMetric[],
  standardCategories: [] as Array<{ key: string; label: string; scope: string }>,
  standards: [] as Array<{
    id?: string | number;
    code: string;
    title: string;
    category: string;
    description: string;
    status?: string;
    version?: string;
    revisions?: Array<unknown>;
  }>,
  documentTypes: [] as Array<{ value: string; label: string }>,
  importTypes: [] as Array<{ value: string; label: string }>,
  documents: [] as Array<{ id: number; title: string; type: string; status: string }>,
  ppeppCycles: [] as Array<{
    id: number | string;
    name: string;
    period: string;
    status: string;
    progress?: number;
    current_stage?: string;
    stages?: Array<{
      key: string;
      label: string;
      description: string;
      deliverable: string;
      status: string;
      progress: number;
      evidence: Array<unknown>;
    }>;
    timeline?: Array<unknown>;
  }>,
  amiAudits: [] as Array<{
    id: number | string;
    title?: string;
    org_unit: { name: string };
    org_unit_code?: string;
    audit_date?: string;
    scheduled_date?: string;
    auditor?: { name: string; email?: string; role?: string };
    instruments?: Array<unknown>;
    findings?: Array<unknown>;
    recap?: {
      total_findings: number;
      categories: { minor: number; mayor: number; observasi: number };
      follow_up_open: number;
      follow_up_done: number;
      verified: number;
      unverified: number;
      instrument_checked: number;
      instrument_total: number;
      score: number;
    };
    score: number;
    status: string;
    timeline?: Array<unknown>;
  }>,
  rtmMeetings: [] as Array<{ id: number; title: string; status: string }>,
  surveys: [] as Array<{ id: number; title: string; target: string }>,
  integrations: [] as IntegrationConnector[],
  siakadIntegrationMap: [] as SiakadIntegrationMapItem[],
  imports: [] as Array<{ id: number; type: string; title: string; status: string }>,
  dashboardModules: [] as DashboardModule[],
  ppeppSteps: [] as Array<{ code: string; name: string; description: string; deliverable: string }>,
  documentGroups: [] as string[],
  qualityChecklist: [] as Array<{ key: string; label: string; description: string }>,
  roles: fallbackRoles,
  orgUnits: [] as Array<{ code: string; parent_code?: string; name: string; type: string }>,
  surveyTargets: [] as Array<{ value: string; label: string }>,
  seedUsers: fallbackSeedUsers,
  news: [] as Array<{ id: number | string; category: string; title: string; excerpt: string; date: string; author: string }>,
  hris: {
    metrics: [],
    employees: [],
    positions: [],
    competencies: [],
    documents: [],
    spmiLinks: [],
  } as HrisCatalog,
};

export async function getDashboardSummary(filters: Record<string, string> = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => Boolean(value))
  ).toString();
  return fetchJson<DashboardSummary>(`/dashboard/summary${query ? `?${query}` : ""}`, emptyDashboardSummary);
}

export async function getCatalogSnapshot() {
  return fetchJson("/catalog", emptyCatalog);
}

export async function getStandards() {
  return fetchJson("/standards", emptyCatalog.standards);
}

export async function getDocuments() {
  const data = await fetchJson("/documents", emptyCatalog.documents);
  return { data };
}

export async function getPpeppCycles() {
  return fetchJson("/ppepp/cycles", emptyCatalog.ppeppCycles);
}

export async function getAmiAudits() {
  const data = await fetchJson("/ami/audits", emptyCatalog.amiAudits);
  return { data };
}

export async function getRtmMeetings() {
  const data = await fetchJson("/rtm/meetings", emptyCatalog.rtmMeetings);
  return { data };
}

export async function getSurveys() {
  const data = await fetchJson("/surveys", emptyCatalog.surveys);
  return { data };
}

export async function getIntegrations() {
  const sources = await fetchJson("/integrations", emptyCatalog.integrations);
  return { sources };
}

export async function getDataSyncMap() {
  return fetchJson<DataSyncMap>("/sync/map", emptyDataSyncMap);
}

export async function getImports() {
  const data = await fetchJson("/imports", emptyCatalog.imports);
  return { data };
}

export async function getHrisSummary() {
  return fetchJson("/hris", emptyCatalog.hris);
}

export async function getHrisEmployeeProfile(id: string) {
  return fetchJson<HrisEmployeeProfile | null>(`/hris/employees/${encodeURIComponent(id)}`, null);
}
