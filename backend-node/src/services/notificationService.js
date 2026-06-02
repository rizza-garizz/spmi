const { state, getIntegrationReadiness } = require("./catalogStore");
const { canAccessOrgUnit } = require("./accessPolicy");

function getUserKey(user = {}) {
  return user.email || user.username || user.id || "system";
}

function isReadable(user, item = {}, options = {}) {
  return canAccessOrgUnit(user, item.org_unit_code, options);
}

function buildApprovalNotifications(user) {
  const sources = [
    { entity: "documents", label: "Dokumen", items: state.documents || [] },
    { entity: "ppepp", label: "PPEPP", items: state.ppeppCycles || [] },
    { entity: "indicators", label: "Indikator", items: state.indicators || [] },
    { entity: "ami", label: "AMI", items: state.audits || [], options: { allowAuditor: true } },
  ];

  return sources.flatMap((source) =>
    source.items
      .filter((item) => !item.deleted_at && item.status !== "deleted")
      .filter((item) => item.approval && item.approval.status !== "approved")
      .filter((item) => isReadable(user, item, source.options))
      .map((item) => ({
        id: `approval-${source.entity}-${item.id}`,
        type: "approval",
        severity: item.approval.status === "rejected" ? "warning" : "info",
        title: `${source.label} menunggu approval`,
        message: `${item.title || item.name || item.code || item.id} berada pada tahap ${item.approval.step}.`,
        entity: source.entity,
        entity_id: String(item.id),
        read: false,
        created_at: item.approval.requested_at || item.updated_at || item.created_at || new Date().toISOString(),
      }))
  );
}

function buildRtlNotifications(user) {
  const today = new Date().toISOString().slice(0, 10);
  return (state.meetings || [])
    .flatMap((meeting) => meeting.actions || [])
    .filter((action) => !action.deleted_at && action.status !== "done")
    .filter((action) => isReadable(user, action))
    .filter((action) => action.due_date && action.due_date < today)
    .map((action) => ({
      id: `rtl-${action.id}`,
      type: "rtl",
      severity: "warning",
      title: "RTL melewati tenggat",
      message: `${action.title || action.description || action.id} melewati tenggat ${action.due_date}.`,
      entity: "rtl",
      entity_id: String(action.id),
      read: false,
      created_at: action.updated_at || action.due_date,
    }));
}

function buildIntegrationNotifications(user) {
  const roles = new Set(user?.roles || [user?.role].filter(Boolean));
  const isAdmin = roles.has("super_admin") || roles.has("admin_lpm");
  if (!isAdmin) return [];

  const readiness = getIntegrationReadiness();
  const connectors = Array.isArray(readiness) ? readiness : readiness?.connectors || [];

  return connectors
    .filter((item) => !["ok", "ready"].includes(item.readiness_status || item.status))
    .map((item) => ({
      id: `integration-${item.key}`,
      type: "integration",
      severity: item.readiness_status === "failed" ? "danger" : "warning",
      title: `Integrasi ${item.domain} perlu perhatian`,
      message: `Status readiness: ${item.readiness_status || item.status}.`,
      entity: "integrations",
      entity_id: item.key,
      read: false,
      created_at: item.last_sync_at || new Date().toISOString(),
    }));
}

function buildSecurityNotifications(user) {
  const roles = new Set(user?.roles || [user?.role].filter(Boolean));
  const isAdmin = roles.has("super_admin") || roles.has("admin_lpm");
  if (!isAdmin) return [];

  return (state.auditLogs || [])
    .filter((item) => String(item.action || "").endsWith(".denied"))
    .slice(0, 20)
    .map((item) => ({
      id: `security-${item.id}`,
      type: "security",
      severity: "danger",
      title: "Akses ditolak tercatat",
      message: `${item.actor_email || "anonymous"} ditolak pada ${item.path || item.entity || "resource"}.`,
      entity: item.entity || "security",
      entity_id: item.entity_id ? String(item.entity_id) : item.id,
      read: false,
      created_at: item.created_at,
    }));
}

function getNotifications(user, filters = {}) {
  const unreadOnly = String(filters.unread || "").toLowerCase() === "true";
  const type = String(filters.type || "").trim();
  const limit = Math.min(Math.max(Number(filters.limit || 25) || 25, 1), 100);
  const userKey = getUserKey(user);

  return [
    ...buildApprovalNotifications(user),
    ...buildRtlNotifications(user),
    ...buildIntegrationNotifications(user),
    ...buildSecurityNotifications(user),
  ]
    .map((item) => ({ ...item, user_key: userKey }))
    .filter((item) => !type || item.type === type)
    .filter((item) => !unreadOnly || !item.read)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

module.exports = {
  getNotifications,
};
