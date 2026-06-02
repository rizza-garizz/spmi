const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const env = require("../config/env");
const { success } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const sanitizeUser = require("../utils/sanitizeUser");
const { findLocalUserByEmail } = require("../services/localAuth");
const { blacklistLocalToken } = require("../services/catalogStore");

function signToken(user) {
  const assignedRoles = user.roleAssignments?.map((item) => item.role) || [];
  const roles = user.roles?.length ? user.roles : assignedRoles.length ? assignedRoles : [user.role];
  return jwt.sign(
    {
      role: user.role,
      roles,
      email: user.email,
      mode: user.isLocal ? "local" : "database",
      jti: crypto.randomUUID(),
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      subject: user.id,
    }
  );
}

async function login(req, res) {
  const { email, password } = req.body;
  let user = null;

  if (env.appMode === "database") {
    try {
      user = await prisma.user.findFirst({
        where: {
          email,
          deletedAt: null,
          isActive: true,
        },
        include: {
          orgUnit: true,
          institution: true,
          roleAssignments: {
            include: {
              scopeOrgUnit: true,
            },
          },
        },
      });
    } catch {
      user = null;
    }
  }

  if (!user) {
    const localUser = findLocalUserByEmail(email);
    if (localUser && await bcrypt.compare(password, localUser.passwordHash)) {
      const token = signToken(localUser);
      const decoded = jwt.decode(token) || {};
      res.locals.auditActor = localUser;

      return success(
        res,
        {
          token,
          expires_at: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
          session_timeout_seconds: env.sessionTimeoutSeconds,
          user: sanitizeUser(localUser),
          roles: localUser.roles,
          mode: "local",
        },
        "Login lokal berhasil"
      );
    }
  }

  if (!user) {
    throw new AppError("Email atau password salah", 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw new AppError("Email atau password salah", 401);
  }

  const token = signToken(user);
  const decoded = jwt.decode(token) || {};
  res.locals.auditActor = user;

  return success(
    res,
    {
      token,
      expires_at: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
      session_timeout_seconds: env.sessionTimeoutSeconds,
      user: sanitizeUser(user),
      roles: sanitizeUser(user).roles,
      mode: "database",
    },
    "Login berhasil"
  );
}

async function logout(req, res) {
  if (req.user?.isLocal) {
    blacklistLocalToken(req.token, new Date((req.tokenPayload.exp || 0) * 1000));
    return success(res, null, "Logout lokal berhasil");
  }

  const expiresAt = new Date((req.tokenPayload.exp || 0) * 1000);

  await prisma.tokenBlacklist.upsert({
    where: { token: req.token },
    update: { expiresAt },
    create: {
      token: req.token,
      expiresAt,
    },
  });

  return success(res, null, "Logout berhasil");
}

async function me(req, res) {
  return success(
    res,
    {
      ...sanitizeUser(req.user),
      mode: req.user?.isLocal ? "local" : "database",
    },
    "Profil pengguna"
  );
}

module.exports = {
  login,
  logout,
  me,
};
