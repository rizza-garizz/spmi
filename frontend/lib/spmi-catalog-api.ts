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
  history: number[];
};

type DashboardSummary = {
  metrics: DashboardMetric[];
  modules: DashboardModule[];
  performance: DashboardPerformanceItem[];
  kpi?: {
    total_indicators: number;
    average_achievement: number;
    achieved: number;
    warning: number;
    risk: number;
    executive_score: number;
  };
  standardAchievement?: Array<{ group: string; total: number; achievement: number }>;
  filters?: Record<string, string>;
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

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  if (!apiBaseUrl) {
    return fallback;
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: "no-store",
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
  roles: [] as Array<{ name: string; scope: string }>,
  orgUnits: [] as Array<{ code: string; parent_code?: string; name: string; type: string }>,
  surveyTargets: [] as Array<{ value: string; label: string }>,
  seedUsers: [] as Array<{ name: string; email: string; role: string }>,
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
  return fetchJson<DashboardSummary>(`/dashboard/summary${query ? `?${query}` : ""}`, {
    metrics: [] as DashboardMetric[],
    modules: [] as DashboardModule[],
    performance: [] as DashboardPerformanceItem[],
    standardAchievement: [],
  });
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
