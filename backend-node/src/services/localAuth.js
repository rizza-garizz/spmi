const path = require("path");

const catalog = require(path.resolve(__dirname, "../../data/spmi-catalog.json"));

const roleMap = {
  admin: "admin_lpm",
  lpm: "admin_lpm",
  admin_lpm: "admin_lpm",
  auditor: "auditor",
  dekan: "dekan",
  wadek: "wakil_dekan",
  wakil_dekan: "wakil_dekan",
  kaprodi: "kaprodi",
  sekprodi: "sekprodi",
  unit: "unit_kerja",
  unit_kerja: "unit_kerja",
};

function buildOrgUnits() {
  const orgUnits = catalog.orgUnits || [];
  const idByCode = new Map(orgUnits.map((item, index) => [item.code, `local-org-${index + 1}`]));

  return orgUnits.map((item, index) => ({
    id: idByCode.get(item.code),
    name: item.name,
    code: item.code,
    type: item.type,
    parentId: item.parent_code ? idByCode.get(item.parent_code) || null : null,
  }));
}

function normalizeSeedUser(user) {
  const normalizedRole = roleMap[user.role] || "guest";
  const orgUnit = buildOrgUnits().find((item) => item.code === user.org_unit_code) || null;
  return {
    id: `local-${user.email}`,
    name: user.name,
    email: user.email,
    password: user.password,
    role: normalizedRole,
    roles: [normalizedRole],
    isActive: true,
    orgUnit,
    roleAssignments: [
      {
        role: normalizedRole,
        scopeOrgUnit: orgUnit,
      },
    ],
    isLocal: true,
  };
}

function getLocalUsers() {
  return (catalog.seedUsers || []).map(normalizeSeedUser);
}

function findLocalUserByEmail(email) {
  return getLocalUsers().find((user) => user.email === email) || null;
}

function findLocalUserById(id) {
  return getLocalUsers().find((user) => user.id === id) || null;
}

module.exports = {
  findLocalUserByEmail,
  findLocalUserById,
};
