const INSTITUTION_ROLES = new Set(["admin_lpm"]);
const FACULTY_ROLES = new Set(["dekan", "wakil_dekan"]);
const PROGRAM_ROLES = new Set(["kaprodi", "sekprodi"]);
const UNIT_ROLES = new Set(["unit_kerja"]);
const AUDIT_ROLES = new Set(["auditor"]);

const ROLE_GROUPS = {
  admin: ["admin_lpm"],
  lpm_bpm: ["admin_lpm", "auditor"],
  fakultas: ["dekan", "wakil_dekan"],
  prodi: ["kaprodi", "sekprodi"],
  unit_pendukung: ["unit_kerja"],
  auditor: ["auditor"],
  pimpinan: ["dekan", "wakil_dekan"],
};

const APPROVAL_CHAIN = [
  { step: "draft", ownerRoles: ["unit_kerja", "sekprodi"], next: "review_prodi" },
  { step: "review_prodi", ownerRoles: ["kaprodi"], next: "review_fakultas" },
  { step: "review_fakultas", ownerRoles: ["dekan", "wakil_dekan"], next: "review_lpm" },
  { step: "review_lpm", ownerRoles: ["admin_lpm"], next: "approved" },
  { step: "approved", ownerRoles: ["admin_lpm"], next: null },
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
  return workflow.ownerRoles.some((role) => roles.includes(role));
}

function getScopeLevel(user) {
  const roles = getUserRoles(user);
  if (roles.some((role) => INSTITUTION_ROLES.has(role))) return "institution";
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
  getScopeLevel,
};
