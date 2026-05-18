import catalog from "@/data/spmi-catalog.json";

export const fallbackMetrics = [
  ...catalog.metrics,
];

export const fallbackDashboardModules = catalog.dashboardModules;

export const fallbackStandardCategories = catalog.standardCategories;
export const fallbackStandards = catalog.standards;

export const fallbackDocumentTypes = catalog.documentTypes;
export const fallbackImportTypes = catalog.importTypes;
export const fallbackPpeppSteps = catalog.ppeppSteps;
export const fallbackDocumentGroups = catalog.documentGroups;
export const fallbackQualityChecklist = catalog.qualityChecklist;
export const fallbackRoles = catalog.roles;
export const fallbackSeedUsers = catalog.seedUsers;
export const fallbackOrgUnits = catalog.orgUnits;
export const fallbackSurveyTargets = catalog.surveyTargets;

export const fallbackDocuments = catalog.documents;

export const fallbackPpeppCycles = catalog.ppeppCycles;

export const fallbackAmiAudits = catalog.amiAudits;

export const fallbackRtmMeetings = catalog.rtmMeetings;

export const fallbackSurveys = catalog.surveys;

export const fallbackIntegrations = catalog.integrations;

export const fallbackImports = catalog.imports;
