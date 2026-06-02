const prisma = require("../lib/prisma");
const env = require("../config/env");
const { addAuditLog: addLocalAuditLog, getAuditLogs: getLocalAuditLogs } = require("./catalogStore");

function normalizeAuditEntry(data = {}) {
  return {
    actor_id: data.actor_id || data.actorId || null,
    actor_email: data.actor_email || data.actorEmail || "anonymous",
    role: data.role || null,
    action: data.action || "request",
    entity: data.entity || null,
    entity_id: data.entity_id || data.entityId || null,
    method: data.method || null,
    path: data.path || null,
    status_code: data.status_code || data.statusCode || null,
    ip_address: data.ip_address || data.ipAddress || null,
    user_agent: data.user_agent || data.userAgent || null,
    before: data.before || null,
    after: data.after || null,
    metadata: data.metadata || {},
  };
}

function toPrismaAuditData(entry) {
  return {
    actorId: entry.actor_id,
    actorEmail: entry.actor_email,
    role: entry.role,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entity_id ? String(entry.entity_id) : null,
    method: entry.method,
    path: entry.path,
    statusCode: entry.status_code,
    ipAddress: entry.ip_address,
    userAgent: entry.user_agent,
    before: entry.before,
    after: entry.after,
    metadata: entry.metadata,
  };
}

async function recordAuditEvent(data = {}) {
  const entry = normalizeAuditEntry(data);
  const localEntry = addLocalAuditLog(entry);

  if (env.appMode !== "database") {
    return localEntry;
  }

  try {
    return await prisma.auditLog.create({
      data: toPrismaAuditData(entry),
    });
  } catch {
    return localEntry;
  }
}

async function listAuditEvents(filters = {}) {
  if (env.appMode === "database") {
    try {
      const actor = String(filters.actor || "").trim();
      const action = String(filters.action || "").trim();
      const where = {
        ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" } } : {}),
        ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      };
      const rows = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(Math.max(Number(filters.limit || 100) || 100, 1), 500),
      });

      return rows.map((row) => ({
        id: row.id,
        actor_id: row.actorId,
        actor_email: row.actorEmail,
        role: row.role,
        action: row.action,
        entity: row.entity,
        entity_id: row.entityId,
        method: row.method,
        path: row.path,
        status_code: row.statusCode,
        ip_address: row.ipAddress,
        user_agent: row.userAgent,
        before: row.before,
        after: row.after,
        metadata: row.metadata,
        created_at: row.createdAt,
      }));
    } catch {
      return getLocalAuditLogs(filters);
    }
  }

  return getLocalAuditLogs(filters);
}

async function recordApprovalHistory(data = {}) {
  if (env.appMode !== "database") {
    return null;
  }

  try {
    return await prisma.approvalHistory.create({
      data: {
        entity: String(data.entity || ""),
        entityId: String(data.entity_id || data.entityId || ""),
        step: String(data.step || ""),
        action: data.action,
        actorId: data.actor_id || data.actorId || null,
        actorEmail: data.actor_email || data.actorEmail || null,
        note: data.note || null,
        metadata: data.metadata || {},
      },
    });
  } catch {
    return null;
  }
}

module.exports = {
  recordAuditEvent,
  listAuditEvents,
  recordApprovalHistory,
};
