const { recordAuditEvent } = require("../services/auditService");

function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
}

function actionFromRequest(req) {
  if (req.path === "/auth/login" && req.method === "POST") return "auth.login";
  if (req.path === "/auth/logout" && req.method === "POST") return "auth.logout";
  if (req.path.startsWith("/governance/") && req.method === "PATCH") {
    const action = String(req.body?.action || "").toLowerCase();
    if (action === "approve") return "approval.approve";
    if (action === "reject") return "approval.reject";
    if (action === "submit") return "approval.submit";
  }
  if (req.method === "GET") return "read";
  if (req.method === "POST") return "create";
  if (req.method === "PUT" || req.method === "PATCH") return "update";
  if (req.method === "DELETE") return "delete";
  return "request";
}

function auditTrail(req, res, next) {
  res.on("finish", () => {
    if (res.locals.skipAuditTrail) return;

    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const isSecuritySignal = res.statusCode === 401 || res.statusCode === 403;
    if (!isMutation && !isSecuritySignal) return;

    const auditActor = res.locals.auditActor || req.user || {};
    const entityMatch = req.path.match(/^\/([^/]+)(?:\/([^/]+))?/);
    const entity = req.path.startsWith("/governance/")
      ? req.params?.entity || null
      : entityMatch?.[1] || null;
    const entityId = req.path.startsWith("/governance/")
      ? req.params?.id || null
      : req.params?.id || entityMatch?.[2] || null;

    recordAuditEvent({
      actor_id: auditActor.id || req.user?.id || req.tokenPayload?.sub || null,
      actor_email: auditActor.email || req.user?.email || req.body?.email || "anonymous",
      role: auditActor.role || req.user?.role || req.tokenPayload?.role || null,
      action: isSecuritySignal ? `${actionFromRequest(req)}.denied` : actionFromRequest(req),
      entity,
      entity_id: entityId,
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
      metadata: {
        mode: req.user?.isLocal ? "local" : req.user ? "database" : "anonymous",
        approval_action: req.path.startsWith("/governance/") ? req.body?.action || null : null,
      },
    }).catch(() => {});
  });

  next();
}

module.exports = {
  securityHeaders,
  auditTrail,
};
