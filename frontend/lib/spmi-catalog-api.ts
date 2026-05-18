import {
  fallbackAmiAudits,
  fallbackDashboardModules,
  fallbackDocuments,
  fallbackDocumentGroups,
  fallbackImports,
  fallbackIntegrations,
  fallbackMetrics,
  fallbackQualityChecklist,
  fallbackPpeppCycles,
  fallbackRtmMeetings,
  fallbackRoles,
  fallbackOrgUnits,
  fallbackSeedUsers,
  fallbackStandardCategories,
  fallbackStandards,
  fallbackSurveyTargets,
  fallbackSurveys,
  fallbackDocumentTypes,
  fallbackImportTypes,
  fallbackPpeppSteps,
} from "@/lib/spmi-catalog-data";

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
  history: number[];
};

type SiakadIntegrationMapItem = {
  key: string;
  source: string;
  siakadData: string;
  spmiUse: string;
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

export async function getDashboardSummary() {
  return fetchJson("/dashboard/summary", {
    metrics: fallbackMetrics as DashboardMetric[],
    modules: fallbackDashboardModules as DashboardModule[],
    performance: [] as DashboardPerformanceItem[],
  });
}

export async function getCatalogSnapshot() {
  return fetchJson("/catalog", {
    metrics: fallbackMetrics,
    standardCategories: fallbackStandardCategories,
    standards: fallbackStandards,
    documentTypes: fallbackDocumentTypes,
    importTypes: fallbackImportTypes,
    documents: fallbackDocuments,
    ppeppCycles: fallbackPpeppCycles,
    amiAudits: fallbackAmiAudits,
    rtmMeetings: fallbackRtmMeetings,
    surveys: fallbackSurveys,
    integrations: fallbackIntegrations,
    siakadIntegrationMap: [] as SiakadIntegrationMapItem[],
    imports: fallbackImports,
    dashboardModules: fallbackDashboardModules,
    ppeppSteps: fallbackPpeppSteps,
    documentGroups: fallbackDocumentGroups,
    qualityChecklist: fallbackQualityChecklist,
    roles: fallbackRoles,
    orgUnits: fallbackOrgUnits,
    surveyTargets: fallbackSurveyTargets,
    seedUsers: fallbackSeedUsers.map(({ name, email, role }) => ({ name, email, role })),
  });
}

export async function getStandards() {
  return fetchJson("/standards", fallbackStandards);
}

export async function getDocuments() {
  const data = await fetchJson("/documents", fallbackDocuments);
  return { data };
}

export async function getPpeppCycles() {
  return fetchJson("/ppepp/cycles", fallbackPpeppCycles);
}

export async function getAmiAudits() {
  const data = await fetchJson("/ami/audits", fallbackAmiAudits);
  return { data };
}

export async function getRtmMeetings() {
  const data = await fetchJson("/rtm/meetings", fallbackRtmMeetings);
  return { data };
}

export async function getSurveys() {
  const data = await fetchJson("/surveys", fallbackSurveys);
  return { data };
}

export async function getIntegrations() {
  const sources = await fetchJson("/integrations", fallbackIntegrations);
  return { sources };
}

export async function getImports() {
  const data = await fetchJson("/imports", fallbackImports);
  return { data };
}
