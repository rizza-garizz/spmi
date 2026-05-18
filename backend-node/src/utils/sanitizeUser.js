module.exports = function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const roleAssignments = user.roleAssignments || [];
  const assignedRoles = roleAssignments.map((item) => item.role);
  const roles = user.roles?.length ? user.roles : assignedRoles.length ? assignedRoles : [user.role];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roles,
    is_active: user.isActive,
    institution: user.institution
      ? {
          id: user.institution.id,
          code: user.institution.code,
          name: user.institution.name,
        }
      : null,
    org_unit: user.orgUnit
      ? {
          id: user.orgUnit.id,
          name: user.orgUnit.name,
          code: user.orgUnit.code,
          type: user.orgUnit.type,
        }
      : null,
    role_assignments: roleAssignments.map((item) => ({
      role: item.role,
      scope_org_unit: item.scopeOrgUnit
        ? {
            id: item.scopeOrgUnit.id,
            name: item.scopeOrgUnit.name,
            code: item.scopeOrgUnit.code,
            type: item.scopeOrgUnit.type,
          }
        : null,
    })),
  };
};
