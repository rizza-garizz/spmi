const { failure } = require("../utils/apiResponse");

module.exports = function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return failure(res, "Autentikasi diperlukan", 401);
    }

    const roleAssignments = req.user.roleAssignments?.map((item) => item.role) || [];
    const assignedRoles = req.user.roles?.length
      ? req.user.roles
      : roleAssignments.length
        ? roleAssignments
        : [req.user.role];

    if (!assignedRoles.includes("super_admin") && !assignedRoles.some((role) => roles.includes(role))) {
      return failure(res, "Anda tidak memiliki akses ke resource ini", 403);
    }

    next();
  };
};
