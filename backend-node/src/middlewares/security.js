const { addAuditLog } = require("../services/catalogStore");

function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

function actionFromRequest(req) {
  if (req.path === "/auth/login" && req.method === "POST") return "auth.login";
  if (req.path === "/auth/logout" && req.method === "POST") return "auth.logout";
  if (req.method === "GET") return "read";
  if (req.method === "POST") return "create";
  if (req.method === "PUT" || req.method === "PATCH") return "update";
  if (req.method === "DELETE") return "delete";
  return "request";
}

function auditTrail(req, res, next) {
  res.on("finish", () => {
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const isSecuritySignal = res.statusCode === 401 || res.statusCode === 403;
    if (!isMutation && !isSecuritySignal) return;

    addAuditLog({
      actor_id: req.user?.id || req.tokenPayload?.sub || null,
      actor_email: req.user?.email || req.body?.email || "anonymous",
      role: req.user?.role || req.tokenPayload?.role || null,
      action: isSecuritySignal ? `${actionFromRequest(req)}.denied` : actionFromRequest(req),
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
      metadata: {
        mode: req.user?.isLocal ? "local" : req.user ? "database" : "anonymous",
      },
    });
  });

  next();
}

module.exports = {
  securityHeaders,
  auditTrail,
};
