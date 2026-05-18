const path = require("path");

const catalog = require(path.resolve(__dirname, "../../../frontend/data/spmi-catalog.json"));

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

function normalizeSeedUser(user) {
  const normalizedRole = roleMap[user.role] || "guest";
  return {
    id: `local-${user.email}`,
    name: user.name,
    email: user.email,
    password: user.password,
    role: normalizedRole,
    roles: [normalizedRole],
    isActive: true,
    orgUnit: null,
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
