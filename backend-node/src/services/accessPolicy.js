const INSTITUTION_ROLES = new Set(["super_admin", "admin_lpm"]);
const LPM_ROLES = new Set(["lpm", "admin_lpm"]);
const FACULTY_ROLES = new Set(["dekan", "wakil_dekan"]);
const PROGRAM_ROLES = new Set(["kaprodi", "sekprodi"]);
const UNIT_ROLES = new Set(["unit_kerja", "operator"]);
const AUDIT_ROLES = new Set(["auditor"]);
const catalog = require("../../data/spmi-catalog.json");

const ROLE_GROUPS = {
  admin: ["super_admin", "admin_lpm"],
  lpm_bpm: ["lpm", "admin_lpm", "auditor"],
  fakultas: ["dekan", "wakil_dekan"],
  prodi: ["kaprodi", "sekprodi"],
  unit_pendukung: ["unit_kerja", "operator"],
  auditor: ["auditor"],
  pimpinan: ["dekan", "wakil_dekan"],
};

const APPROVAL_CHAIN = [
  { step: "draft", ownerRoles: ["unit_kerja", "operator", "sekprodi"], next: "review_prodi" },
  { step: "review_prodi", ownerRoles: ["kaprodi"], next: "review_fakultas" },
  { step: "review_fakultas", ownerRoles: ["dekan", "wakil_dekan"], next: "review_lpm" },
  { step: "review_lpm", ownerRoles: ["lpm", "admin_lpm", "super_admin"], next: "approved" },
  { step: "approved", ownerRoles: ["lpm", "admin_lpm", "super_admin"], next: null },
];

function getUserRoles(user) {
  const roleAssignments = user?.roleAssignments?.map((item) => item.role) || [];
  if (Array.isArray(user?.roles) && user.roles.length > 0) return user.roles;
  if (roleAssignments.length > 0) return roleAssignments;
  return user?.role ? [user.role] : [];
}

function getPrimaryScope(user) {
  return user?.orgUnit || user?.roleAssignments?.find((item) => item.scopeOrgUnit)?.scopeOrgUnit || null;
}

function isInstitutionWide(user) {
  return getUserRoles(user).some((role) => INSTITUTION_ROLES.has(role));
}

function canApproveStep(user, step) {
  const workflow = APPROVAL_CHAIN.find((item) => item.step === step);
  if (!workflow) return false;
  const roles = getUserRoles(user);
  return roles.includes("super_admin") || workflow.ownerRoles.some((role) => roles.includes(role));
}

function getOrgUnitCode(user) {
  return getPrimaryScope(user)?.code || null;
}

function getOrgUnitByCode(code) {
  return (catalog.orgUnits || []).find((item) => item.code === code) || null;
}

function isChildOf(childCode, parentCode) {
  if (!childCode || !parentCode) return false;
  let current = getOrgUnitByCode(childCode);
  while (current?.parent_code) {
    if (current.parent_code === parentCode) return true;
    current = getOrgUnitByCode(current.parent_code);
  }
  return false;
}

function canAccessOrgUnit(user, targetOrgUnitCode, options = {}) {
  if (!targetOrgUnitCode) return true;
  if (!user) return false;

  const roles = getUserRoles(user);
  if (roles.some((role) => INSTITUTION_ROLES.has(role))) return true;
  if (roles.some((role) => LPM_ROLES.has(role))) return true;
  if (options.allowAuditor && roles.some((role) => AUDIT_ROLES.has(role))) return true;

  const scopeCode = getOrgUnitCode(user);
  if (!scopeCode) return false;
  if (scopeCode === targetOrgUnitCode) return true;

  if (roles.some((role) => FACULTY_ROLES.has(role))) {
    return isChildOf(targetOrgUnitCode, scopeCode);
  }

  return false;
}

function scopeItemForUser(data, user) {
  const orgUnitCode = data.org_unit_code || data.orgUnitCode || getOrgUnitCode(user);
  return {
    ...data,
    org_unit_code: orgUnitCode || null,
  };
}

function getInitialApproval(user) {
  const level = getScopeLevel(user);
  const step = level === "institution" ? "review_lpm" : level === "faculty" ? "review_fakultas" : "draft";
  return {
    step,
    status: step === "draft" ? "draft" : "in_review",
    requested_by: user?.email || null,
    requested_at: new Date().toISOString(),
    history: [],
  };
}

function nextApprovalStep(step) {
  return APPROVAL_CHAIN.find((item) => item.step === step)?.next || null;
}

function transitionApproval(item, user, action, note = "") {
  const current = item.approval || getInitialApproval(user);
  const now = new Date().toISOString();
  const history = [
    ...(current.history || []),
    {
      step: current.step,
      action,
      actor: user?.email || null,
      roles: getUserRoles(user),
      note,
      at: now,
    },
  ];

  if (action === "submit") {
    return {
      ...current,
      step: nextApprovalStep("draft") || "review_prodi",
      status: "in_review",
      submitted_by: user?.email || null,
      submitted_at: now,
      history,
    };
  }

  if (action === "reject") {
    if (!canApproveStep(user, current.step)) return null;
    return {
      ...current,
      status: "rejected",
      rejected_by: user?.email || null,
      rejected_at: now,
      note,
      history,
    };
  }

  if (action === "approve") {
    if (!canApproveStep(user, current.step)) return null;
    const next = nextApprovalStep(current.step);
    const isApproved = !next || next === "approved";
    return {
      ...current,
      step: next || "approved",
      status: isApproved ? "approved" : "in_review",
      approved_by: user?.email || null,
      approved_at: now,
      history,
    };
  }

  return null;
}

function getScopeLevel(user) {
  const roles = getUserRoles(user);
  if (roles.some((role) => INSTITUTION_ROLES.has(role))) return "institution";
  if (roles.some((role) => LPM_ROLES.has(role))) return "institution";
  if (roles.some((role) => FACULTY_ROLES.has(role))) return "faculty";
  if (roles.some((role) => PROGRAM_ROLES.has(role))) return "program";
  if (roles.some((role) => UNIT_ROLES.has(role))) return "unit";
  if (roles.some((role) => AUDIT_ROLES.has(role))) return "audit";
  return "guest";
}

module.exports = {
  ROLE_GROUPS,
  APPROVAL_CHAIN,
  getUserRoles,
  getPrimaryScope,
  isInstitutionWide,
  canApproveStep,
  canAccessOrgUnit,
  getOrgUnitCode,
  scopeItemForUser,
  getInitialApproval,
  transitionApproval,
  getScopeLevel,
};
